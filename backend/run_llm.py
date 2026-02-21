"""LLM Evaluation Runner.

Loads a YAML run config, reads the dataset, dispatches inference through
the configured LLM provider, augments the results with metadata, and
saves everything as a timestamped Parquet file.

Usage
-----
    python run_llm.py --config configs/amqa_claude_default.yaml
    python run_llm.py --config configs/medmcqa_gemini_default.yaml --dry-run
"""

from __future__ import annotations

import argparse
import logging
import shutil
import string
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

from llm import LLMConfig, get_provider, load_prompts

logger = logging.getLogger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _build_output_path(config: LLMConfig, timestamp: str) -> Path:
    """Construct the results Parquet path.

    Pattern: ``{output_dir}/{model_name}/{model_name}__temp{T}_seed{S}__{ts}.parquet``
    """
    model = config.model_name
    temp = config.temperature
    seed = config.seed
    filename = f"{model}__temp{temp}_seed{seed}__{timestamp}.parquet"
    return Path(config.output_dir) / model / filename


def _build_config_copy_path(parquet_path: Path) -> Path:
    """Mirror the Parquet filename but with a ``.yaml`` suffix."""
    return parquet_path.with_suffix(".yaml")


def _validate_data(
    df: pd.DataFrame,
    config: LLMConfig,
    user_template: str,
) -> None:
    """Validate that config references match actual DataFrame columns.

    Raises ``ValueError`` with a clear message if any configured column
    or template placeholder is missing from the DataFrame.
    """
    df_cols = set(df.columns)

    # Check id_columns
    missing_id = [c for c in config.id_columns if c not in df_cols]
    if missing_id:
        raise ValueError(
            f"id_columns {missing_id} not found in data. "
            f"Available columns: {sorted(df_cols)}"
        )

    # Check answer_column
    if config.answer_column not in df_cols:
        raise ValueError(
            f"answer_column '{config.answer_column}' not found in data. "
            f"Available columns: {sorted(df_cols)}"
        )

    # Check summary_groupby columns
    if config.summary_groupby:
        missing_gb = [c for c in config.summary_groupby if c not in df_cols]
        if missing_gb:
            raise ValueError(
                f"summary_groupby columns {missing_gb} not found in data. "
                f"Available columns: {sorted(df_cols)}"
            )

    # Check template placeholders
    formatter = string.Formatter()
    placeholders = [
        fname for _, fname, _, _ in formatter.parse(user_template)
        if fname is not None
    ]
    missing_ph = [p for p in placeholders if p not in df_cols]
    if missing_ph:
        raise ValueError(
            f"User prompt template references columns {missing_ph} not found "
            f"in data. Available columns: {sorted(df_cols)}"
        )


def _augment_results(
    df: pd.DataFrame,
    config: LLMConfig,
    timestamp: str,
) -> pd.DataFrame:
    """Add metadata columns to the results DataFrame."""
    df = df.copy()
    df["correct"] = df["response"] == df[config.answer_column]
    df["model_name"] = config.model_name
    df["temperature"] = config.temperature
    df["seed"] = config.seed
    df["max_tokens"] = config.max_tokens
    df["system_prompt_file"] = config.system_prompt
    df["user_prompt_file"] = config.user_prompt
    df["timestamp"] = timestamp
    return df


def _log_summary(df: pd.DataFrame, config: LLMConfig) -> None:
    """Print key metrics to the log."""
    total = len(df)
    succeeded = (df["result_status"] == "succeeded").sum()
    correct = df["correct"].sum()

    logger.info("── Summary ────────────────────────────────────────────")
    logger.info("  Total rows:    %d", total)
    logger.info("  Succeeded:     %d (%.1f%%)", succeeded, 100 * succeeded / total)
    logger.info("  Correct:       %d (%.1f%%)", correct, 100 * correct / total)

    if succeeded > 0:
        succeeded_df = df[df["result_status"] == "succeeded"]
        logger.info("  Accuracy (succeeded only): %.1f%%",
                     100 * succeeded_df["correct"].mean())

        if config.summary_groupby:
            for col in config.summary_groupby:
                if col not in succeeded_df.columns:
                    logger.warning("  Summary column '%s' not in results.", col)
                    continue
                logger.info("  By %s:", col)
                for group, acc in (
                    succeeded_df.groupby(col)["correct"].mean().items()
                ):
                    logger.info("    %-20s %.1f%%", group, 100 * acc)


def _dry_run(
    df: pd.DataFrame,
    config: LLMConfig,
    system_prompt: str,
    user_template: str,
    n_samples: int = 3,
) -> None:
    """Print sample requests without calling any API."""
    from llm.prompts import format_user_prompt

    logger.info("── DRY RUN (no API calls) ─────────────────────────────")
    logger.info("Config: %s", config.model_dump())
    logger.info("System prompt:\n%s", system_prompt)
    logger.info("Total rows: %d", len(df))

    for i, (_, row) in enumerate(df.head(n_samples).iterrows()):
        user_msg = format_user_prompt(user_template, row)
        id_info = "  ".join(
            f"{col}: {row.get(col, 'N/A')}" for col in config.id_columns
        )
        answer_val = row.get(config.answer_column, "N/A")
        logger.info(
            "\n── Sample %d ──\n"
            "  ID columns  : %s\n"
            "  Answer (%s) : %s\n"
            "  user_prompt :\n%s",
            i + 1,
            id_info,
            config.answer_column,
            answer_val,
            user_msg,
        )


# ── CLI ──────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run LLM evaluation on a medical MCQ dataset.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to a YAML run-config file (e.g. configs/amqa_claude_default.yaml).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print sample requests and exit without calling any API.",
    )
    return parser.parse_args()


# ── Entry point ──────────────────────────────────────────────────────────────


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(message)s",
        datefmt="%H:%M:%S",
    )

    load_dotenv()
    args = parse_args()

    # ── Load config ──────────────────────────────────────────────────────
    config = LLMConfig.from_yaml(args.config)
    logger.info("Loaded config from %s", args.config)
    logger.info("  model: %s  provider: %s  temp: %s  seed: %s",
                config.model_name, config.provider,
                config.temperature, config.seed)

    # ── Load data ────────────────────────────────────────────────────────
    data_path = Path(config.data_path)
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {data_path}. "
            "Run the appropriate dataset processing script first "
            "(e.g. python -m dataset.amqa_processing or "
            "python -m dataset.medmcqa_processing)."
        )
    df = pd.read_parquet(data_path)
    logger.info("Loaded %d rows × %d cols from %s.", *df.shape, data_path)

    # ── Load prompts ─────────────────────────────────────────────────────
    system_prompt, user_template = load_prompts(
        config.system_prompt, config.user_prompt
    )
    logger.info("Loaded prompts: system=%s  user=%s",
                config.system_prompt, config.user_prompt)

    # ── Validate data against config ─────────────────────────────────────
    _validate_data(df, config, user_template)

    # ── Dry run ──────────────────────────────────────────────────────────
    if args.dry_run:
        _dry_run(df, config, system_prompt, user_template)
        return

    # ── Run inference ────────────────────────────────────────────────────
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    provider = get_provider(config.provider)
    logger.info("Running provider: %s", config.provider)
    df_results = provider.run(df, config, system_prompt, user_template)

    # ── Augment with metadata ────────────────────────────────────────────
    df_results = _augment_results(df_results, config, timestamp)

    # ── Save results ─────────────────────────────────────────────────────
    output_path = _build_output_path(config, timestamp)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_results.to_parquet(output_path, index=False)
    size_kb = output_path.stat().st_size / 1024
    logger.info("Saved results → %s (%.1f KB)", output_path, size_kb)

    # Save a copy of the config alongside results
    config_copy = _build_config_copy_path(output_path)
    shutil.copy2(args.config, config_copy)
    logger.info("Saved config  → %s", config_copy)

    # ── Summary ──────────────────────────────────────────────────────────
    _log_summary(df_results, config)


if __name__ == "__main__":
    main()
