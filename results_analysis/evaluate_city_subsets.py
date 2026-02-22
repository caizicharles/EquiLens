"""Compute per-city and per-disease classification metrics for city-subset LLM responses.

For each ``*_responses_*.parquet`` file in the city-subsets directory, this
script computes accuracy, macro-averaged precision, recall and F1 across
the four answer classes (A, B, C, D) — both at the aggregate (city) level
and broken down by disease category.

Disease labels are obtained by joining response rows back to the
corresponding source parquet (``medmcqa_<city>.parquet``) on ``id``.

Rows where the ``response`` column is not a valid answer letter (e.g. API
errors) are treated as incorrect predictions.

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
DEFAULT_INPUT_DIR = "backend/data/medmcqa/city_subsets"
VALID_ANSWERS = {"A", "B", "C", "D"}
LABELS = sorted(VALID_ANSWERS)

# Regex to extract city name and model from filename:
#   medmcqa_<city>_responses_<model>.parquet
RESPONSE_FILE_RE = re.compile(
    r"^medmcqa_(?P<city>[a-z]+)_responses_(?P<model>[a-z0-9_]+)\.parquet$",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Evaluate city-subset LLM responses (aggregate + per-disease)."
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


def compute_metrics(y_true: pd.Series, y_pred: pd.Series) -> dict[str, float]:
    """Return accuracy, weighted precision, recall and F1."""
    all_labels = LABELS + ["INVALID"]
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_weighted": precision_score(
            y_true, y_pred, labels=all_labels, average="weighted", zero_division=0
        ),
        "recall_weighted": recall_score(
            y_true, y_pred, labels=all_labels, average="weighted", zero_division=0
        ),
        "f1_weighted": f1_score(
            y_true, y_pred, labels=all_labels, average="weighted", zero_division=0
        ),
    }


def evaluate_file(
    response_path: Path,
    source_path: Path,
    city: str,
    model: str,
) -> list[dict]:
    """Evaluate one response file; return rows for aggregate + per-disease."""
    resp_df = pd.read_parquet(response_path)
    y_true = resp_df["answer"].str.strip().str.upper()
    y_pred = clean_response(resp_df["response"])

    n_valid = int((y_pred != "INVALID").sum())
    n_invalid = int((y_pred == "INVALID").sum())

    rows: list[dict] = []

    # ── Aggregate metrics ───────────────────────────────────────────────
    agg = compute_metrics(y_true, y_pred)
    rows.append({
        "city": city,
        "model": model,
        "disease": "aggregate",
        "n_total": len(resp_df),
        "n_valid": n_valid,
        "n_invalid": n_invalid,
        **agg,
    })

    # ── Per-disease metrics ─────────────────────────────────────────────
    if source_path.exists():
        src_df = pd.read_parquet(source_path)
        if "disease" in src_df.columns:
            # Join disease labels onto responses
            disease_map = src_df.set_index("id")["disease"]
            resp_df["disease"] = resp_df["id"].map(disease_map)

            for disease, group in resp_df.groupby("disease"):
                yt = group["answer"].str.strip().str.upper()
                yp = clean_response(group["response"])
                nv = int((yp != "INVALID").sum())
                ni = int((yp == "INVALID").sum())
                m = compute_metrics(yt, yp)
                rows.append({
                    "city": city,
                    "model": model,
                    "disease": disease,
                    "n_total": len(group),
                    "n_valid": nv,
                    "n_invalid": ni,
                    **m,
                })
    else:
        print(f"  ⚠ Source file not found: {source_path} — skipping per-disease breakdown")

    return rows


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)

    response_files = sorted(input_dir.glob("*_responses_*.parquet"))
    if not response_files:
        print(f"No response files found in {input_dir}")
        return

    all_rows: list[dict] = []

    for fpath in response_files:
        m = RESPONSE_FILE_RE.match(fpath.name)
        if not m:
            print(f"Skipping unrecognised file: {fpath.name}")
            continue

        city = m.group("city").capitalize()
        model = m.group("model")
        source_path = input_dir / f"medmcqa_{m.group('city')}.parquet"

        print(f"Evaluating {fpath.name} ...")
        all_rows.extend(evaluate_file(fpath, source_path, city, model))

    results = pd.DataFrame(all_rows)

    # ── Pretty-print ────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print("  City-Subset Evaluation Results (Aggregate + Per-Disease)")
    print("=" * 80)

    for (city, model), group in results.groupby(["city", "model"]):
        print(f"\n{'─' * 80}")
        print(f"  {city} — {model}")
        print(f"{'─' * 80}")

        for _, row in group.iterrows():
            disease = row["disease"]
            tag = "  [AGGREGATE]" if disease == "aggregate" else f"  {disease}"
            print(f"\n  {tag}")
            print(f"    Samples    : {row['n_total']}  "
                  f"(valid: {row['n_valid']}, invalid: {row['n_invalid']})")
            print(f"    Accuracy   : {row['accuracy']:.4f}")
            print(f"    Precision  : {row['precision_weighted']:.4f}  (weighted)")
            print(f"    Recall     : {row['recall_weighted']:.4f}  (weighted)")
            print(f"    F1         : {row['f1_weighted']:.4f}  (weighted)")

    print("\n" + "=" * 80 + "\n")

    # ── Optionally save to CSV ──────────────────────────────────────────
    if args.output:
        results.to_csv(args.output, index=False)
        print(f"Results saved to {args.output}")


if __name__ == "__main__":
    main()
