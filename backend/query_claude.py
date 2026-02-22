"""Query Claude API with MEDMCQA prompts and save responses."""

import os
import time
import json
import argparse
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
import anthropic

# ── Config ──────────────────────────────────────────────────────────────────
DEFAULT_MODEL = "claude-opus-4-6"
DEFAULT_INPUT = "data/medmcqa/medmcqa_prompts.parquet"
DEFAULT_OUTPUT = "data/medmcqa/medmcqa_responses_claude.parquet"
CITY_SUBSET_DIR = "data/medmcqa/city_subsets"
CITIES = ["london", "edinburgh", "dublin"]
DEFAULT_N = 100  # number of rows to query (0 = all)
RPM_LIMIT = 50  # requests per minute; adjust to your tier
CHECKPOINT_EVERY = 50  # save intermediate results every N rows

SYSTEM_PROMPT = (
    "You are a medical expert. Answer the following multiple-choice question "
    "by selecting the single best option. Reply with ONLY the letter of the "
    "correct answer (A, B, C, or D)."
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Query Claude on MEDMCQA prompts")
    p.add_argument("--city", choices=CITIES,
                   help="City name — auto-sets input/output to city subset paths")
    p.add_argument("--input", default=None, help="Input parquet path")
    p.add_argument("--output", default=None, help="Output parquet path")
    p.add_argument("--model", default=DEFAULT_MODEL, help="Claude model name")
    p.add_argument("--n", type=int, default=DEFAULT_N,
                   help="Number of rows to query (0 = all)")
    p.add_argument("--rpm", type=int, default=RPM_LIMIT,
                   help="Max requests per minute")
    args = p.parse_args()
    if args.city:
        args.input = args.input or f"{CITY_SUBSET_DIR}/medmcqa_{args.city}.parquet"
        args.output = args.output or f"{CITY_SUBSET_DIR}/medmcqa_{args.city}_responses_claude.parquet"
    else:
        args.input = args.input or DEFAULT_INPUT
        args.output = args.output or DEFAULT_OUTPUT
    return args


def load_api_key() -> str:
    """Load API key from .env file or environment."""
    load_dotenv()
    key = os.getenv("CLAUDE_API_KEY")
    if not key:
        raise RuntimeError(
            "CLAUDE_API_KEY not found. Set it in a .env file or as an "
            "environment variable."
        )
    return key


RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {
            "type": "string",
            "description": "The letter of the correct answer: A, B, C, or D",
            "enum": ["A", "B", "C", "D"],
        }
    },
    "required": ["answer"],
    "additionalProperties": False,
}


def query_claude(client: anthropic.Anthropic, model: str, prompt: str) -> str:
    """Send a single prompt to Claude with structured output and return the answer letter."""
    message = client.messages.create(
        model=model,
        max_tokens=64,
        temperature=0.0,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt},
        ],
        output_config={
            "format": {
                "type": "json_schema",
                "schema": RESPONSE_SCHEMA,
            }
        },
    )
    # Parse the structured JSON response
    if message.content and message.content[0].text:
        data = json.loads(message.content[0].text)
        return data.get("answer", "")
    return ""


def save_checkpoint(df: pd.DataFrame, path: str) -> None:
    """Save current results to parquet."""
    df.to_parquet(path, index=False)


def main() -> None:
    args = parse_args()
    api_key = load_api_key()

    client = anthropic.Anthropic(api_key=api_key)

    # ── Load prompts ────────────────────────────────────────────────────────
    df = pd.read_parquet(args.input)
    if args.n > 0:
        df = df.head(args.n).copy()
    print(f"Loaded {len(df)} prompts from {args.input}")
    print(f"Model: {args.model}  |  RPM limit: {args.rpm}")

    # ── Resume from checkpoint if it exists ─────────────────────────────────
    out_path = Path(args.output)
    responses = [""] * len(df)
    start_idx = 0

    if out_path.exists():
        prev = pd.read_parquet(out_path)
        done_map = dict(zip(prev["id"], prev["response"]))
        for i, row_id in enumerate(df["id"]):
            if row_id in done_map and done_map[row_id]:
                responses[i] = done_map[row_id]
        start_idx = sum(1 for r in responses if r)
        print(f"Resumed: {start_idx}/{len(df)} already completed")

    # ── Query loop ──────────────────────────────────────────────────────────
    min_interval = 60.0 / args.rpm  # seconds between requests
    completed = start_idx
    errors = 0

    for i, (_, row) in enumerate(df.iterrows()):
        if responses[i]:  # already done (resumed)
            continue

        t0 = time.time()
        try:
            resp = query_claude(client, args.model, row["prompt"])
            responses[i] = resp
            completed += 1
        except Exception as e:
            responses[i] = f"ERROR: {e}"
            errors += 1

        elapsed = time.time() - t0
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)

        # Log prediction vs expected
        expected = row["answer"]
        match = "✓" if responses[i] == expected else "✗"
        print(f"  [{completed}/{len(df)}]  predicted: {responses[i]!r}  expected: {expected!r}  {match}")

        # Checkpoint
        if completed % CHECKPOINT_EVERY == 0:
            df["response"] = responses
            save_checkpoint(
                df[["id", "prompt", "answer", "response",
                    "subject_name", "topic_name", "choice_type"]],
                str(out_path),
            )

    # ── Final save ──────────────────────────────────────────────────────────
    df["response"] = responses
    out_df = df[["id", "prompt", "answer", "response",
                 "subject_name", "topic_name", "choice_type"]]
    save_checkpoint(out_df, str(out_path))

    correct = sum(
        1 for r, a in zip(out_df["response"], out_df["answer"])
        if r and r == a
    )
    total_answered = sum(1 for r in out_df["response"] if r and not r.startswith("ERROR"))
    print(f"\nDone. Saved {len(out_df)} rows to {out_path}")
    print(f"Answered: {total_answered}  |  Errors: {errors}")
    if total_answered:
        print(f"Accuracy: {correct}/{total_answered} = {correct/total_answered:.1%}")


if __name__ == "__main__":
    main()
