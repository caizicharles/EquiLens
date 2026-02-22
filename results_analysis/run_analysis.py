"""Run city-based equity analysis on LLM evaluation results.

Usage
-----
    python -m results_analysis.run_analysis results_analysis/configs/amqa_claude_cities.yaml

Outputs
-------
JSON metric files and a consolidated CSV summary are written to
``results_analysis/result_analysis_scores/<dataset>/<model>/``.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import pandas as pd

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

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

SCORES_ROOT = Path(__file__).resolve().parent / "result_analysis_scores"

BIAS_TYPES = ["ethnicity", "gender", "SES"]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _output_dir(config: AnalysisConfig) -> Path:
    """Build the output directory: ``scores_root / dataset / model``."""
    out = SCORES_ROOT / config.dataset / config.model
    out.mkdir(parents=True, exist_ok=True)
    return out


def _save_json(data: dict, path: Path) -> None:
    """Write *data* as pretty-printed JSON."""
    with path.open("w") as fh:
        json.dump(data, fh, indent=2, default=str)
    logger.info("Saved → %s", path)


# ── Agnostic (city-independent) metrics ─────────────────────────────────────


def compute_agnostic_metrics(
    df: pd.DataFrame,
    config: AnalysisConfig,
) -> dict:
    """Compute baseline accuracy per bias type (city-independent).

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame (all ``adv_group`` rows).
    config : AnalysisConfig
        Run configuration.

    Returns
    -------
    dict
        JSON-serialisable dict with metadata and per-bias-type accuracy.
    """
    baseline_acc = compute_baseline_accuracy(df, config.n_samples)

    metrics: dict = {}
    for bias_type in BIAS_TYPES:
        metrics[bias_type] = {
            "baseline_accuracy": round(baseline_acc, 4),
        }

    return {
        "dataset": config.dataset,
        "model": config.model,
        "city": "agnostic",
        "n_samples": config.n_samples,
        "metrics": metrics,
    }


# ── City-dependent metrics ──────────────────────────────────────────────────


def compute_city_metrics(
    df: pd.DataFrame,
    config: AnalysisConfig,
    city_name: str,
) -> dict:
    """Compute all equity metrics for one city.

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame.
    config : AnalysisConfig
        Run configuration.
    city_name : str
        City key matching ``config.cities``.

    Returns
    -------
    dict
        JSON-serialisable dict with per-bias-type metrics and sample
        assignments.
    """
    city_comp = config.cities[city_name]
    question_ids = sorted(df.loc[df["adv_group"] == "baseline", "question_id"].astype(str).unique().tolist())
    baseline_acc = compute_baseline_accuracy(df, config.n_samples)
    baseline_responses = get_group_responses(df, "baseline")

    metrics: dict = {}

    for bias_type in BIAS_TYPES:
        composition: dict[str, float] = getattr(city_comp, bias_type)
        groups = config.bias_type_groups[bias_type]

        # Randomly assign questions to majority / minority groups
        assignment = assign_city_samples(
            question_ids=question_ids,
            composition=composition,
            n_samples=config.n_samples,
            seed=config.random_seed,
        )

        # Metrics
        city_acc = compute_city_accuracy(df, assignment, config.n_samples)
        acc_ratio = compute_accuracy_ratio(city_acc, baseline_acc)
        cons_ratio = compute_consistency_ratio(
            df,
            assignment,
            baseline_responses,
            majority_group=groups.majority,
            minority_group=groups.minority,
        )

        metrics[bias_type] = {
            "composition": composition,
            "assigned_questions": assignment,
            "random_seed": config.random_seed,
            "baseline_accuracy": round(baseline_acc, 4),
            "city_accuracy": round(city_acc, 4),
            "accuracy_ratio": round(acc_ratio, 4) if acc_ratio is not None else None,
            "consistency_ratio": round(cons_ratio, 4) if cons_ratio is not None else None,
        }

    return {
        "dataset": config.dataset,
        "model": config.model,
        "city": city_name,
        "n_samples": config.n_samples,
        "metrics": metrics,
    }


# ── Summary CSV ──────────────────────────────────────────────────────────────


def build_summary_table(
    agnostic: dict,
    city_results: dict[str, dict],
) -> pd.DataFrame:
    """Build a flat summary DataFrame from all computed metrics.

    Parameters
    ----------
    agnostic : dict
        Output of :func:`compute_agnostic_metrics`.
    city_results : dict[str, dict]
        ``{city_name: compute_city_metrics(…)}`` mapping.

    Returns
    -------
    pd.DataFrame
        One row per (city, bias_type) combination.
    """
    rows: list[dict] = []

    # Agnostic rows
    for bias_type in BIAS_TYPES:
        m = agnostic["metrics"][bias_type]
        rows.append(
            {
                "city": "agnostic",
                "bias_type": bias_type,
                "baseline_accuracy": m["baseline_accuracy"],
                "city_accuracy": None,
                "accuracy_ratio": None,
                "consistency_ratio": None,
            }
        )

    # City rows
    for city_name, result in city_results.items():
        for bias_type in BIAS_TYPES:
            m = result["metrics"][bias_type]
            rows.append(
                {
                    "city": city_name,
                    "bias_type": bias_type,
                    "baseline_accuracy": m["baseline_accuracy"],
                    "city_accuracy": m["city_accuracy"],
                    "accuracy_ratio": m["accuracy_ratio"],
                    "consistency_ratio": m["consistency_ratio"],
                }
            )

    return pd.DataFrame(rows)


# ── CLI entry point ─────────────────────────────────────────────────────────


def main() -> None:
    """Parse args, compute metrics, save results."""
    parser = argparse.ArgumentParser(
        description="Compute city-based equity metrics for LLM evaluation results.",
    )
    parser.add_argument(
        "config",
        type=Path,
        help="Path to the analysis YAML config file.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable DEBUG-level logging.",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-8s │ %(name)s │ %(message)s",
    )

    # ── Load config & data ───────────────────────────────────────────
    config = AnalysisConfig.from_yaml(args.config)
    logger.info("Config: dataset=%s  model=%s  n_samples=%d", config.dataset, config.model, config.n_samples)

    df = load_results(config.result_path)

    # Ensure question_id is string for consistent comparison
    df["question_id"] = df["question_id"].astype(str)

    out = _output_dir(config)

    # ── Agnostic metrics ─────────────────────────────────────────────
    logger.info("Computing city-independent (agnostic) metrics …")
    agnostic = compute_agnostic_metrics(df, config)
    _save_json(agnostic, out / "agnostic.json")

    # ── City-dependent metrics ───────────────────────────────────────
    city_results: dict[str, dict] = {}
    for city_name in config.cities:
        logger.info("Computing metrics for %s …", city_name)
        result = compute_city_metrics(df, config, city_name)
        city_results[city_name] = result
        _save_json(result, out / f"{city_name}.json")

    # ── Summary CSV ──────────────────────────────────────────────────
    summary = build_summary_table(agnostic, city_results)
    csv_path = out / "summary.csv"
    summary.to_csv(csv_path, index=False)
    logger.info("Saved → %s", csv_path)

    # ── Console output ───────────────────────────────────────────────
    print("\n" + "=" * 80)
    print(f"  {config.dataset.upper()} × {config.model} — Equity Metrics Summary")
    print("=" * 80)
    print(summary.to_string(index=False, float_format="%.4f"))
    print("=" * 80 + "\n")

    logger.info("Analysis complete. %d files written to %s", len(config.cities) + 2, out)


if __name__ == "__main__":
    main()
