"""Prompt loading and formatting utilities."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


def load_prompts(
    system_path: Path | str,
    user_template_path: Path | str,
) -> tuple[str, str]:
    """Read the system prompt and user prompt template from JSON files.

    Returns
    -------
    system_prompt : str
        The system-level instruction text.
    user_template : str
        A Python format-string with placeholders for row fields.
    """
    system_path = Path(system_path)
    user_template_path = Path(user_template_path)

    with system_path.open() as fh:
        system_prompt: str = json.load(fh)["content"]

    with user_template_path.open() as fh:
        user_template: str = json.load(fh)["template"]

    return system_prompt, user_template


def format_user_prompt(template: str, row: pd.Series) -> str:
    """Fill the user-prompt template with values from a DataFrame row.

    Placeholder names in the template must match column names in the
    DataFrame.  Uses ``str.format(**row)`` so any dataset's columns
    can be referenced without code changes.
    """
    return template.format(**row.to_dict())
