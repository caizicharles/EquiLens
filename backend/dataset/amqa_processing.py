"""AMQA Dataset Loading, Filtering & Export Pipeline.

Loads the Showing-KCL/AMQA dataset from Hugging Face, selects the core
question fields plus all six adversarial-question variants, expands the
options dict into flat columns, validates the result, and saves to Parquet.

A second preprocessing step melts the six adversarial columns into a long-
format table where each (question, adv_group) pair is one row, tagged with
a bias_category (ethnicity / SES / gender).
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import pandas as pd
import yaml
from datasets import load_dataset

# ── Constants ────────────────────────────────────────────────────────────────

DATASET_ID = "Showing-KCL/AMQA"

OUTPUT_DIR = Path("data/amqa")
OUTPUT_FILE_WIDE = OUTPUT_DIR / "amqa.parquet"
OUTPUT_FILE_LONG = OUTPUT_DIR / "amqa_long.parquet"
OUTPUT_FILE_LONG_INFERENCE = OUTPUT_DIR / "amqa_long_inference.parquet"

GROUPS = ["baseline", "white", "black", "high_income", "low_income", "male", "female"]

ADV_GROUPS = ["white", "black", "high_income", "low_income", "male", "female"]

GROUP_TO_BIAS_CATEGORY: dict[str, str] = {
    "baseline": "none",
    "white": "ethnicity",
    "black": "ethnicity",
    "high_income": "SES",
    "low_income": "SES",
    "male": "gender",
    "female": "gender",
}

# ── Derived column lists (single source of truth) ───────────────────────────

OPTION_COLUMNS = ["option_A", "option_B", "option_C", "option_D"]

# Columns as they appear in the HF dataset (before expansion)
HF_CORE_COLUMNS = [
    "question_id",
    "original_question",
    "desensitized_question",
    "options",
    "answer",
    "answer_idx",
]

ADV_COLUMNS = [f"adv_question_{g}" for g in ADV_GROUPS]

HF_TARGET_COLUMNS = HF_CORE_COLUMNS + ADV_COLUMNS

# Columns after expansion (shared by wide & used as id_vars in melt)
ID_COLUMNS = [
    "split",
    "question_id",
    "original_question",
    "desensitized_question",
    *OPTION_COLUMNS,
    "answer",
    "answer_idx",
]

WIDE_COLUMN_ORDER = ID_COLUMNS + ADV_COLUMNS

LONG_COLUMN_ORDER = ID_COLUMNS + ["adv_group", "bias_category", "adv_question"]

logger = logging.getLogger(__name__)


# ── Pipeline functions ───────────────────────────────────────────────────────


def load_amqa() -> pd.DataFrame:
    """Download all splits from HF and return a wide-format DataFrame."""
    logger.info("Downloading dataset '%s' (all splits) …", DATASET_ID)
    ds_dict = load_dataset(DATASET_ID)
    logger.info("Found splits: %s", list(ds_dict.keys()))

    frames: list[pd.DataFrame] = []
    for split_name, ds in ds_dict.items():
        available = set(ds.column_names)
        missing = set(HF_TARGET_COLUMNS) - available
        if missing:
            raise ValueError(
                f"Expected columns not found in split '{split_name}': {missing}"
            )

        ds = ds.select_columns(HF_TARGET_COLUMNS)
        df = ds.to_pandas()

        # Expand options dict → option_A … option_D
        opts = pd.json_normalize(df["options"])
        opts.columns = [f"option_{c}" for c in opts.columns]
        df = pd.concat([df.drop(columns=["options"]), opts], axis=1)

        df.insert(0, "split", split_name)
        frames.append(df)
        logger.info("  split '%s': %d rows", split_name, len(df))

    result = pd.concat(frames, ignore_index=True)[WIDE_COLUMN_ORDER]
    logger.info("Wide table: %d rows × %d cols.", *result.shape)
    return result


def preprocess_long(df_wide: pd.DataFrame) -> pd.DataFrame:
    """Melt wide DataFrame so each adv-question group becomes its own row.

    Adds:
      - ``adv_group``      – "baseline", "white", "black", etc.
      - ``adv_question``   – the question text for that group
      - ``bias_category``  – "none" (baseline), "ethnicity", "SES", or "gender"

    The baseline row uses the ``original_question`` column as its
    ``adv_question`` text, giving each ``question_id`` 7 rows total.
    """
    # ── Adversarial rows (melt the 6 adv columns) ────────────────────
    df_adv = df_wide.melt(
        id_vars=ID_COLUMNS,
        value_vars=ADV_COLUMNS,
        var_name="adv_group",
        value_name="adv_question",
    )

    # "adv_question_white" → "white"
    df_adv["adv_group"] = (
        df_adv["adv_group"].str.removeprefix("adv_question_")
    )

    # ── Baseline rows (original unmodified question) ─────────────────
    df_baseline = df_wide[ID_COLUMNS].copy()
    df_baseline["adv_group"] = "baseline"
    df_baseline["adv_question"] = df_wide["original_question"]

    # ── Combine and annotate ─────────────────────────────────────────
    df_long = pd.concat([df_baseline, df_adv], ignore_index=True)
    df_long["bias_category"] = df_long["adv_group"].map(GROUP_TO_BIAS_CATEGORY)

    df_long = (
        df_long[LONG_COLUMN_ORDER]
        .sort_values(["question_id", "adv_group"])
        .reset_index(drop=True)
    )

    logger.info("Long table: %d rows × %d cols.", *df_long.shape)
    return df_long


# ── Validation ───────────────────────────────────────────────────────────────


def validate_wide(df: pd.DataFrame) -> None:
    """Sanity-check the wide-format DataFrame."""
    n_rows, n_cols = df.shape
    logger.info("Validating wide: %d rows × %d cols …", n_rows, n_cols)

    if n_cols != len(WIDE_COLUMN_ORDER):
        logger.warning("Expected %d cols, got %d.", len(WIDE_COLUMN_ORDER), n_cols)

    splits = df["split"].unique().tolist()
    logger.info("  splits: %s", splits)

    for col in ("question_id", "answer", "answer_idx"):
        n_null = df[col].isna().sum()
        if n_null:
            logger.warning("  '%s' has %d null(s).", col, n_null)

    bad_idx = set(df["answer_idx"].dropna().unique()) - {"A", "B", "C", "D"}
    if bad_idx:
        logger.warning("  Unexpected answer_idx values: %s", bad_idx)

    logger.info("Wide validation complete.")


def validate_long(df_long: pd.DataFrame, n_wide_rows: int) -> None:
    """Sanity-check the long-format DataFrame."""
    n_rows, n_cols = df_long.shape
    expected_rows = n_wide_rows * len(GROUPS)
    logger.info("Validating long: %d rows × %d cols …", n_rows, n_cols)

    if n_rows != expected_rows:
        logger.warning("Expected %d rows (wide %d × %d groups), got %d.",
                        expected_rows, n_wide_rows, len(GROUPS), n_rows)

    if n_cols != len(LONG_COLUMN_ORDER):
        logger.warning("Expected %d cols, got %d.", len(LONG_COLUMN_ORDER), n_cols)

    bad_groups = set(df_long["adv_group"].unique()) - set(GROUPS)
    if bad_groups:
        logger.warning("  Unmapped adv_group values: %s", bad_groups)

    unmapped = df_long["bias_category"].isna().sum()
    if unmapped:
        logger.warning("  %d rows with unmapped bias_category.", unmapped)

    logger.info("  bias_category counts: %s",
                df_long["bias_category"].value_counts().to_dict())
    logger.info("Long validation complete.")


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
    pair_column: str | None = None,
    seed: int = 0,
) -> pd.DataFrame:
    """Sample a representative subset of *df* for LLM inference.

    When *pair_column* is provided the function performs **paired
    counterfactual sampling**: it samples *num_samples* unique values of
    *pair_column* (e.g. ``question_id``) and keeps **all** rows that
    share each sampled value — the baseline row plus the 6 adversarial
    variants.  This yields *N* counterfactual pairs per bias category
    (gender, ethnicity, SES) together with their matched baselines.
    Total output rows = ``num_samples × len(GROUPS)`` (i.e. ``N × 7``).

    Parameters
    ----------
    df : pd.DataFrame
        Full processed dataset (long-format for AMQA).
    num_samples : int
        When *pair_column* is set, the number of unique question IDs to
        sample — equivalently, the number of counterfactual pairs per
        bias category, each with a matched baseline.
        When *pair_column* is ``None``, the number of individual rows.
    pair_column : str | None
        Column whose unique values define counterfactual sets (e.g.
        ``"question_id"``).  When ``None``, falls back to simple random
        row-level sampling.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        A sampled subset of *df*.

    Raises
    ------
    ValueError
        If *pair_column* is not in the DataFrame, if any value of
        *pair_column* has an incomplete set of ``adv_group`` variants,
        or if *num_samples* exceeds the number of available complete
        question sets.
    """
    if pair_column is not None:
        # ── Paired counterfactual sampling ────────────────────────────
        if pair_column not in df.columns:
            raise ValueError(
                f"pair_column '{pair_column}' not found in data. "
                f"Available columns: {sorted(df.columns)}"
            )

        expected_groups = set(GROUPS)
        n_expected = len(expected_groups)

        # Validate completeness: every pair_column value must have all groups
        group_sets = df.groupby(pair_column)["adv_group"].apply(set)
        incomplete = group_sets[group_sets != expected_groups]
        if len(incomplete) > 0:
            missing_details = {
                pid: sorted(expected_groups - grps)
                for pid, grps in incomplete.items()
            }
            # Show at most 10 examples in the error message
            shown = dict(list(missing_details.items())[:10])
            raise ValueError(
                f"{len(incomplete)} value(s) of '{pair_column}' have "
                f"incomplete adv_group sets (expected {sorted(expected_groups)}). "
                f"Examples: {shown}"
            )

        unique_ids = group_sets.index  # all complete
        n_available = len(unique_ids)

        if num_samples >= n_available:
            if num_samples > n_available:
                raise ValueError(
                    f"num_samples ({num_samples}) exceeds the number of "
                    f"available complete question sets ({n_available})."
                )
            logger.info(
                "num_samples (%d) == available question sets (%d) "
                "— using full dataset.",
                num_samples, n_available,
            )
            return df.copy()

        sampled_ids = (
            pd.Series(unique_ids)
            .sample(n=num_samples, random_state=seed)
            .values
        )
        result = (
            df[df[pair_column].isin(sampled_ids)]
            .sort_values([pair_column, "adv_group"])
            .reset_index(drop=True)
        )

        logger.info(
            "Paired sampling: %d question sets × %d groups = %d rows "
            "(pair_column='%s', seed=%d).",
            num_samples, n_expected, len(result), pair_column, seed,
        )
    else:
        # ── Simple random row-level sampling ─────────────────────────
        if num_samples >= len(df):
            logger.info(
                "num_samples (%d) >= dataset size (%d) — using full dataset.",
                num_samples, len(df),
            )
            return df.copy()

        logger.info(
            "Random sampling: %d rows (seed=%d).", num_samples, seed,
        )
        result = df.sample(n=num_samples, random_state=seed).reset_index(drop=True)

    logger.info("Inference set: %d rows × %d cols.", *result.shape)
    return result


# ── CLI ──────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="AMQA dataset download, filtering & preprocessing pipeline.",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Re-download from HF Hub even if the wide Parquet already exists.",
    )
    parser.add_argument(
        "--skip-long",
        action="store_true",
        help="Only produce the wide-format file; skip long-format preprocessing.",
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
        help="Create an inference subset from the long-format dataset. "
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

    # Resolve output paths
    out_dir = args.output_dir or OUTPUT_DIR
    wide_path = out_dir / OUTPUT_FILE_WIDE.name
    long_path = out_dir / OUTPUT_FILE_LONG.name

    # ── Inference mode (early return) ────────────────────────────────────
    if args.inference:
        if args.config is None:
            raise SystemExit(
                "Error: --inference requires --config pointing to a YAML "
                "file with 'num_samples' (and optionally 'stratify_column')."
            )
        if not long_path.exists():
            raise SystemExit(
                f"Error: long-format dataset not found at {long_path}. "
                "Run without --inference first to download and process "
                "the dataset."
            )

        df_long = pd.read_parquet(long_path)
        logger.info(
            "Loaded long-format dataset: %d rows × %d cols from %s.",
            *df_long.shape, long_path,
        )

        with open(args.config) as fh:
            cfg = yaml.safe_load(fh)

        num_samples = cfg.get("num_samples")
        if num_samples is None:
            raise SystemExit(
                f"Error: 'num_samples' not found in {args.config}."
            )

        pair_column = cfg.get("pair_column")
        seed = cfg.get("seed", 0)

        df_inference = create_inference_set(
            df_long,
            num_samples=int(num_samples),
            pair_column=pair_column,
            seed=int(seed),
        )

        inference_path = out_dir / OUTPUT_FILE_LONG_INFERENCE.name
        save_parquet(df_inference, inference_path)
        if pair_column:
            logger.info(
                "Inference set: %d question sets × %d groups = %d rows "
                "(pair_column=%s, seed=%d).",
                int(num_samples), len(GROUPS), len(df_inference),
                pair_column, int(seed),
            )
        else:
            logger.info(
                "Inference set: %d rows (num_samples=%d, seed=%d).",
                len(df_inference), int(num_samples), int(seed),
            )
        return

    # ── Step 1: Wide format ──────────────────────────────────────────────
    if wide_path.exists() and not args.force_download:
        logger.info("Cached wide file found at %s — skipping download.", wide_path)
        df_wide = pd.read_parquet(wide_path)
        logger.info("Read %d rows × %d cols from cache.", *df_wide.shape)
    else:
        df_wide = load_amqa()
        validate_wide(df_wide)
        save_parquet(df_wide, wide_path)

    # ── Step 2: Long format ──────────────────────────────────────────────
    if not args.skip_long:
        df_long = preprocess_long(df_wide)
        validate_long(df_long, n_wide_rows=len(df_wide))
        save_parquet(df_long, long_path)


if __name__ == "__main__":
    main()