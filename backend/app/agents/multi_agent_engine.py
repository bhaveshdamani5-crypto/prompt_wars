"""
LexGuard AI — Multi-Agent Legal Reasoning Engine (Gemini only).
Alpha, Beta, Gamma each use dedicated API key chains when the primary key is exhausted.
"""

import asyncio
import logging
from typing import Any, Dict, Optional

from ..services.gemini_client import generate_json, is_configured

logger = logging.getLogger("LexGuard-AI.MultiAgentEngine")

JUDGE_KEY_HINT = (
    "Add judge API keys to backend/.env: GEMINI_API_KEY_ALPHA, GEMINI_API_KEY_BETA, "
    "GEMINI_API_KEY_GAMMA (or GEMINI_API_KEYS as comma-separated fallbacks)."
)


async def _call(prompt: str, agent: str, retries: int = 3) -> dict:
    if not is_configured():
        raise RuntimeError(f"Gemini is not configured. {JUDGE_KEY_HINT}")

    last_err: Optional[Exception] = None
    for attempt in range(retries):
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                lambda: generate_json(
                    prompt,
                    temperature=0.15,
                    max_output_tokens=5000,
                    retries=1,
                    agent=agent,
                ),
            )
        except Exception as e:
            last_err = e
            wait = 2 ** attempt
            logger.warning("Agent %s attempt %s failed: %s", agent, attempt + 1, e)
            await asyncio.sleep(wait)

    raise RuntimeError(f"Agent {agent} failed. {JUDGE_KEY_HINT} Last error: {last_err}")


ALPHA_PROMPT = """You are Agent Alpha — the Corporate Defender inside LexGuard AI.
Defend this clause from the corporation's perspective.

CLAUSE TITLE: {title}
CLAUSE TEXT:
{content}

Return ONLY this JSON:
{{
  "intent": "<one sentence>",
  "defense_points": ["<point 1>", "<point 2>", "<point 3>"]
}}"""


BETA_PROMPT = """You are Agent Beta — the Consumer Advocate inside LexGuard AI.
Identify unfair or exploitative elements for an ordinary person.

CLAUSE TITLE: {title}
CLAUSE TEXT:
{content}

Return ONLY this JSON:
{{
  "unfairness_reasons": "<one sentence>",
  "flaws": ["<flaw 1>", "<flaw 2>", "<flaw 3>"]
}}"""


GAMMA_PROMPT = """You are Agent Gamma — the Neutral Legal Judge inside LexGuard AI.

CLAUSE TITLE: {title}
CLAUSE TEXT:
{content}

ALPHA (Corporate Defender):
Intent: {alpha_intent}
Points: {alpha_points}

BETA (Consumer Advocate):
Unfairness: {beta_unfairness}
Flaws: {beta_flaws}

Return ONLY this JSON:
{{
  "balanced_verdict": "<2-3 sentences>",
  "fairness_score": <integer 0-100>,
  "risk_level": "HIGH"|"MEDIUM"|"LOW"|"INFO",
  "recommendation": "safe"|"caution"|"negotiate"|"avoid",
  "revised_clause": "<full alternative clause>",
  "key_changes": ["<change 1>", "<change 2>"]
}}"""


async def run_alpha(title: str, content: str) -> dict:
    data = await _call(ALPHA_PROMPT.format(title=title, content=content), "alpha")
    return {
        "intent": str(data.get("intent", "")),
        "defense_points": [str(p) for p in data.get("defense_points", [])[:5]],
    }


async def run_beta(title: str, content: str) -> dict:
    data = await _call(BETA_PROMPT.format(title=title, content=content), "beta")
    return {
        "unfairness_reasons": str(data.get("unfairness_reasons", "")),
        "flaws": [str(f) for f in data.get("flaws", [])[:5]],
    }


async def run_gamma(title: str, content: str, alpha: dict, beta: dict) -> dict:
    data = await _call(
        GAMMA_PROMPT.format(
            title=title,
            content=content,
            alpha_intent=alpha.get("intent", ""),
            alpha_points="; ".join(alpha.get("defense_points", [])),
            beta_unfairness=beta.get("unfairness_reasons", ""),
            beta_flaws="; ".join(beta.get("flaws", [])),
        ),
        "gamma",
    )
    score = max(0, min(100, int(data.get("fairness_score", 50))))
    risk = str(data.get("risk_level", "MEDIUM")).upper()
    if risk not in ("HIGH", "MEDIUM", "LOW", "INFO"):
        risk = "MEDIUM"
    rec = str(data.get("recommendation", "negotiate")).lower()
    if rec not in ("safe", "caution", "negotiate", "avoid"):
        rec = "negotiate"
    return {
        "balanced_verdict": str(data.get("balanced_verdict", "")),
        "fairness_score": score,
        "risk_level": risk,
        "recommendation": rec,
        "revised_clause": str(data.get("revised_clause", "")),
        "key_changes": [str(c) for c in data.get("key_changes", [])[:3]],
    }


async def run_clause_multi_agent_audit(
    clause_title: str,
    clause_content: str,
    document_context: str = "",
) -> Dict[str, Any]:
    _ = document_context  # reserved for future context-aware prompts
    logger.info("Multi-Agent audit (Gemini): '%s'", clause_title)

    alpha_result, beta_result = await asyncio.gather(
        run_alpha(clause_title, clause_content),
        run_beta(clause_title, clause_content),
    )
    gamma_result = await run_gamma(clause_title, clause_content, alpha_result, beta_result)

    return {
        "clause_title": clause_title,
        "clause_content": clause_content,
        "corporate_defender": alpha_result,
        "consumer_protection": beta_result,
        "neutral_judge": gamma_result,
        "engine_source": "gemini",
    }
