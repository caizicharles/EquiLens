"""Query GPT-5 API with MEDMCQA prompts and save responses."""

import os
import json
import argparse
import tempfile
from pathlib import Path
from typing import Literal

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

# ── Config ──────────────────────────────────────────────────────────────────
DEFAULT_MODEL = "gpt-5"
DEFAULT_INPUT = "data/medmcqa/medmcqa_prompts.parquet"
DEFAULT_OUTPUT = "data/medmcqa/medmcqa_responses_gpt5.parquet"
CITY_SUBSET_DIR = "data/medmcqa/city_subsets"
CITIES = ["london", "edinburgh", "dublin"]
DEFAULT_N = 100  # number of rows to query (0 = all)
POLL_INTERVAL = 30  # seconds between batch status checks

SYSTEM_PROMPT = (
    "You are a medical expert. Answer the following multiple-choice question "
    "by selecting the single best option. Reply with ONLY the letter of the "
    "correct answer (A, B, C, or D)."
)


class MCQResponse(BaseModel):
    answer: Literal["A", "B", "C", "D"] = Field(
        description="The letter of the correct answer: A, B, C, or D"
    )


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Query GPT-5 on MEDMCQA prompts")
    p.add_argument(
        "--city",
        choices=CITIES,
        help="City name — auto-sets input/output to city subset paths",
    )
    p.add_argument("--input", default=None, help="Input parquet path")
    p.add_argument("--output", default=None, help="Output parquet path")
    p.add_argument("--model", default=DEFAULT_MODEL, help="OpenAI model name")
    p.add_argument(
        "--n",
        type=int,
        default=DEFAULT_N,
        help="Number of rows to query (0 = all)",
    )
    args = p.parse_args()
    if args.city:
        args.input = args.input or f"{CITY_SUBSET_DIR}/medmcqa_{args.city}.parquet"
        args.output = (
            args.output
            or f"{CITY_SUBSET_DIR}/medmcqa_{args.city}_responses_gpt5.parquet"
        )
    else:
        args.input = args.input or DEFAULT_INPUT
        args.output = args.output or DEFAULT_OUTPUT
    return args


def load_api_key() -> str:
    """Load API key from .env file or environment."""
    load_dotenv()
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError(
            "OPENAI_API_KEY not found. Set it in a .env file or as an "
            "environment variable."
        )
    return key


def build_batch_requests(
    df: pd.DataFrame, model: str
) -> list[dict]:
    """Build JSONL batch request dicts from DataFrame rows."""
    schema = MCQResponse.model_json_schema()
    requests = []
    for _, row in df.iterrows():
        req = {
            "custom_id": str(row["id"]),
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": row["prompt"]},
                ],
                "seed": 42,
                "max_completion_tokens": 64,
                "reasoning_effort": "low",
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "MCQResponse",
                        "strict": True,
                        "schema": schema,
                    },
                },
            },
        }
        requests.append(req)
    return requests


def submit_batch(client: OpenAI, requests: list[dict]) -> str:
    """Write JSONL, upload, create batch. Return batch ID."""
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False)
    try:
        for req in requests:
            tmp.write(json.dumps(req) + "\n")
        tmp.close()

        with open(tmp.name, "rb") as f:
            file_obj = client.files.create(file=f, purpose="batch")
        print(f"Uploaded batch input file: {file_obj.id}")

        batch = client.batches.create(
            input_file_id=file_obj.id,
            endpoint="/v1/chat/completions",
            completion_window="24h",
        )
        print(f"Created batch {batch.id} (status: {batch.status})")
        return batch.id
    finally:
        Path(tmp.name).unlink(missing_ok=True)


def poll_batch(client: OpenAI, batch_id: str) -> None:
    """Block until batch reaches terminal status."""
    import time

    terminal = {"completed", "failed", "expired", "cancelled"}
    print(f"Polling batch {batch_id} every {POLL_INTERVAL}s …")
    while True:
        batch = client.batches.retrieve(batch_id)
        if batch.status in terminal:
            counts = batch.request_counts
            print(
                f"Batch {batch.status} — "
                f"completed: {counts.completed}, "
                f"failed: {counts.failed}, "
                f"total: {counts.total}"
            )
            if batch.status != "completed":
                raise RuntimeError(
                    f"Batch ended with status '{batch.status}'"
                )
            return
        print(
            f"  status: {batch.status} | "
            f"completed: {batch.request_counts.completed} / "
            f"{batch.request_counts.total}"
        )
        time.sleep(POLL_INTERVAL)


def retrieve_results(client: OpenAI, batch_id: str) -> dict[str, str]:
    """Download output file and parse responses. Return {id: answer}."""
    batch = client.batches.retrieve(batch_id)
    if not batch.output_file_id:
        raise RuntimeError(f"Batch {batch_id} has no output file.")

    content = client.files.content(batch.output_file_id)
    result_map: dict[str, str] = {}

    for line in content.text.strip().split("\n"):
        if not line:
            continue
        entry = json.loads(line)
        cid = entry["custom_id"]
        response_body = entry.get("response", {})
        status_code = response_body.get("status_code", 0)

        if status_code == 200:
            try:
                body = response_body["body"]
                message_content = body["choices"][0]["message"]["content"]
                parsed = MCQResponse.model_validate_json(message_content)
                result_map[cid] = parsed.answer
            except Exception as e:
                print(f"  Parse error for {cid}: {e}")
                result_map[cid] = f"ERROR: {e}"
        else:
            error_msg = (
                response_body.get("body", {})
                .get("error", {})
                .get("message", "unknown error")
            )
            print(f"  Error for {cid}: status {status_code} — {error_msg}")
            result_map[cid] = f"ERROR: {error_msg}"

    return result_map


def main() -> None:
    args = parse_args()
    api_key = load_api_key()
    client = OpenAI(api_key=api_key)

    # ── Load prompts ────────────────────────────────────────────────────────
    df = pd.read_parquet(args.input)
    if args.n > 0:
        df = df.head(args.n).copy()
    print(f"Loaded {len(df)} prompts from {args.input}")
    print(f"Model: {args.model}")

    # ── Build, submit, poll, retrieve ───────────────────────────────────────
    requests = build_batch_requests(df, args.model)
    batch_id = submit_batch(client, requests)
    poll_batch(client, batch_id)
    result_map = retrieve_results(client, batch_id)

    # ── Merge results ───────────────────────────────────────────────────────
    df["response"] = df["id"].astype(str).map(result_map).fillna("")

    out_df = df[
        ["id", "prompt", "answer", "response", "subject_name", "topic_name", "choice_type"]
    ]
    out_path = Path(args.output)
    out_df.to_parquet(str(out_path), index=False)

    correct = sum(
        1
        for r, a in zip(out_df["response"], out_df["answer"])
        if r and r == a
    )
    total_answered = sum(
        1 for r in out_df["response"] if r and not r.startswith("ERROR")
    )
    print(f"\nDone. Saved {len(out_df)} rows to {out_path}")
    print(f"Accuracy: {correct}/{total_answered} = {correct / total_answered:.1%}" if total_answered else "No valid answers")


if __name__ == "__main__":
    main()
