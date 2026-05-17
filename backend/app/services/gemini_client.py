import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any, List, Optional, Tuple

from dotenv import load_dotenv
import google.generativeai as genai

logger = logging.getLogger("LexGuard-AI.GeminiClient")

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")
load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()


def _parse_key_list(raw: str) -> List[str]:
    keys: List[str] = []
    for part in raw.replace(";", ",").split(","):
        key = part.strip()
        if key and key not in keys:
            keys.append(key)
    return keys


def _collect_keys(*env_names: str) -> List[str]:
    keys: List[str] = []
    for name in env_names:
        keys.extend(_parse_key_list(os.getenv(name, "")))
    keys.extend(_parse_key_list(os.getenv("GEMINI_API_KEYS", "")))
    unique: List[str] = []
    for key in keys:
        if key not in unique:
            unique.append(key)
    return unique


# Primary + judge-specific key chains (judges try their own key first, then shared pool)
PRIMARY_KEYS: List[str] = _collect_keys(
    "GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"
)
ALPHA_KEYS: List[str] = _collect_keys("GEMINI_API_KEY_ALPHA", "JUDGE_ALPHA_API_KEY") + PRIMARY_KEYS
BETA_KEYS: List[str] = _collect_keys("GEMINI_API_KEY_BETA", "JUDGE_BETA_API_KEY") + PRIMARY_KEYS
GAMMA_KEYS: List[str] = _collect_keys("GEMINI_API_KEY_GAMMA", "JUDGE_GAMMA_API_KEY") + PRIMARY_KEYS

# Deduplicate while preserving order
def _dedupe(keys: List[str]) -> List[str]:
    out: List[str] = []
    for k in keys:
        if k and k not in out:
            out.append(k)
    return out


PRIMARY_KEYS = _dedupe(PRIMARY_KEYS)
ALPHA_KEYS = _dedupe(ALPHA_KEYS)
BETA_KEYS = _dedupe(BETA_KEYS)
GAMMA_KEYS = _dedupe(GAMMA_KEYS)

configured = bool(PRIMARY_KEYS)
if configured:
    try:
        genai.configure(api_key=PRIMARY_KEYS[0])
        logger.info("Gemini configured (%s). %s key(s) in primary pool.", GEMINI_MODEL, len(PRIMARY_KEYS))
    except Exception as exc:
        logger.error("Gemini configuration failed: %s", exc)
        configured = False


def is_configured() -> bool:
    return configured and bool(PRIMARY_KEYS)


def get_keys_for_agent(agent: str = "default") -> List[str]:
    agent = (agent or "default").lower()
    if agent in ("alpha", "corporate", "defender"):
        return ALPHA_KEYS or PRIMARY_KEYS
    if agent in ("beta", "consumer", "advocate"):
        return BETA_KEYS or PRIMARY_KEYS
    if agent in ("gamma", "judge", "neutral"):
        return GAMMA_KEYS or PRIMARY_KEYS
    return PRIMARY_KEYS


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "resource exhausted" in msg


def _extract_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    first_obj = cleaned.find("{")
    last_obj = cleaned.rfind("}")
    if first_obj != -1 and last_obj != -1 and last_obj > first_obj:
        return cleaned[first_obj : last_obj + 1]

    first_arr = cleaned.find("[")
    last_arr = cleaned.rfind("]")
    if first_arr != -1 and last_arr != -1 and last_arr > first_arr:
        return cleaned[first_arr : last_arr + 1]

    return cleaned


def _generate_with_key(
    api_key: str,
    prompt: Any,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
    response_mime_type: Optional[str] = None,
) -> str:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
            **({"response_mime_type": response_mime_type} if response_mime_type else {}),
        },
    )
    text = getattr(response, "text", "") or ""
    if not text.strip():
        raise RuntimeError("Gemini returned an empty response.")
    return text.strip()


def generate_text(
    prompt: Any,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
    response_mime_type: Optional[str] = None,
    retries: int = 2,
    agent: str = "default",
) -> str:
    keys = get_keys_for_agent(agent)
    if not keys:
        raise RuntimeError(
            "No Gemini API keys configured. Set GEMINI_API_KEY in backend/.env "
            "(optional: GEMINI_API_KEY_ALPHA/BETA/GAMMA for judge-specific keys)."
        )

    last_error: Optional[Exception] = None
    for key_index, api_key in enumerate(keys):
        for attempt in range(retries):
            try:
                return _generate_with_key(
                    api_key,
                    prompt,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type=response_mime_type,
                )
            except Exception as exc:
                last_error = exc
                if _is_quota_error(exc):
                    logger.warning(
                        "Gemini quota hit for key #%s (agent=%s); trying next key.",
                        key_index + 1,
                        agent,
                    )
                    break
                logger.warning(
                    "Gemini attempt %s/%s (key #%s) failed: %s",
                    attempt + 1,
                    retries,
                    key_index + 1,
                    exc,
                )
                if attempt + 1 < retries:
                    time.sleep(0.8 * (attempt + 1))

    raise RuntimeError(
        f"All Gemini API keys exhausted or failed for agent '{agent}'. Last error: {last_error}"
    )


def generate_json(
    prompt: Any,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
    retries: int = 2,
    agent: str = "default",
) -> dict:
    raw = generate_text(
        prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        response_mime_type="application/json",
        retries=retries,
        agent=agent,
    )
    return json.loads(_extract_json_text(raw))


def generate_json_resilient(
    prompt: Any,
    *,
    agent: str = "default",
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
) -> Tuple[dict, str]:
    """Returns (parsed_json, engine_label) where engine_label is 'gemini' or raises."""
    data = generate_json(
        prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        retries=2,
        agent=agent,
    )
    return data, "gemini"


def get_model(model_name: Optional[str] = None) -> genai.GenerativeModel:
    if not is_configured():
        raise RuntimeError(
            "Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env."
        )
    return genai.GenerativeModel(model_name or GEMINI_MODEL)
