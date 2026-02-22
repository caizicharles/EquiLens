"""LLM run configuration.

The YAML config file is the single source of truth — every field is
required (no hidden defaults).  ``strict=True`` enforces exact types,
and ``extra="ignore"`` silently drops keys that belong to other tools
(e.g. ``num_samples`` / ``stratify_column`` used by the processing
scripts) so the same YAML can drive both data preparation and inference.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field, field_validator


class LLMConfig(BaseModel):
    """Complete specification of a single evaluation run.

    Loaded from a YAML file in ``configs/``.  A copy of the YAML is saved
    alongside the results Parquet for full reproducibility.

    All fields (except ``poll_interval``) are **required** — there are no
    silent defaults.  If a YAML config omits a field, Pydantic raises a
    ``ValidationError`` at load time.
    """

    model_config = ConfigDict(strict=True, extra="ignore")

    # Model — required
    model_name: str
    provider: Literal["claude", "gpt5"]

    # Generation — required
    temperature: float
    seed: int
    max_tokens: int

    # Data — required
    data_path: str

    # Prompts — required
    system_prompt: str
    user_prompt: str

    # Output — required
    output_dir: str

    # Dataset schema — required (makes the pipeline dataset-agnostic)
    id_columns: list[str] = Field(
        description="DataFrame columns used to build a unique row identifier "
        "(e.g. ['question_id', 'adv_group'] for AMQA, ['id'] for MedMCQA).",
    )
    answer_column: str = Field(
        description="Column containing the ground-truth answer letter "
        "(e.g. 'answer_idx' for AMQA, 'answer' for MedMCQA).",
    )

    # Optional dataset / run controls
    summary_groupby: Optional[list[str]] = Field(
        default=None,
        description="Columns to group by when logging accuracy breakdowns. "
        "Set to null to skip subgroup summaries.",
    )

    # Provider-specific — genuinely optional
    poll_interval: Optional[int] = Field(
        default=None,
        description="Seconds between batch status checks. "
        "Required for Claude and GPT-5 batch providers.",
    )

    @field_validator("id_columns")
    @classmethod
    def _id_columns_non_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("id_columns must contain at least one column name.")
        return v

    # ── Factory ──────────────────────────────────────────────────────────

    @classmethod
    def from_yaml(cls, path: Path | str) -> LLMConfig:
        """Load and validate a run config from a YAML file.

        Raises ``pydantic.ValidationError`` if any required field is
        missing, an unknown field is present, or a type doesn't match.
        """
        path = Path(path)
        with path.open() as fh:
            raw = yaml.safe_load(fh)
        return cls(**raw)
