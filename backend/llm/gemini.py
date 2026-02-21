"""Gemini (Google) provider — synchronous calls with structured output.

Uses the ``google-genai`` SDK with ``response_mime_type`` +
``response_schema`` for structured A/B/C/D output.  Calls are made
sequentially with rate-limiting since Gemini does not offer a batch API.
"""

from __future__ import annotations

import logging
import os
import time

import pandas as pd
from google import genai
from google.genai import types as genai_types

from llm.config import LLMConfig
from llm.prompts import format_user_prompt
from llm.schemas import MCQResponse
from llm.provider import LLMProvider, register_provider

logger = logging.getLogger(__name__)

# Default rate limit (requests per minute) for Gemini free tier.
DEFAULT_RPM = 15
# Log progress every N rows.
LOG_EVERY = 50


@register_provider("gemini")
class GeminiProvider(LLMProvider):
    """Runs evaluation via sequential Google Gemini API calls.

    Structured output is enforced through ``response_mime_type`` +
    ``response_schema``, guaranteeing that every successful response
    is parseable as ``{"answer": "A"|"B"|"C"|"D"}``.
    """

    def __init__(self) -> None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY not found. Set it in a .env file or as an "
                "environment variable."
            )
        self._client = genai.Client(api_key=api_key)

    # ── Public interface ─────────────────────────────────────────────────

    def run(
        self,
        df: pd.DataFrame,
        config: LLMConfig,
        system_prompt: str,
        user_template: str,
    ) -> pd.DataFrame:
        logger.info(
            "Gemini provider: %d rows, model=%s, temperature=%s",
            len(df), config.model_name, config.temperature,
        )
        if config.seed is not None:
            logger.info(
                "Note: Gemini does not support a seed parameter; "
                "seed=%d will be recorded in metadata but not sent to the API.",
                config.seed,
            )

        min_interval = 60.0 / DEFAULT_RPM
        responses: list[str | None] = []
        statuses: list[str] = []
        succeeded = 0
        errored = 0

        schema = MCQResponse.model_json_schema()

        for i, (_, row) in enumerate(df.iterrows()):
            user_content = format_user_prompt(user_template, row)

            t0 = time.time()
            try:
                result = self._client.models.generate_content(
                    model=config.model_name,
                    contents=user_content,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=config.temperature,
                        max_output_tokens=config.max_tokens,
                        response_mime_type="application/json",
                        response_schema=schema,
                    ),
                )
                # Parse the structured JSON response
                parsed = MCQResponse.model_validate_json(result.text)
                responses.append(parsed.answer)
                statuses.append("succeeded")
                succeeded += 1

            except Exception as exc:
                logger.warning("Error on row %d: %s", i, exc)
                responses.append(None)
                statuses.append("errored")
                errored += 1

            # Rate limiting
            elapsed = time.time() - t0
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)

            # Progress logging
            if (i + 1) % LOG_EVERY == 0 or i == len(df) - 1:
                logger.info(
                    "  [%d/%d]  succeeded: %d  errored: %d",
                    i + 1, len(df), succeeded, errored,
                )

        # Assemble result DataFrame
        df = df.copy()
        df["response"] = responses
        df["result_status"] = statuses

        logger.info(
            "Gemini run complete — succeeded: %d, errored: %d.",
            succeeded, errored,
        )
        return df
