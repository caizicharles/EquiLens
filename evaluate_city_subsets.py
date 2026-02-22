"""Compute per-city classification metrics for city-subset LLM responses.

For each ``*_responses_*.parquet`` file in the city-subsets directory, this
script computes accuracy, macro-averaged precision, recall and F1 across
the four answer classes (A, B, C, D).

Rows where the ``response`` column is not a valid answer letter (e.g. API
errors) are treated as incorrect predictions (mapped to a sentinel label).

Usage:
    python evaluate_city_subsets.py [--input-dir DIR] [--output FILE]
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)

# ── Defaults ────────────────────────────────────────────────────────────────
DEFAULT_INPUT_DIR = "data/medmcqa/city_subsets"
VALID_ANSWERS = {"A", "B", "C", "D"}
LABELS = sorted(VALID_ANSWERS)  # deterministic order

# Regex to extract city name and model from filename:
#   medmcqa_<city>_responses_<model>.parquet
RESPONSE_FILE_RE = re.compile(
    r"^medmcqa_(?P<city>[a-z]+)_responses_(?P<model>[a-z0-9_]+)\.parquet$",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Evaluate city-subset LLM responses."
    )
    p.add_argument(
        "--input-dir",
        default=DEFAULT_INPUT_DIR,
        help="Directory containing response parquet files",
    )
    p.add_argument(
        "--output",
        default=None,
        help="Optional path to save results as CSV",
    )
    return p.parse_args()


def clean_response(response: pd.Series) -> pd.Series:
    """Normalise responses: strip whitespace, upper-case, and replace
    anything that isn't a valid answer letter with ``'INVALID'``."""
    cleaned = response.astype(str).str.strip().str.upper()
    cleaned = cleaned.where(cleaned.isin(VALID_ANSWERS), other="INVALID")
    return cleaned


def evaluate(df: pd.DataFrame) -> dict[str, float]:
    """Return accuracy, precision, recall and F1 for a response DataFrame."""
    y_true = df["answer"].str.strip().str.upper()
    y_pred = clean_response(df["response"])

    # Include "INVALID" as a possible predicted label so invalid predictions
    # are counted as errors rather than silently dropped.
    all_labels = LABELS + ["INVALID"]

    return {
        "n_total": len(df),
        "n_valid": int((y_pred != "INVALID").sum()),
        "n_invalid": int((y_pred == "INVALID").sum()),
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": precision_score(
            y_true, y_pred, labels=all_labels, average="macro", zero_division=0
        ),
        "recall_macro": recall_score(
            y_true, y_pred, labels=all_labels, average="macro", zero_division=0
        ),
        "f1_macro": f1_score(
            y_true, y_pred, labels=all_labels, average="macro", zero_division=0
        ),
    }


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)

    response_files = sorted(input_dir.glob("*_responses_*.parquet"))
    if not response_files:
        print(f"No response files found in {input_dir}")
        return

    rows: list[dict] = []
    for fpath in response_files:
        m = RESPONSE_FILE_RE.match(fpath.name)
        if not m:
            print(f"Skipping unrecognised file: {fpath.name}")
            continue

        city = m.group("city").capitalize()
        model = m.group("model")

        df = pd.read_parquet(fpath)
        metrics = evaluate(df)
        rows.append({"city": city, "model": model, **metrics})

    results = pd.DataFrame(rows)

    # ── Pretty-print ────────────────────────────────────────────────────
    print("\n" + "=" * 72)
    print("  City-Subset Evaluation Results")
    print("=" * 72)

    for _, row in results.iterrows():
        print(f"\n  {row['city']} ({row['model']})")
        print(f"    Samples    : {row['n_total']}  "
              f"(valid: {row['n_valid']}, invalid: {row['n_invalid']})")
        print(f"    Accuracy   : {row['accuracy']:.4f}")
        print(f"    Precision  : {row['precision_macro']:.4f}  (macro)")
        print(f"    Recall     : {row['recall_macro']:.4f}  (macro)")
        print(f"    F1         : {row['f1_macro']:.4f}  (macro)")

    print("\n" + "=" * 72 + "\n")

    # ── Optionally save to CSV ──────────────────────────────────────────
    if args.output:
        results.to_csv(args.output, index=False)
        print(f"Results saved to {args.output}")


if __name__ == "__main__":
    main()
