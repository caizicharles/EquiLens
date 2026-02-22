"""Analysis configuration model.

Mirrors the ``LLMConfig`` pattern in ``backend/llm/config.py`` — a strict
Pydantic model with a ``from_yaml`` factory that is the single source of
truth for every analysis run.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ── Sub-models ───────────────────────────────────────────────────────────────


class BiasTypeGroups(BaseModel):
    """Names of the majority / minority adversarial groups for one bias type."""

    model_config = ConfigDict(strict=True, extra="forbid")

    majority: str
    minority: str


class CityComposition(BaseModel):
    """Demographic composition for a single city across all bias types.

    Each key is a bias type (e.g. ``ethnicity``) mapping to a dict of
    ``{group_name: proportion}``.  Proportions must sum to 1.0.
    """

    model_config = ConfigDict(strict=True, extra="forbid")

    ethnicity: dict[str, float]
    gender: dict[str, float]
    SES: dict[str, float]

    @model_validator(mode="after")
    def _proportions_sum_to_one(self) -> CityComposition:
        for bias_type in ("ethnicity", "gender", "SES"):
            comp = getattr(self, bias_type)
            total = sum(comp.values())
            if abs(total - 1.0) > 1e-6:
                raise ValueError(
                    f"{bias_type} proportions sum to {total:.4f}, expected 1.0"
                )
        return self


# ── Main config ──────────────────────────────────────────────────────────────


class AnalysisConfig(BaseModel):
    """Complete specification for a city-based equity analysis run.

    Parameters
    ----------
    dataset : str
        Dataset identifier (e.g. ``"amqa"``).
    model : str
        Model name (e.g. ``"claude-sonnet-4-6"``).
    result_path : str
        Relative path (from project root) to the results Parquet file.
    n_samples : int
        Number of unique questions in the results file.
    random_seed : int
        Seed for reproducible random group assignment.
    bias_type_groups : dict[str, BiasTypeGroups]
        Mapping from bias type name → majority/minority group names.
    cities : dict[str, CityComposition]
        Mapping from city name → demographic composition.
    """

    model_config = ConfigDict(strict=True, extra="forbid")

    dataset: str
    model: str
    result_path: str
    n_samples: int = Field(gt=0)
    random_seed: int
    bias_type_groups: dict[str, BiasTypeGroups]
    cities: dict[str, CityComposition]

    # ── Factory ──────────────────────────────────────────────────────

    @classmethod
    def from_yaml(cls, path: Path | str) -> AnalysisConfig:
        """Load and validate an analysis config from a YAML file.

        Parameters
        ----------
        path : Path | str
            Path to the YAML configuration file.

        Returns
        -------
        AnalysisConfig
            Validated configuration instance.

        Raises
        ------
        pydantic.ValidationError
            If any field is missing, extra, or has the wrong type.
        FileNotFoundError
            If *path* does not exist.
        """
        path = Path(path)
        with path.open() as fh:
            raw: dict[str, Any] = yaml.safe_load(fh)
        return cls(**raw)
