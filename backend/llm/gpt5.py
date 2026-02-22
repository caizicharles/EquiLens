"""GPT-5 (OpenAI) provider — batch API with structured output.

Uses the OpenAI Batch API (file-based JSONL upload → batch create → poll
→ download results) with ``response_format`` for structured A/B/C/D
output.  Reasoning effort is set to ``low`` for cost/latency efficiency.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import time

import pandas as pd
from openai import OpenAI

from llm.config import LLMConfig
from llm.prompts import format_user_prompt
from llm.schemas import MCQResponse
from llm.provider import LLMProvider, register_provider

logger = logging.getLogger(__name__)


@register_provider("gpt5")
class GPT5Provider(LLMProvider):
    """Runs evaluation via the OpenAI Batch API.

    Structured output is enforced through ``response_format`` with a
    JSON schema derived from :class:`MCQResponse`, guaranteeing that every
    successful response is exactly ``{"answer": "A"|"B"|"C"|"D"}``.

    Reasoning effort is set to ``low`` on every request.
    """

    def __init__(self) -> None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY not found. Set it in a .env file or as an "
                "environment variable."
            )
        self._client = OpenAI(api_key=api_key)

    # ── Public interface ─────────────────────────────────────────────────

    def run(
        self,
        df: pd.DataFrame,
        config: LLMConfig,
        system_prompt: str,
        user_template: str,
    ) -> pd.DataFrame:
        requests = self._build_batch_requests(
            df, config, system_prompt, user_template
        )
        batch_id = self._upload_and_submit(requests)
        self._poll_batch(batch_id, interval=config.poll_interval or 30)
        result_map = self._retrieve_results(batch_id)
        return self._merge_results(df, result_map, batch_id, config)

    # ── Internal helpers ─────────────────────────────────────────────────

    def _make_custom_id(self, row: pd.Series, config: LLMConfig) -> str:
        """Build a composite key from the configured ``id_columns``."""
        return "__".join(str(row[col]) for col in config.id_columns)

    def _build_batch_requests(
        self,
        df: pd.DataFrame,
        config: LLMConfig,
        system_prompt: str,
        user_template: str,
    ) -> list[dict]:
        """Construct one JSONL request dict per DataFrame row."""
        schema = MCQResponse.model_json_schema()
        requests: list[dict] = []

        for _, row in df.iterrows():
            user_content = format_user_prompt(user_template, row)
            custom_id = self._make_custom_id(row, config)

            req = {
                "custom_id": custom_id,
                "method": "POST",
                "url": "/v1/chat/completions",
                "body": {
                    "model": config.model_name,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "seed": config.seed,
                    "max_completion_tokens": config.max_tokens,
                    "reasoning_effort": "low",
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": "MCQResponse",
                            "strict": True,
                            "schema": schema,
                        },
                    },
                },
            }
            requests.append(req)

        logger.info("Built %d batch requests.", len(requests))
        return requests

    def _upload_and_submit(self, requests: list[dict]) -> str:
        """Write JSONL to a temp file, upload, and create a batch.

        Returns the batch ID.
        """
        # Write requests as JSONL to a temp file
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".jsonl", delete=False
        )
        try:
            for req in requests:
                tmp.write(json.dumps(req) + "\n")
            tmp.close()

            # Upload the file
            with open(tmp.name, "rb") as f:
                file_obj = self._client.files.create(
                    file=f, purpose="batch"
                )
            logger.info("Uploaded batch input file: %s", file_obj.id)

            # Create the batch
            batch = self._client.batches.create(
                input_file_id=file_obj.id,
                endpoint="/v1/chat/completions",
                completion_window="24h",
            )
            logger.info(
                "Created batch %s  (%d requests, status: %s).",
                batch.id,
                len(requests),
                batch.status,
            )
            return batch.id
        finally:
            # Clean up temp file
            import pathlib

            pathlib.Path(tmp.name).unlink(missing_ok=True)

    def _poll_batch(self, batch_id: str, interval: int = 30) -> None:
        """Block until the batch reaches a terminal status."""
        terminal_statuses = {
            "completed",
            "failed",
            "expired",
            "cancelled",
        }
        logger.info("Polling batch %s every %ds …", batch_id, interval)
        while True:
            batch = self._client.batches.retrieve(batch_id)
            if batch.status in terminal_statuses:
                counts = batch.request_counts
                logger.info(
                    "Batch %s %s — completed: %d, failed: %d, total: %d.",
                    batch_id,
                    batch.status,
                    counts.completed,
                    counts.failed,
                    counts.total,
                )
                if batch.status != "completed":
                    raise RuntimeError(
                        f"Batch {batch_id} ended with status '{batch.status}'."
                    )
                if counts.completed == 0 and counts.failed > 0:
                    logger.warning(
                        "All %d requests failed. Check error file for details.",
                        counts.failed,
                    )
                return
            logger.info(
                "  status: %s | completed: %d / %d",
                batch.status,
                batch.request_counts.completed,
                batch.request_counts.total,
            )
            time.sleep(interval)

    def _retrieve_results(
        self, batch_id: str
    ) -> dict[str, dict[str, str | None]]:
        """Download the output file and parse structured responses.

        Returns
        -------
        dict
            ``{custom_id: {"response": "A"|…|None, "result_status": "succeeded"|…}}``
        """
        batch = self._client.batches.retrieve(batch_id)
        if not batch.output_file_id:
            if batch.error_file_id:
                error_content = self._client.files.content(
                    batch.error_file_id
                )
                for line in error_content.text.strip().split("\n"):
                    if line:
                        logger.error("Batch error entry: %s", line)
            else:
                logger.error(
                    "Batch %s has no output or error file.", batch_id
                )
            return {}

        content = self._client.files.content(batch.output_file_id)
        result_map: dict[str, dict[str, str | None]] = {}

        for line in content.text.strip().split("\n"):
            if not line:
                continue
            entry = json.loads(line)
            cid = entry["custom_id"]
            response_body = entry.get("response", {})
            status_code = response_body.get("status_code", 0)

            if status_code == 200:
                try:
                    body = response_body["body"]
                    choice = body["choices"][0]
                    finish_reason = choice.get("finish_reason", "unknown")
                    message_content = choice["message"]["content"]

                    if finish_reason == "length":
                        logger.warning(
                            "Token limit reached for %s "
                            "(finish_reason='length', content=%r). "
                            "Increase max_tokens in config.",
                            cid,
                            (message_content or "")[:100],
                        )
                        result_map[cid] = {
                            "response": None,
                            "result_status": "token_limit",
                        }
                        continue

                    if not message_content:
                        logger.warning(
                            "Empty content for %s "
                            "(finish_reason=%s).",
                            cid,
                            finish_reason,
                        )
                        result_map[cid] = {
                            "response": None,
                            "result_status": "empty_content",
                        }
                        continue

                    parsed = MCQResponse.model_validate_json(message_content)
                    result_map[cid] = {
                        "response": parsed.answer,
                        "result_status": "succeeded",
                    }
                except Exception as exc:
                    logger.warning(
                        "Parse error for %s: %s (content=%r)",
                        cid,
                        exc,
                        (message_content or "")[:200],
                    )
                    result_map[cid] = {
                        "response": None,
                        "result_status": "parse_error",
                    }
            else:
                error_msg = response_body.get("body", {}).get(
                    "error", {}).get("message", "unknown error")
                logger.warning(
                    "Non-success for %s: status %d — %s",
                    cid, status_code, error_msg,
                )
                result_map[cid] = {
                    "response": None,
                    "result_status": "errored",
                }

        logger.info(
            "Retrieved %d results (%d succeeded).",
            len(result_map),
            sum(1 for v in result_map.values()
                if v["result_status"] == "succeeded"),
        )
        return result_map

    def _merge_results(
        self,
        df: pd.DataFrame,
        result_map: dict[str, dict[str, str | None]],
        batch_id: str,
        config: LLMConfig,
    ) -> pd.DataFrame:
        """Join API results back onto the original DataFrame."""
        df = df.copy()

        # Build the composite key for each row to look up results
        df["_custom_id"] = (
            df[config.id_columns]
            .astype(str)
            .agg("__".join, axis=1)
        )

        df["response"] = df["_custom_id"].map(
            lambda cid: result_map.get(cid, {}).get("response")
        )
        df["result_status"] = df["_custom_id"].map(
            lambda cid: result_map.get(cid, {}).get(
                "result_status", "missing"
            )
        )
        df["batch_id"] = batch_id

        df = df.drop(columns=["_custom_id"])
        return df
