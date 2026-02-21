# EquiLens

A config-driven pipeline for evaluating LLMs on medical multiple-choice question (MCQ) datasets.

## Supported Datasets

| Dataset | Source | Processing | Key Feature |
|---------|--------|-----------|-------------|
| **AMQA** | `Showing-KCL/AMQA` | `python -m dataset.amqa_processing` | Adversarial bias groups (ethnicity, SES, gender) |
| **MedMCQA** | `openlifescienceai/medmcqa` | `python -m dataset.medmcqa_processing` | 183k medical MCQs across 21 subjects |

## Supported Providers

| Provider | Implementation | Mode |
|----------|---------------|------|
| **Claude** (Anthropic) | Batch Messages API with structured JSON output | Asynchronous batch |
| **Gemini** (Google) | `google-genai` SDK with structured JSON output | Sequential with rate limiting |

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set API Keys

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-...
GEMINI_API_KEY=...
```

### 3. Download & Process Data

```bash
# AMQA (all splits, produces wide + long format)
python -m dataset.amqa_processing

# MedMCQA (train split by default — test split has masked answers)
python -m dataset.medmcqa_processing
python -m dataset.medmcqa_processing --split validation
```

### 4. Run Evaluation

```bash
# Full run
python run_llm.py --config configs/amqa_claude_default.yaml
python run_llm.py --config configs/medmcqa_gemini_default.yaml

# Dry run (print sample prompts, no API calls)
python run_llm.py --config configs/medmcqa_claude_default.yaml --dry-run
```

## Config Schema

Each YAML config fully specifies a single evaluation run. Example:

```yaml
model_name: "claude-sonnet-4-6"
provider: "claude"
temperature: 0.0
seed: 0
max_tokens: 128
data_path: "data/medmcqa/medmcqa.parquet"
system_prompt: "prompts/medmcqa_system.json"
user_prompt: "prompts/medmcqa_user.json"
output_dir: "results/medmcqa"
id_columns: ["id"]            # Columns forming the unique row key
answer_column: "answer"        # Ground-truth answer column
summary_groupby: ["subject_name"]  # Columns for accuracy breakdowns (null = overall only)
max_rows: null                 # Cap evaluation size (null = all rows)
poll_interval: 30              # Claude batch API polling (optional)
```

### Dataset Schema Fields

These fields make the pipeline dataset-agnostic:

- **`id_columns`** — List of columns used to build a unique row identifier for batch tracking
- **`answer_column`** — Column containing the ground-truth answer letter (A/B/C/D)
- **`summary_groupby`** — Columns for grouped accuracy breakdowns in the summary log. Set to `null` for overall accuracy only
- **`max_rows`** — Limit how many rows to evaluate. Useful for large datasets like MedMCQA (183k rows)

## Project Structure

```
run_llm.py              # CLI entry point — loads config, runs evaluation
llm/
  config.py             # Pydantic LLMConfig model from YAML
  provider.py           # Abstract LLMProvider + registry pattern
  claude.py             # Claude provider (Anthropic Batch API)
  gemini.py             # Gemini provider (google-genai, sequential)
  prompts.py            # Prompt loading and formatting
  schemas.py            # MCQResponse Pydantic schema
dataset/
  amqa_processing.py    # AMQA download & preprocessing
  medmcqa_processing.py # MedMCQA download & preprocessing
configs/                # YAML run configs (one per dataset × provider)
prompts/                # System and user prompt templates (JSON)
data/                   # Downloaded datasets (gitignored)
results/                # Evaluation outputs (timestamped parquets)
```

## Adding a New Dataset

1. Create `dataset/<name>_processing.py` — download from HF, validate, save to `data/<name>/`
2. Create `prompts/<name>_system.json` and `prompts/<name>_user.json`
3. Create `configs/<name>_<provider>_default.yaml` with the correct `id_columns`, `answer_column`, and `summary_groupby`
4. Run: `python run_llm.py --config configs/<name>_<provider>_default.yaml`

No code changes needed — the pipeline is fully config-driven.