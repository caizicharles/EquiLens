"""Structured output schemas for LLM responses.

These Pydantic models define the JSON schemas that providers use to
constrain model output (Claude ``output_config.format``, OpenAI
``response_format``).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class MCQResponse(BaseModel):
    """Schema for structured multiple-choice answer output.

    Both Claude (``output_config.format``) and OpenAI GPT-5
    (``response_format``) use this to guarantee valid responses.
    """

    model_config = {"json_schema_extra": {"additionalProperties": False}}

    answer: Literal["A", "B", "C", "D"] = Field(
        description="The single best answer letter."
    )
