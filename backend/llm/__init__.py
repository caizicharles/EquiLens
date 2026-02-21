"""LLM evaluation package — provider registry, config, and prompt utilities."""

from llm.config import LLMConfig
from llm.schemas import MCQResponse
from llm.prompts import format_user_prompt, load_prompts
from llm.provider import get_provider

# Importing provider modules triggers @register_provider decorators.
import llm.claude  # noqa: F401
import llm.gemini  # noqa: F401

__all__ = [
    "LLMConfig",
    "MCQResponse",
    "get_provider",
    "load_prompts",
    "format_user_prompt",
]
