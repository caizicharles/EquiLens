"""Abstract LLM provider interface and provider registry."""

from __future__ import annotations

from abc import ABC, abstractmethod

import pandas as pd

from llm.config import LLMConfig


class LLMProvider(ABC):
    """Base class that every LLM provider must implement.

    Subclasses only need to override :meth:`run`.  The runner
    (``run_llm.py``) interacts exclusively through this interface.
    """

    @abstractmethod
    def run(
        self,
        df: pd.DataFrame,
        config: LLMConfig,
        system_prompt: str,
        user_template: str,
    ) -> pd.DataFrame:
        """Execute model inference over every row of *df*.

        Parameters
        ----------
        df : pd.DataFrame
            The dataset DataFrame (one row per evaluation item).
        config : LLMConfig
            Full run configuration.
        system_prompt : str
            System-level instruction text.
        user_template : str
            User-prompt template with placeholders.

        Returns
        -------
        pd.DataFrame
            A copy of *df* with at least these additional columns:

            - ``response`` – the answer letter (A/B/C/D) or ``None`` on failure
            - ``result_status`` – "succeeded" | "errored" | "expired" | "canceled"
        """


# ── Provider registry ───────────────────────────────────────────────────────

_PROVIDERS: dict[str, type[LLMProvider]] = {}


def register_provider(name: str):
    """Class decorator that registers a provider under *name*."""

    def _decorator(cls: type[LLMProvider]) -> type[LLMProvider]:
        _PROVIDERS[name] = cls
        return cls

    return _decorator


def get_provider(name: str) -> LLMProvider:
    """Instantiate and return the provider registered under *name*.

    Raises ``KeyError`` if *name* is not registered.
    """
    if name not in _PROVIDERS:
        available = ", ".join(sorted(_PROVIDERS)) or "(none)"
        raise KeyError(
            f"Unknown provider '{name}'. Available: {available}"
        )
    return _PROVIDERS[name]()
