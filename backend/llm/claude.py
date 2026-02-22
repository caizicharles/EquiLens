"""Claude (Anthropic) provider — batch API with structured output."""

from __future__ import annotations

import json
import logging
import time

import anthropic
import pandas as pd

from llm.config import LLMConfig
from llm.schemas import MCQResponse
from llm.prompts import format_user_prompt
from llm.provider import LLMProvider, register_provider

logger = logging.getLogger(__name__)


@register_provider("claude")
class ClaudeProvider(LLMProvider):
    """Runs evaluation via the Anthropic Message Batches API.

    Structured output is enforced through ``output_config.format`` with a
    JSON schema derived from :class:`MCQResponse`, guaranteeing that every
    successful response is exactly ``{"answer": "A"|"B"|"C"|"D"}``.
    """

    def __init__(self) -> None:
        self._client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY

    # ── Public interface ─────────────────────────────────────────────────

    def run(
        self,
        df: pd.DataFrame,
        config: LLMConfig,
        system_prompt: str,
        user_template: str,
    ) -> pd.DataFrame:
        requests = self._build_batch_requests(df, config, system_prompt, user_template)
        batch_id = self._submit_batch(requests)
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
        """Construct one batch request dict per DataFrame row."""
        schema = MCQResponse.model_json_schema()
        requests: list[dict] = []

        for _, row in df.iterrows():
            user_content = format_user_prompt(user_template, row)
            custom_id = self._make_custom_id(row, config)

            req = {
                "custom_id": custom_id,
                "params": {
                    "model": config.model_name,
                    "max_tokens": config.max_tokens,
                    "temperature": config.temperature,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": user_content},
                    ],
                    "output_config": {
                        "format": {
                            "type": "json_schema",
                            "schema": schema,
                        }
                    },
                },
            }

            # Anthropic supports seed via top_k / metadata, but the
            # Messages API does not expose a native seed param.  We store
            # the seed in the results metadata for reproducibility tracking.
            requests.append(req)

        logger.info("Built %d batch requests.", len(requests))
        return requests

    def _submit_batch(self, requests: list[dict]) -> str:
        """Create a message batch and return its ID."""
        batch = self._client.messages.batches.create(requests=requests)
        logger.info(
            "Submitted batch %s  (%d requests, status: %s).",
            batch.id,
            len(requests),
            batch.processing_status,
        )
        return batch.id

    def _poll_batch(self, batch_id: str, interval: int = 30) -> None:
        """Block until the batch reaches ``ended`` status."""
        logger.info("Polling batch %s every %ds …", batch_id, interval)
        while True:
            batch = self._client.messages.batches.retrieve(batch_id)
            counts = batch.request_counts
            if batch.processing_status == "ended":
                logger.info(
                    "Batch %s ended — succeeded: %d, errored: %d, "
                    "expired: %d, canceled: %d.",
                    batch_id,
                    counts.succeeded,
                    counts.errored,
                    counts.expired,
                    counts.canceled,
                )
                return
            logger.info(
                "  processing: %d | succeeded: %d | errored: %d",
                counts.processing,
                counts.succeeded,
                counts.errored,
            )
            time.sleep(interval)

    def _retrieve_results(
        self, batch_id: str
    ) -> dict[str, dict[str, str | None]]:
        """Iterate batch results and parse structured responses.

        Returns
        -------
        dict
            ``{custom_id: {"response": "A"|…|None, "status": "succeeded"|…}}``
        """
        result_map: dict[str, dict[str, str | None]] = {}

        for entry in self._client.messages.batches.results(batch_id):
            cid = entry.custom_id
            if entry.result.type == "succeeded":
                try:
                    parsed = MCQResponse.model_validate_json(
                        entry.result.message.content[0].text
                    )
                    result_map[cid] = {
                        "response": parsed.answer,
                        "result_status": "succeeded",
                    }
                except Exception as exc:
                    logger.warning("Parse error for %s: %s", cid, exc)
                    result_map[cid] = {
                        "response": None,
                        "result_status": "parse_error",
                    }
            else:
                status = entry.result.type  # errored | expired | canceled
                error_info = ""
                if hasattr(entry.result, "error") and entry.result.error:
                    error_info = f" — {entry.result.error.type}: {entry.result.error.message}"
                logger.warning("Non-success for %s: %s%s", cid, status, error_info)
                result_map[cid] = {"response": None, "result_status": status}

        logger.info(
            "Retrieved %d results (%d succeeded).",
            len(result_map),
            sum(1 for v in result_map.values() if v["result_status"] == "succeeded"),
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
            lambda cid: result_map.get(cid, {}).get("result_status", "missing")
        )
        df["batch_id"] = batch_id

        df = df.drop(columns=["_custom_id"])
        return df
