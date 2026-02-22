"""
Preprocess MEDMCQA prompts into city-weighted subsets.

For each city (London, Edinburgh, Dublin) the top-3 causes of death determine
which disease categories appear, and the prevalence weights (normalised to 100%)
control how many questions are sampled from each category.

Disease → MEDMCQA topic mapping uses regex on ``topic_name`` (case-insensitive).
Where an exact match is too sparse (e.g. dementia has only ~40 rows), the closest
broader category (CNS / neurodegenerative) is used instead.

Usage:
    python preprocess_city_subsets.py [--input FILE] [--n N] [--seed SEED]
"""

import argparse
import re
from pathlib import Path

import pandas as pd

# ── Defaults ────────────────────────────────────────────────────────────────
DEFAULT_INPUT = "data/medmcqa/medmcqa_prompts.parquet"
DEFAULT_OUTPUT_DIR = "data/medmcqa/city_subsets"
DEFAULT_N = 1000  # total questions per city
DEFAULT_SEED = 42

# ── Disease → topic regex map ──────────────────────────────────────────────
# Each regex is matched case-insensitively against the topic_name column.

DISEASE_PATTERNS: dict[str, str] = {
    # Cancer / oncology / neoplasia / tumours
    "cancer": (
        r"cancer|oncol|neoplas|tumor|tumour|malignan|carcinoma|"
        r"lymphoma|leukemia|leukaemia|sarcoma|metasta"
    ),
    # Dementia & Alzheimer's  –  broadened to CNS / neurodegenerative
    # (pure dementia/alzheimer topics have only ~40 rows in MEDMCQA)
    "dementia_neuro": (
        r"dementia|alzheimer|neurodegen|c\.n\.s|brain|"
        r"central\s*nervous"
    ),
    # Ischaemic heart disease / cardiovascular (including stroke)
    "cardiovascular": (
        r"cardio|heart|ischaem|ischem|coronar|myocard|angina|"
        r"stroke|cerebrovasc|atheroscl|c\.v\.s|valvular"
    ),
    # Respiratory diseases
    "respiratory": (
        r"respir|lung|pulmon|copd|asthma|bronch|pneumo|"
        r"pleura"
    ),
}

# ── City definitions ───────────────────────────────────────────────────────
# Raw prevalence weights (will be normalised to sum to 1.0).
CITY_CONFIGS: dict[str, dict[str, float]] = {
    "london": {
        # 11.5 % Dementia & Alzheimer's, 10.3 % IHD, 25 % Cancer
        "dementia_neuro": 11.5,
        "cardiovascular": 10.3,
        "cancer": 25.0,
    },
    "edinburgh": {
        # 25 % cancers, 11 % cardiovascular, 10 % respiratory
        "cancer": 25.0,
        "cardiovascular": 11.0,
        "respiratory": 10.0,
    },
    "dublin": {
        # 31 % cancer, 29 % circulatory, 13 % respiratory
        "cancer": 31.0,
        "cardiovascular": 29.0,
        "respiratory": 13.0,
    },
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Build city-weighted MEDMCQA subsets"
    )
    p.add_argument("--input", default=DEFAULT_INPUT, help="Input parquet")
    p.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR,
                   help="Output directory for city parquets")
    p.add_argument("--n", type=int, default=DEFAULT_N,
                   help="Total questions per city subset")
    p.add_argument("--seed", type=int, default=DEFAULT_SEED,
                   help="Random seed for reproducibility")
    return p.parse_args()


def tag_disease(topic: str, patterns: dict[str, re.Pattern]) -> str | None:
    """Return the first matching disease key for a topic name, or None."""
    if pd.isna(topic):
        return None
    for disease, pat in patterns.items():
        if pat.search(topic):
            return disease
    return None


def build_city_subset(
    df: pd.DataFrame,
    city: str,
    weights: dict[str, float],
    n: int,
    seed: int,
) -> pd.DataFrame:
    """Sample *n* questions for *city* according to normalised *weights*."""
    # Normalise weights to proportions
    total = sum(weights.values())
    proportions = {d: w / total for d, w in weights.items()}

    frames: list[pd.DataFrame] = []
    sampled_ids: set = set()

    for disease, prop in proportions.items():
        target_n = round(n * prop)
        pool = df[df["disease"] == disease]
        pool = pool[~pool["id"].isin(sampled_ids)]  # avoid duplicates

        if len(pool) == 0:
            print(f"  WARNING: no rows for {disease!r} in {city}")
            continue

        actual_n = min(target_n, len(pool))
        sample = pool.sample(n=actual_n, random_state=seed)
        frames.append(sample)
        sampled_ids.update(sample["id"])

        print(f"  {city:>10} | {disease:<20} | weight {prop:.1%} | "
              f"target {target_n:>5} | sampled {actual_n:>5} (pool {len(pool)})")

    if not frames:
        return pd.DataFrame()

    result = pd.concat(frames, ignore_index=True)
    result = result.sample(frac=1, random_state=seed).reset_index(drop=True)
    result["city"] = city
    return result


def main() -> None:
    args = parse_args()
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── Load ────────────────────────────────────────────────────────────────
    df = pd.read_parquet(args.input)
    print(f"Loaded {len(df)} prompts from {args.input}")

    # ── Tag each row with its disease category ──────────────────────────────
    compiled = {k: re.compile(v, re.IGNORECASE)
                for k, v in DISEASE_PATTERNS.items()}
    df["disease"] = df["topic_name"].apply(lambda t: tag_disease(t, compiled))

    tagged = df["disease"].notna().sum()
    print(f"Tagged {tagged}/{len(df)} rows with a disease category")
    print(df["disease"].value_counts().to_string())
    print()

    # ── Build per-city subsets ──────────────────────────────────────────────
    for city, weights in CITY_CONFIGS.items():
        print(f"\n{'─'*60}")
        print(f"Building subset for {city.upper()}")
        subset = build_city_subset(df, city, weights, args.n, args.seed)

        if subset.empty:
            print(f"  ⚠ Skipped {city} (no data)")
            continue

        # Drop the helper column before saving
        out_cols = ["id", "prompt", "answer", "disease", "city",
                    "subject_name", "topic_name", "choice_type"]
        out_path = out_dir / f"medmcqa_{city}.parquet"
        subset[out_cols].to_parquet(out_path, index=False)
        print(f"  → Saved {len(subset)} rows to {out_path}")

    print(f"\nDone. City subsets written to {out_dir}/")


if __name__ == "__main__":
    main()
