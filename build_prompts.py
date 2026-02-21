"""Build zero-shot prompts for MEDMCQA questions (no answers provided)."""

import pandas as pd

# ── Load dataset ────────────────────────────────────────────────────────────
splits = {
    "train": "data/train-00000-of-00001.parquet",
    "test": "data/test-00000-of-00001.parquet",
    "validation": "data/validation-00000-of-00001.parquet",
}
df = pd.read_parquet(
    "hf://datasets/openlifescienceai/medmcqa/" + splits["train"]
)

OPTION_LABELS = ["A", "B", "C", "D"]
OPTION_COLS = ["opa", "opb", "opc", "opd"]

SYSTEM_PROMPT = (
    "You are a medical expert. Answer the following multiple-choice question "
    "by selecting the single best option. Reply with ONLY the letter of the "
    "correct answer (A, B, C, or D)."
)


def build_prompt(row: pd.Series) -> str:
    """Return a formatted prompt string for one MEDMCQA question."""
    options = "\n".join(
        f"  {label}. {row[col]}"
        for label, col in zip(OPTION_LABELS, OPTION_COLS)
    )
    return (
        f"Subject: {row['subject_name']}  |  Topic: {row['topic_name']}\n\n"
        f"Question:\n{row['question']}\n\n"
        f"Options:\n{options}\n\n"
        f"Answer:"
    )


# ── Build prompts ──────────────────────────────────────────────────────────
df["prompt"] = df.apply(build_prompt, axis=1)

# Map numeric correct-option index to letter for later evaluation
df["answer"] = df["cop"].map(dict(enumerate(OPTION_LABELS)))

# ── Persist ─────────────────────────────────────────────────────────────────
out_path = "medmcqa_prompts.parquet"
df[["id", "prompt", "answer", "subject_name", "topic_name", "choice_type"]].to_parquet(
    out_path, index=False
)
print(f"Saved {len(df)} prompts to {out_path}")

# Show a sample
print("\n" + "=" * 60)
print("SYSTEM PROMPT:")
print(SYSTEM_PROMPT)
print("=" * 60)
print("\nSAMPLE PROMPT:\n")
print(df["prompt"].iloc[0])
