"""Convert MedMCQA Claude city-subset results into standardised JSON + CSV.

Joins the response parquets (which lack the ``disease`` column) with the
question parquets (which have it), computes per-disease and aggregate
classification metrics, and writes per-city JSON files plus a consolidated
summary CSV.

Usage
-----
    python -m results_analysis.convert_medmcqa_results \\
        results_analysis/configs/medmcqa_claude_cities.yaml
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

SCORES_ROOT = Path(__file__).resolve().parent / "result_analysis_scores"
VALID_ANSWERS = {"A", "B", "C", "D"}


# ── Config loading ───────────────────────────────────────────────────────────


def _load_config(path: Path) -> dict[str, Any]:
    """Load the MedMCQA analysis YAML config.

    Parameters
    ----------
    path : Path
        Path to the YAML configuration file.

    Returns
    -------
    dict
        Parsed config dictionary.
    """
    import yaml

    with path.open() as fh:
        return yaml.safe_load(fh)


# ── Data loading & merging ───────────────────────────────────────────────────


def _load_city_data(
    city: str,
    question_dir: Path,
    response_dir: Path,
    response_suffix: str = "claude",
) -> pd.DataFrame:
    """Load and merge question + response parquets for one city.

    Recovers the ``disease`` column by joining on ``id``, and computes a
    ``correct`` boolean and a ``valid`` boolean (response in A/B/C/D).

    Parameters
    ----------
    city : str
        City name (lowercase).
    question_dir : Path
        Directory containing ``medmcqa_{city}.parquet``.
    response_dir : Path
        Directory containing ``medmcqa_{city}_responses_{response_suffix}.parquet``.
    response_suffix : str
        Suffix identifying the model in response filenames (default ``"claude"``).

    Returns
    -------
    pd.DataFrame
        Merged DataFrame with columns including ``id``, ``answer``,
        ``response``, ``disease``, ``correct``, ``valid``.
    """
    q_path = question_dir / f"medmcqa_{city}.parquet"
    r_path = response_dir / f"medmcqa_{city}_responses_{response_suffix}.parquet"

    if not q_path.exists():
        raise FileNotFoundError(f"Question file not found: {q_path}")
    if not r_path.exists():
        raise FileNotFoundError(f"Response file not found: {r_path}")

    questions = pd.read_parquet(q_path)
    responses = pd.read_parquet(r_path)

    # Join to recover disease column
    merged = responses.merge(questions[["id", "disease"]], on="id", how="left")

    # Mark valid responses (A/B/C/D vs ERROR strings)
    merged["valid"] = merged["response"].isin(VALID_ANSWERS)
    merged["correct"] = (merged["response"] == merged["answer"]) & merged["valid"]

    logger.info(
        "  %s: %d total, %d valid, %d invalid, diseases=%s",
        city,
        len(merged),
        merged["valid"].sum(),
        (~merged["valid"]).sum(),
        merged["disease"].value_counts().to_dict(),
    )
    return merged


# ── Metric computation ───────────────────────────────────────────────────────


def _compute_metrics(df: pd.DataFrame) -> dict[str, float]:
    """Compute accuracy, macro precision, recall, and F1 on valid rows.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with ``answer``, ``response``, ``valid`` columns.

    Returns
    -------
    dict[str, float]
        Keys: ``accuracy``, ``precision_macro``, ``recall_macro``,
        ``f1_macro``.  Returns all zeros if no valid rows.
    """
    valid = df.loc[df["valid"]]
    if len(valid) == 0:
        return {
            "accuracy": 0.0,
            "precision_macro": 0.0,
            "recall_macro": 0.0,
            "f1_macro": 0.0,
        }

    y_true = valid["answer"]
    y_pred = valid["response"]
    labels = sorted(VALID_ANSWERS)

    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 6),
        "precision_macro": round(
            precision_score(y_true, y_pred, labels=labels, average="macro", zero_division=0), 6
        ),
        "recall_macro": round(
            recall_score(y_true, y_pred, labels=labels, average="macro", zero_division=0), 6
        ),
        "f1_macro": round(
            f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0), 6
        ),
    }


# ── JSON / CSV output ───────────────────────────────────────────────────────


def _save_json(data: dict, path: Path) -> None:
    """Write *data* as pretty-printed JSON."""
    with path.open("w") as fh:
        json.dump(data, fh, indent=2, default=str)
    logger.info("Saved → %s", path)


def _build_city_json(
    city: str,
    df: pd.DataFrame,
    config: dict[str, Any],
    disease_composition: dict[str, float],
) -> dict:
    """Build the JSON-serialisable dict for one city.

    Parameters
    ----------
    city : str
        City name.
    df : pd.DataFrame
        Merged city data (question + response + disease).
    config : dict
        Loaded YAML config.
    disease_composition : dict[str, float]
        Normalised disease composition for this city.

    Returns
    -------
    dict
        Standardised output dict.
    """
    n_total = len(df)
    n_valid = int(df["valid"].sum())
    n_invalid = n_total - n_valid

    # Aggregate metrics (across all diseases)
    aggregate = _compute_metrics(df)
    aggregate["n_valid"] = n_valid
    aggregate["n_invalid"] = n_invalid

    # Per-disease metrics
    per_disease: dict[str, dict] = {}
    for disease in sorted(disease_composition.keys()):
        disease_df = df.loc[df["disease"] == disease]
        disease_metrics = _compute_metrics(disease_df)
        disease_metrics["composition"] = disease_composition[disease]
        disease_metrics["n_samples"] = len(disease_df)
        disease_metrics["n_valid"] = int(disease_df["valid"].sum())
        per_disease[disease] = disease_metrics

    return {
        "dataset": config["dataset"],
        "model": config["model"],
        "city": city,
        "n_samples": n_total,
        "metrics": {
            "aggregate": aggregate,
            "per_disease": per_disease,
        },
    }


def _build_summary_csv(city_results: dict[str, dict]) -> pd.DataFrame:
    """Build a flat summary DataFrame.

    One row per (city, disease) + one aggregate row per city.

    Parameters
    ----------
    city_results : dict[str, dict]
        ``{city_name: city_json_dict}`` mapping.

    Returns
    -------
    pd.DataFrame
        Summary table.
    """
    rows: list[dict] = []

    for city_name, result in city_results.items():
        # Aggregate row
        agg = result["metrics"]["aggregate"]
        rows.append(
            {
                "city": city_name,
                "disease": "aggregate",
                "n_samples": result["n_samples"],
                "n_valid": agg["n_valid"],
                "n_invalid": agg["n_invalid"],
                "accuracy": agg["accuracy"],
                "precision_macro": agg["precision_macro"],
                "recall_macro": agg["recall_macro"],
                "f1_macro": agg["f1_macro"],
            }
        )

        # Per-disease rows
        for disease, dm in result["metrics"]["per_disease"].items():
            rows.append(
                {
                    "city": city_name,
                    "disease": disease,
                    "n_samples": dm["n_samples"],
                    "n_valid": dm["n_valid"],
                    "n_invalid": dm["n_samples"] - dm["n_valid"],
                    "accuracy": dm["accuracy"],
                    "precision_macro": dm["precision_macro"],
                    "recall_macro": dm["recall_macro"],
                    "f1_macro": dm["f1_macro"],
                }
            )

    return pd.DataFrame(rows)


# ── CLI entry point ─────────────────────────────────────────────────────────


def main() -> None:
    """Parse args, compute metrics, save results."""
    parser = argparse.ArgumentParser(
        description="Convert MedMCQA Claude city results into standardised JSON + CSV.",
    )
    parser.add_argument(
        "config",
        type=Path,
        help="Path to the MedMCQA analysis YAML config file.",
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

    # ── Load config ──────────────────────────────────────────────────
    config = _load_config(args.config)
    dataset = config["dataset"]
    model = config["model"]
    question_dir = Path(config["question_dir"])
    response_dir = Path(config["response_dir"])
    response_suffix = config.get("response_suffix", "claude")

    logger.info("Config: dataset=%s  model=%s", dataset, model)

    # ── Output directory ─────────────────────────────────────────────
    out = SCORES_ROOT / dataset / model
    out.mkdir(parents=True, exist_ok=True)

    # ── Process each city ────────────────────────────────────────────
    city_results: dict[str, dict] = {}

    for city_name, city_cfg in config["cities"].items():
        logger.info("Processing %s …", city_name)

        df = _load_city_data(city_name, question_dir, response_dir, response_suffix)
        disease_comp = city_cfg["disease_composition"]

        result = _build_city_json(city_name, df, config, disease_comp)
        city_results[city_name] = result
        _save_json(result, out / f"{city_name}.json")

    # ── Summary CSV ──────────────────────────────────────────────────
    summary = _build_summary_csv(city_results)
    csv_path = out / "summary.csv"
    summary.to_csv(csv_path, index=False)
    logger.info("Saved → %s", csv_path)

    # ── Console output ───────────────────────────────────────────────
    print("\n" + "=" * 80)
    print(f"  MedMCQA × {model} — City Metrics Summary")
    print("=" * 80)
    print(summary.to_string(index=False, float_format="%.4f"))
    print("=" * 80 + "\n")

    logger.info(
        "Analysis complete. %d files written to %s",
        len(config["cities"]) + 1,
        out,
    )


if __name__ == "__main__":
    main()
