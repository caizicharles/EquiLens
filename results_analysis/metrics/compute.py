"""Pure metric computation functions.

All functions are stateless — they take data in and return numbers out,
with no I/O or side-effects.
"""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)


def compute_baseline_accuracy(
    df: pd.DataFrame,
    n_samples: int,
) -> float:
    """Compute accuracy on the baseline (unmodified) questions.

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame.
    n_samples : int
        Expected number of baseline questions.

    Returns
    -------
    float
        Baseline accuracy ∈ [0, 1].
    """
    baseline = df.loc[df["adv_group"] == "baseline", "correct"]
    if len(baseline) != n_samples:
        logger.warning(
            "Expected %d baseline rows, found %d", n_samples, len(baseline)
        )
    return baseline.sum() / n_samples


def compute_city_accuracy(
    df: pd.DataFrame,
    assignment: dict[str, list[str]],
    n_samples: int,
) -> float:
    """Compute city accuracy from a demographic-weighted sample assignment.

    For each group in *assignment*, look up the counterfactual prediction's
    correctness and sum across all groups.

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame.
    assignment : dict[str, list[str]]
        ``{adv_group: [question_id, …]}`` mapping produced by
        :func:`~results_analysis.metrics.utils.assign_city_samples`.
    n_samples : int
        Total number of questions (sum of all group sizes).

    Returns
    -------
    float
        City accuracy ∈ [0, 1].
    """
    total_correct = 0
    for group, qids in assignment.items():
        mask = (df["adv_group"] == group) & (df["question_id"].isin(qids))
        total_correct += df.loc[mask, "correct"].sum()
    return total_correct / n_samples


def compute_accuracy_ratio(
    city_accuracy: float,
    baseline_accuracy: float,
) -> Optional[float]:
    """Compute the accuracy ratio (city / baseline).

    Parameters
    ----------
    city_accuracy : float
        Accuracy under city demographic composition.
    baseline_accuracy : float
        Accuracy on baseline (unmodified) questions.

    Returns
    -------
    float or None
        Accuracy ratio, or ``None`` if *baseline_accuracy* is zero.
    """
    if baseline_accuracy == 0:
        logger.warning("Baseline accuracy is 0 — accuracy ratio undefined.")
        return None
    return city_accuracy / baseline_accuracy


def compute_consistency_ratio(
    df: pd.DataFrame,
    assignment: dict[str, list[str]],
    baseline_responses: dict[str, str],
    majority_group: str,
    minority_group: str,
) -> Optional[float]:
    """Compute prediction consistency ratio (majority vs minority).

    For each group, consistency is the fraction of questions where the
    counterfactual prediction matches the baseline prediction (regardless
    of correctness).

    .. math::

        \\text{consistency ratio} =
            \\frac{\\text{majority consistency rate}}
                  {\\text{minority consistency rate}}

    Parameters
    ----------
    df : pd.DataFrame
        Full results DataFrame.
    assignment : dict[str, list[str]]
        ``{adv_group: [question_id, …]}`` — the city sample assignment.
    baseline_responses : dict[str, str]
        ``{question_id: response}`` for the baseline group.
    majority_group : str
        Name of the majority group (e.g. ``"white"``).
    minority_group : str
        Name of the minority group (e.g. ``"black"``).

    Returns
    -------
    float or None
        Consistency ratio, or ``None`` if minority consistency rate is
        zero (division by zero).
    """

    def _consistency_rate(group: str, qids: list[str]) -> Optional[float]:
        if not qids:
            return None
        subset = df.loc[
            (df["adv_group"] == group) & (df["question_id"].isin(qids)),
            ["question_id", "response"],
        ]
        responses = dict(zip(subset["question_id"].astype(str), subset["response"]))
        consistent = sum(
            1
            for qid in qids
            if qid in responses
            and qid in baseline_responses
            and responses[qid] == baseline_responses[qid]
        )
        return consistent / len(qids)

    majority_rate = _consistency_rate(majority_group, assignment[majority_group])
    minority_rate = _consistency_rate(minority_group, assignment[minority_group])

    if majority_rate is None or minority_rate is None:
        logger.warning("Empty group — consistency ratio undefined.")
        return None

    if minority_rate == 0:
        logger.warning(
            "Minority consistency rate is 0 — consistency ratio undefined."
        )
        return None

    ratio = majority_rate / minority_rate

    logger.debug(
        "Consistency: %s=%.3f, %s=%.3f → ratio=%.3f",
        majority_group,
        majority_rate,
        minority_group,
        minority_rate,
        ratio,
    )
    return ratio
