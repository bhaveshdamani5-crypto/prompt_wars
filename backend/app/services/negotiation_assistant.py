"""
LexGuard AI — Interactive AI Negotiation Assistant
====================================================
Maintains a persistent negotiation session per document.
The AI adapts its legal recommendations based on user-provided
priorities, concerns, and trade-off acceptances.

Memory model: per-session list of turns stored in NEGOTIATION_SESSIONS.
Each turn includes:
  - user's concern / priority
  - updated verdict
  - updated recommendation
  - specific trade-off explanation
  - negotiation leverage points
"""

import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional

from .gemini_client import generate_json, is_configured

logger = logging.getLogger("LexGuard-AI.NegotiationAssistant")

_configured = is_configured()

# In-memory session store: session_id → session data
NEGOTIATION_SESSIONS: Dict[str, Dict[str, Any]] = {}


# ──────────────────────────────────────────────────────────
# Session Management
# ──────────────────────────────────────────────────────────

def create_session(
    document_id: str,
    clause_title: str,
    clause_content: str,
    initial_analysis: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create a new negotiation session for a specific contract clause.
    Returns a session_id for subsequent turns.
    """
    session_id = str(uuid.uuid4())
    NEGOTIATION_SESSIONS[session_id] = {
        "session_id": session_id,
        "document_id": document_id,
        "clause_title": clause_title,
        "clause_content": clause_content,
        "initial_analysis": initial_analysis or {},
        "history": [],  # List of {user_concern, ai_response}
        "current_verdict": initial_analysis.get("verdict", "Needs Review") if initial_analysis else "Needs Review",
        "current_recommendation": "negotiate",
        "accepted_tradeoffs": [],
    }
    logger.info(f"Negotiation session created: {session_id} for clause '{clause_title}'")
    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    """Retrieve an existing session or raise ValueError."""
    session = NEGOTIATION_SESSIONS.get(session_id)
    if not session:
        raise ValueError(f"Negotiation session '{session_id}' not found. Start a new session first.")
    return session


# ──────────────────────────────────────────────────────────
# Core Negotiation Turn
# ──────────────────────────────────────────────────────────

NEGOTIATION_PROMPT = """You are LexGuard AI — an expert AI legal negotiation advisor.
You are in an active negotiation consultation about a specific contract clause.

Your job: listen to the user's priorities and concerns, acknowledge their trade-offs,
and dynamically update your legal recommendation based on what they tell you matters most.
Maintain continuity with previous conversation turns.

CLAUSE TITLE: {clause_title}
CLAUSE CONTENT:
{clause_content}

PRIOR CONVERSATION HISTORY:
{history_text}

PRIOR RECOMMENDATION: {prior_recommendation}
ACCEPTED TRADE-OFFS SO FAR: {accepted_tradeoffs}

USER'S NEW CONCERN / PRIORITY:
{user_concern}

Your task:
1. Acknowledge the user's concern respectfully and specifically — reference what they said.
2. Explain the legal trade-off this creates in plain English (pros and cons of accepting this).
3. Update your verdict about this clause based on their new context.
4. Provide negotiation leverage points — specific things they can ask for to protect themselves.
5. Give an updated_recommendation: one of "safe", "caution", "negotiate", "avoid".
6. If the user has accepted a trade-off, suggest a protective clause addition they could request.

Return ONLY this exact JSON (no markdown):
{{
  "acknowledgement": "<2 sentences: acknowledge their specific concern and show you understand the trade-off they are making>",
  "tradeoff_explanation": "<2-3 sentences: what they gain and what they risk by accepting this priority>",
  "updated_verdict": "<2 sentences: revised overall assessment of the clause given their context>",
  "updated_recommendation": "<one of: safe, caution, negotiate, avoid>",
  "negotiation_leverage": [
    "<Specific ask 1: what they can demand from the other party to protect themselves>",
    "<Specific ask 2>",
    "<Specific ask 3>"
  ],
  "protective_addition": "<If a trade-off is accepted: a suggested contract addition to protect their interests. Otherwise empty string.>"
}}"""


def _call_gemini(prompt: str) -> dict:
    if not _configured:
        raise RuntimeError("Gemini not configured.")
    return generate_json(
        prompt,
        temperature=0.18,
        max_output_tokens=5000,
        retries=2,
    )


def negotiate(session_id: str, user_concern: str) -> Dict[str, Any]:
    """
    Process one negotiation turn:
    - Load session memory
    - Send context + user concern to Gemini
    - Store turn in history
    - Return structured AI response
    """
    session = get_session(session_id)

    # Build readable history
    history_lines = []
    for turn in session["history"][-6:]:  # last 6 turns for context
        history_lines.append(f"User: {turn['user_concern']}")
        history_lines.append(f"Advisor: {turn['updated_verdict']}")
    history_text = "\n".join(history_lines) if history_lines else "No prior turns."

    prompt = NEGOTIATION_PROMPT.format(
        clause_title=session["clause_title"],
        clause_content=session["clause_content"],
        history_text=history_text,
        prior_recommendation=session["current_recommendation"],
        accepted_tradeoffs=", ".join(session["accepted_tradeoffs"]) or "None yet",
        user_concern=user_concern,
    )

    try:
        data = _call_gemini(prompt)

        # Validate and normalise
        rec = str(data.get("updated_recommendation", "negotiate")).lower()
        if rec not in ("safe", "caution", "negotiate", "avoid"):
            rec = "negotiate"

        result = {
            "session_id": session_id,
            "acknowledgement": str(data.get("acknowledgement", "")),
            "tradeoff_explanation": str(data.get("tradeoff_explanation", "")),
            "updated_verdict": str(data.get("updated_verdict", "")),
            "updated_recommendation": rec,
            "negotiation_leverage": [str(l) for l in data.get("negotiation_leverage", [])[:5]],
            "protective_addition": str(data.get("protective_addition", "")),
            "turn_number": len(session["history"]) + 1,
        }

    except Exception as e:
        logger.error(f"Negotiation turn failed: {e}")
        raise RuntimeError(f"Gemini negotiation turn failed: {e}") from e

    # Store in session memory
    session["history"].append({
        "user_concern": user_concern,
        "updated_verdict": result["updated_verdict"],
        "updated_recommendation": result["updated_recommendation"],
    })
    session["current_recommendation"] = result["updated_recommendation"]
    session["current_verdict"] = result["updated_verdict"]

    # Track accepted trade-offs
    concern_lower = user_concern.lower()
    tradeoff_keywords = ["worth it", "accept", "fine with", "okay with", "agree to", "happy with", "important to me"]
    if any(kw in concern_lower for kw in tradeoff_keywords):
        short_tradeoff = user_concern[:60]
        if short_tradeoff not in session["accepted_tradeoffs"]:
            session["accepted_tradeoffs"].append(short_tradeoff)

    return result


def get_session_summary(session_id: str) -> Dict[str, Any]:
    """Return a summary of the full negotiation session."""
    session = get_session(session_id)
    return {
        "session_id": session_id,
        "clause_title": session["clause_title"],
        "total_turns": len(session["history"]),
        "current_recommendation": session["current_recommendation"],
        "current_verdict": session["current_verdict"],
        "accepted_tradeoffs": session["accepted_tradeoffs"],
        "history": session["history"],
    }
