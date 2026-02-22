"""Data loading and sample assignment utilities."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ── Data loading ─────────────────────────────────────────────────────────────


def load_results(path: Path | str) -> pd.DataFrame:
    """Load a results Parquet file and perform basic validation.

    Parameters
    ----------
    path : Path | str
        Path to the results ``.parquet`` file.

    Returns
    -------
    pd.DataFrame
        The loaded results DataFrame.

    Raises
    ------
    FileNotFoundError
        If *path* does not exist.
    ValueError
        If required columns are missing.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Results file not found: {path}")

    df = pd.read_parquet(path)

    required = {"question_id", "adv_group", "bias_category", "response", "answer_idx", "correct"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Results file missing required columns: {missing}")

    logger.info("Loaded results: %d rows × %d cols from %s", *df.shape, path.name)
    return df


# ── Sample assignment ────────────────────────────────────────────────────────


def assign_city_samples(
    question_ids: list[str],
    composition: dict[str, float],
    n_samples: int,
    seed: int,
) -> dict[str, list[str]]:
    """Randomly assign question IDs to demographic groups per composition.

    Parameters
    ----------
    question_ids : list[str]
        Sorted list of unique question identifiers.
    composition : dict[str, float]
        Mapping of ``{group_name: proportion}``.  Proportions must sum to
        1.0 and the derived counts must sum to *n_samples*.
    n_samples : int
        Total number of samples (must equal ``len(question_ids)``).
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    dict[str, list[str]]
        Mapping from group name → list of assigned question IDs.

    Examples
    --------
    >>> assign_city_samples(["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"],
    ...                     {"white": 0.8, "black": 0.2}, 10, seed=42)
    {'white': ['q1', ...], 'black': ['q5', ...]}   # 8 + 2
    """
    if len(question_ids) != n_samples:
        raise ValueError(
            f"Expected {n_samples} question IDs, got {len(question_ids)}"
        )

    # Derive integer counts from proportions.
    # Use round to get the nearest integer, then adjust to ensure sum == n_samples.
    groups = list(composition.keys())
    raw_counts = {g: round(composition[g] * n_samples) for g in groups}

    # Adjust if rounding caused a mismatch (add/subtract from largest group)
    total = sum(raw_counts.values())
    if total != n_samples:
        largest = max(groups, key=lambda g: raw_counts[g])
        raw_counts[largest] += n_samples - total

    # Shuffle and split
    rng = np.random.default_rng(seed)
    shuffled = rng.permutation(question_ids).tolist()

    assignment: dict[str, list[str]] = {}
    offset = 0
    for group in groups:
        count = raw_counts[group]
        assignment[group] = sorted(shuffled[offset : offset + count])
        offset += count

    logger.debug(
        "Assignment (seed=%d): %s",
        seed,
        {g: len(ids) for g, ids in assignment.items()},
    )
    return assignment


# ── Response lookup ──────────────────────────────────────────────────────────


def get_group_responses(
    df: pd.DataFrame,
    adv_group: str,
) -> dict[str, str]:
    """Extract the model response for every question in an adversarial group.

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame.
    adv_group : str
        The adversarial group to filter on (e.g. ``"baseline"``, ``"white"``).

    Returns
    -------
    dict[str, str]
        ``{question_id: response_letter}`` for every row in the group.
    """
    subset = df.loc[df["adv_group"] == adv_group, ["question_id", "response"]]
    return dict(zip(subset["question_id"].astype(str), subset["response"]))
