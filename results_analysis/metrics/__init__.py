"""Metrics computation package for results analysis."""

from __future__ import annotations

from results_analysis.metrics.compute import (
    compute_accuracy_ratio,
    compute_baseline_accuracy,
    compute_city_accuracy,
    compute_consistency_ratio,
)
from results_analysis.metrics.config import AnalysisConfig
from results_analysis.metrics.utils import (
    assign_city_samples,
    get_group_responses,
    load_results,
)

__all__ = [
    "AnalysisConfig",
    "assign_city_samples",
    "compute_accuracy_ratio",
    "compute_baseline_accuracy",
    "compute_city_accuracy",
    "compute_consistency_ratio",
    "get_group_responses",
    "load_results",
]
