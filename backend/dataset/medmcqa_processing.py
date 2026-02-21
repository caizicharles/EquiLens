"""MedMCQA Dataset Loading, Filtering & Export Pipeline.

Downloads the openlifescienceai/medmcqa dataset from Hugging Face, selects
core question fields, maps the numeric answer index to a letter, validates
the result, and saves to Parquet.

Unlike AMQA, MedMCQA has no adversarial groups so each row is already a
single evaluation item — no wide-to-long transformation is needed.
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import pandas as pd
import yaml
from datasets import load_dataset

# ── Constants ────────────────────────────────────────────────────────────────

DATASET_ID = "openlifescienceai/medmcqa"

OUTPUT_DIR = Path("data/medmcqa")
OUTPUT_FILE = OUTPUT_DIR / "medmcqa.parquet"
OUTPUT_FILE_INFERENCE = OUTPUT_DIR / "medmcqa_inference.parquet"

OPTION_LABELS = ["A", "B", "C", "D"]
OPTION_COLUMNS = ["opa", "opb", "opc", "opd"]
COP_TO_LETTER = dict(enumerate(OPTION_LABELS))  # {0: "A", 1: "B", …}

# Columns to keep from the HuggingFace dataset.
HF_TARGET_COLUMNS = [
    "id",
    "question",
    "opa",
    "opb",
    "opc",
    "opd",
    "cop",
    "subject_name",
    "topic_name",
    "choice_type",
]

# Final column order in the exported Parquet.
OUTPUT_COLUMN_ORDER = [
    "split",
    "id",
    "question",
    "opa",
    "opb",
    "opc",
    "opd",
    "cop",
    "answer",
    "subject_name",
    "topic_name",
    "choice_type",
]

logger = logging.getLogger(__name__)


# ── Pipeline functions ───────────────────────────────────────────────────────


def load_medmcqa(split: str = "train") -> pd.DataFrame:
    """Download a single split from HF and return a ready-to-use DataFrame.

    Parameters
    ----------
    split : str
        HuggingFace split name.  Use ``"train"`` for ground-truth labels
        (the ``"test"`` split has masked answers).
    """
    logger.info("Downloading dataset '%s' (split: %s) …", DATASET_ID, split)
    ds = load_dataset(DATASET_ID, split=split)
    logger.info("Downloaded %d rows.", len(ds))

    available = set(ds.column_names)
    missing = set(HF_TARGET_COLUMNS) - available
    if missing:
        raise ValueError(
            f"Expected columns not found in split '{split}': {missing}"
        )

    ds = ds.select_columns(HF_TARGET_COLUMNS)
    df = ds.to_pandas()

    # Add split label
    df.insert(0, "split", split)

    # Map numeric answer index → letter (0 → A, 1 → B, etc.)
    df["answer"] = df["cop"].map(COP_TO_LETTER)

    # Filter rows with invalid cop values (outside 0–3)
    invalid_mask = df["answer"].isna()
    n_invalid = invalid_mask.sum()
    if n_invalid:
        logger.warning(
            "Dropping %d rows with invalid cop values (outside 0–3).",
            n_invalid,
        )
        df = df[~invalid_mask].reset_index(drop=True)

    df = df[OUTPUT_COLUMN_ORDER]
    logger.info("Prepared %d rows × %d cols.", *df.shape)
    return df


# ── Validation ───────────────────────────────────────────────────────────────


def validate(df: pd.DataFrame) -> None:
    """Sanity-check the exported DataFrame."""
    n_rows, n_cols = df.shape
    logger.info("Validating: %d rows × %d cols …", n_rows, n_cols)

    for col in ("id", "question", "answer"):
        n_null = df[col].isna().sum()
        if n_null:
            logger.warning("  '%s' has %d null(s).", col, n_null)

    for col in OPTION_COLUMNS:
        n_null = df[col].isna().sum()
        if n_null:
            logger.warning("  Option column '%s' has %d null(s).", col, n_null)

    bad_answers = set(df["answer"].dropna().unique()) - set(OPTION_LABELS)
    if bad_answers:
        logger.warning("  Unexpected answer values: %s", bad_answers)

    # Stats
    logger.info("  Splits: %s", df["split"].unique().tolist())
    logger.info(
        "  Subjects: %d unique", df["subject_name"].nunique()
    )
    logger.info(
        "  Answer distribution:\n%s",
        df["answer"].value_counts().sort_index().to_string(),
    )
    logger.info("Validation complete.")


# ── I/O helpers ──────────────────────────────────────────────────────────────


def save_parquet(df: pd.DataFrame, path: Path) -> None:
    """Write a DataFrame to Parquet, creating directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, index=False)
    size_kb = path.stat().st_size / 1024
    logger.info("Saved → %s (%.1f KB)", path, size_kb)


# ── Inference set creation ─────────────────────────────────────────────────────────


def create_inference_set(
    df: pd.DataFrame,
    num_samples: int,
    stratify_column: str | None = None,
    seed: int = 0,
) -> pd.DataFrame:
    """Sample a representative subset of *df* for LLM inference.

    Parameters
    ----------
    df : pd.DataFrame
        Full processed dataset (e.g. from ``load_medmcqa``).
    num_samples : int
        Target number of rows in the inference set.
    stratify_column : str | None
        If given, performs proportional stratified sampling so that the
        distribution of this column in the sample mirrors the full data.
        Falls back to random sampling when ``None``.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        A sampled subset of *df* with at most *num_samples* rows.
    """
    if num_samples >= len(df):
        logger.info(
            "num_samples (%d) >= dataset size (%d) — using full dataset.",
            num_samples, len(df),
        )
        return df.copy()

    if stratify_column is not None:
        if stratify_column not in df.columns:
            raise ValueError(
                f"stratify_column '{stratify_column}' not found in data. "
                f"Available columns: {sorted(df.columns)}"
            )
        logger.info(
            "Stratified sampling: %d rows by '%s' (seed=%d).",
            num_samples, stratify_column, seed,
        )
        # Proportional allocation per stratum
        group_counts = df[stratify_column].value_counts(normalize=True)
        frames: list[pd.DataFrame] = []
        remaining = num_samples
        groups = list(group_counts.index)

        for i, group in enumerate(groups):
            group_df = df[df[stratify_column] == group]
            if i < len(groups) - 1:
                n = max(1, round(group_counts[group] * num_samples))
                n = min(n, len(group_df), remaining)
            else:
                # Last group gets whatever is left to hit exact total
                n = min(remaining, len(group_df))
            frames.append(group_df.sample(n=n, random_state=seed))
            remaining -= n
            if remaining <= 0:
                break

        result = pd.concat(frames, ignore_index=True)
    else:
        logger.info(
            "Random sampling: %d rows (seed=%d).", num_samples, seed,
        )
        result = df.sample(n=num_samples, random_state=seed).reset_index(drop=True)

    logger.info("Inference set: %d rows × %d cols.", *result.shape)
    return result


# ── CLI ──────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="MedMCQA dataset download & preprocessing pipeline.",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Re-download from HF Hub even if the Parquet already exists.",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="train",
        help="HuggingFace split to download (default: train). "
        "Note: 'test' split has masked answer labels.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help=f"Override the output directory (default: {OUTPUT_DIR}).",
    )
    parser.add_argument(
        "--inference",
        action="store_true",
        help="Create an inference subset from the full dataset. "
        "Requires --config to specify num_samples and (optionally) "
        "stratify_column.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Path to a YAML config file that contains 'num_samples' and "
        "optionally 'stratify_column'. Used with --inference.",
    )
    return parser.parse_args()


# ── Entry point ──────────────────────────────────────────────────────────────


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(message)s",
        datefmt="%H:%M:%S",
    )

    args = parse_args()

    # Resolve output path
    out_dir = args.output_dir or OUTPUT_DIR
    out_path = out_dir / OUTPUT_FILE.name

    # ── Inference mode (early return) ────────────────────────────────────
    if args.inference:
        if args.config is None:
            raise SystemExit(
                "Error: --inference requires --config pointing to a YAML "
                "file with 'num_samples' (and optionally 'stratify_column')."
            )
        if not out_path.exists():
            raise SystemExit(
                f"Error: full dataset not found at {out_path}. "
                "Run without --inference first to download and process "
                "the dataset."
            )

        df = pd.read_parquet(out_path)
        logger.info(
            "Loaded full dataset: %d rows × %d cols from %s.",
            *df.shape, out_path,
        )

        with open(args.config) as fh:
            cfg = yaml.safe_load(fh)

        num_samples = cfg.get("num_samples")
        if num_samples is None:
            raise SystemExit(
                f"Error: 'num_samples' not found in {args.config}."
            )

        stratify_column = cfg.get("stratify_column")
        seed = cfg.get("seed", 0)

        df_inference = create_inference_set(
            df,
            num_samples=int(num_samples),
            stratify_column=stratify_column,
            seed=int(seed),
        )

        inference_path = out_dir / OUTPUT_FILE_INFERENCE.name
        save_parquet(df_inference, inference_path)
        logger.info(
            "Inference set: %d rows (num_samples=%d, stratify=%s, seed=%d).",
            len(df_inference), int(num_samples),
            stratify_column or "none", int(seed),
        )
        return

    # ── Full download & processing ───────────────────────────────────────
    if out_path.exists() and not args.force_download:
        logger.info("Cached file found at %s — skipping download.", out_path)
        df = pd.read_parquet(out_path)
        logger.info("Read %d rows × %d cols from cache.", *df.shape)
    else:
        df = load_medmcqa(split=args.split)
        validate(df)
        save_parquet(df, out_path)

    logger.info("Done. Output at %s", out_path)


if __name__ == "__main__":
    main()
