"""
LexGuard AI — Legal Simplification & Multilingual Translation Engine
=====================================================================
Converts a legal clause into three clarity levels:
  1. Professional   — precise legal/business language
  2. Simple         — plain English for educated non-lawyers
  3. Illiterate-friendly — conversational, real-world consequences

Then translates each level into Hindi, Kannada, Tamil, Telugu.
"""

import json
import logging
from typing import Optional

from .gemini_client import generate_json, is_configured

logger = logging.getLogger("LexGuard-AI.LegalSimplifier")

_configured = is_configured()


def _call_gemini_json(prompt: str) -> dict:
    """Synchronous Gemini JSON call with markdown fence stripping."""
    if not _configured:
        raise RuntimeError("Gemini API key not configured.")
    return generate_json(
        prompt,
        temperature=0.08,
        max_output_tokens=6000,
        retries=2,
    )


# ──────────────────────────────────────────────────────────
# Step 1 — Three-Level Simplification
# ──────────────────────────────────────────────────────────

SIMPLIFY_PROMPT = """You are LexGuard AI, an elite legal simplification engine.

Analyze this contract clause and produce THREE different explanations for three audiences.

CLAUSE TITLE: {title}
CLAUSE TEXT:
{content}

Return ONLY this exact JSON (no markdown, no extra keys):
{{
  "professional": {{
    "explanation": "<2-3 sentences using correct legal/business terminology. Precise, no fluff.>",
    "advantages": ["<advantage 1>", "<advantage 2>"],
    "disadvantages": ["<disadvantage 1>", "<disadvantage 2>"],
    "real_world_consequence": "<One specific real-world scenario that could occur under this clause>"
  }},
  "simple": {{
    "explanation": "<2-3 sentences in plain everyday English. No jargon. Explain what this clause actually DOES to you.>",
    "advantages": ["<advantage in plain language>", "<advantage 2>"],
    "disadvantages": ["<disadvantage in plain language>", "<disadvantage 2>"],
    "real_world_consequence": "<Concrete example: 'If X happens, then Y happens to you'>"
  }},
  "illiterate_friendly": {{
    "explanation": "<2-3 very short, simple sentences. Use analogies. Imagine explaining to someone who has never signed a contract. No technical terms at all.>",
    "advantages": ["<advantage in the simplest possible words>"],
    "disadvantages": ["<disadvantage in the simplest possible words>", "<another>"],
    "real_world_consequence": "<Story-style example: 'Think of it like this: if you rent a shop and something breaks...'>"
  }}
}}"""


def simplify_clause(title: str, content: str) -> dict:
    """Generate 3-level simplification for a legal clause."""
    logger.info(f"Simplifying clause: '{title}'")
    try:
        prompt = SIMPLIFY_PROMPT.format(title=title, content=content)
        data = _call_gemini_json(prompt)

        # Validate structure
        result = {}
        for level in ("professional", "simple", "illiterate_friendly"):
            lvl = data.get(level, {})
            result[level] = {
                "explanation": str(lvl.get("explanation", "")),
                "advantages": [str(a) for a in lvl.get("advantages", [])],
                "disadvantages": [str(d) for d in lvl.get("disadvantages", [])],
                "real_world_consequence": str(lvl.get("real_world_consequence", "")),
            }
        return result
    except Exception as e:
        logger.error(f"Simplification failed: {e}")
        raise RuntimeError(f"Gemini simplification failed: {e}") from e


def _fallback_simplification(title: str) -> dict:
    base = f"This clause titled '{title}' contains standard legal obligations."
    return {
        "professional": {
            "explanation": f"{base} It allocates rights, obligations and risks between the contracting parties.",
            "advantages": ["Provides legal clarity", "Allocates risk predictably"],
            "disadvantages": ["May favour the drafting party", "Could limit your legal remedies"],
            "real_world_consequence": "If a dispute arises, this clause determines who bears the financial burden.",
        },
        "simple": {
            "explanation": f"This part of the contract sets rules about '{title}'. It decides what each side must do and what happens if things go wrong.",
            "advantages": ["You know exactly what to expect", "Rules are written down"],
            "disadvantages": ["The rules may not be fair to you", "You may give up some rights"],
            "real_world_consequence": "If something goes wrong, you might only get back a small amount even if you lose a lot.",
        },
        "illiterate_friendly": {
            "explanation": f"This is a rule in the agreement. It talks about '{title}'. Think of it like a rule in a game — everyone must follow it.",
            "advantages": ["Everyone knows the rules from the start"],
            "disadvantages": ["The rule was made by the other side", "It may not protect you fully"],
            "real_world_consequence": "It is like buying something and not being able to return it if it is broken — always check before you sign.",
        },
    }


# ──────────────────────────────────────────────────────────
# Step 2 — Multilingual Translation
# ──────────────────────────────────────────────────────────

TRANSLATE_PROMPT = """You are a professional legal translator working for LexGuard AI.

Translate the following legal explanations into {language}. 
Rules:
- Preserve the exact legal meaning.
- Use natural, conversational {language} — not word-for-word translation.
- Keep the same tone as the original (professional stays formal, illiterate_friendly stays simple).
- Do NOT add or remove information.

EXPLANATIONS (JSON):
{content}

Return ONLY this exact JSON structure with all fields translated into {language}:
{{
  "professional": {{
    "explanation": "<translated>",
    "advantages": ["<translated advantage 1>", "<translated advantage 2>"],
    "disadvantages": ["<translated disadvantage 1>", "<translated disadvantage 2>"],
    "real_world_consequence": "<translated>"
  }},
  "simple": {{
    "explanation": "<translated>",
    "advantages": ["<translated>", "<translated>"],
    "disadvantages": ["<translated>", "<translated>"],
    "real_world_consequence": "<translated>"
  }},
  "illiterate_friendly": {{
    "explanation": "<translated>",
    "advantages": ["<translated>"],
    "disadvantages": ["<translated>", "<translated>"],
    "real_world_consequence": "<translated>"
  }}
}}"""

TRANSLATE_PROMPT = """You are a professional legal translator working for LexGuard AI.

Translate the following legal explanations into {language}.
Rules:
- Preserve the exact legal meaning.
- Use the native script for {language}; do not output romanized text unless a legal term is normally used that way.
- Use formal legal {language} for professional, plain everyday {language} for simple, and very easy spoken {language} for illiterate_friendly.
- Keep the same tone as the original.
- Do NOT add or remove information.
- Translate every string in every field, including list items.

EXPLANATIONS (JSON):
{content}

Return ONLY this exact JSON structure with all fields translated into {language}:
{{
  "professional": {{
    "explanation": "<translated>",
    "advantages": ["<translated advantage 1>", "<translated advantage 2>"],
    "disadvantages": ["<translated disadvantage 1>", "<translated disadvantage 2>"],
    "real_world_consequence": "<translated>"
  }},
  "simple": {{
    "explanation": "<translated>",
    "advantages": ["<translated>", "<translated>"],
    "disadvantages": ["<translated>", "<translated>"],
    "real_world_consequence": "<translated>"
  }},
  "illiterate_friendly": {{
    "explanation": "<translated>",
    "advantages": ["<translated>"],
    "disadvantages": ["<translated>", "<translated>"],
    "real_world_consequence": "<translated>"
  }}
}}"""

SUPPORTED_LANGUAGES = {
    "hindi": "Hindi",
    "kannada": "Kannada",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "bengali": "Bengali",
    "malayalam": "Malayalam",
}


def translate_simplification(simplification: dict, language_code: str) -> dict:
    """Translate a simplification dict into a regional language."""
    language_name = SUPPORTED_LANGUAGES.get(language_code.lower())
    if not language_name:
        raise ValueError(f"Unsupported language: {language_code}. Supported: {list(SUPPORTED_LANGUAGES.keys())}")

    logger.info(f"Translating simplification into {language_name}")
    try:
        content_json = json.dumps(simplification, ensure_ascii=False, indent=2)
        prompt = TRANSLATE_PROMPT.format(language=language_name, content=content_json)
        return _call_gemini_json(prompt)
    except Exception as e:
        logger.error(f"Translation to {language_name} failed: {e}")
        raise RuntimeError(f"Gemini translation to {language_name} failed: {e}") from e


# ──────────────────────────────────────────────────────────
# Combined Entry Point
# ──────────────────────────────────────────────────────────

def simplify_and_translate(
    title: str,
    content: str,
    language: Optional[str] = None,
) -> dict:
    """
    Main entry point: simplify clause into 3 levels, optionally translate.
    Returns structured JSON ready for API response.
    """
    simplification = simplify_clause(title, content)

    translations = {}
    if language:
        translations[language] = translate_simplification(simplification, language)

    return {
        "clause_title": title,
        "english": simplification,
        "translations": translations,
    }
