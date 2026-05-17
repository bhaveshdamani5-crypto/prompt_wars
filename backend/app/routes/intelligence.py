"""
LexGuard AI — Legal Intelligence Routes
=========================================
Endpoints for:
  - Legal simplification (3 levels) + multilingual translation
  - Interactive AI negotiation assistant (session-based)
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.legal_simplifier import simplify_and_translate, SUPPORTED_LANGUAGES
from ..services.voice_accessibility import (
    SUPPORTED_VOICE_LANGUAGES,
    build_voice_script_from_simplification,
    build_long_document_voice_queue,
)
from ..services.negotiation_assistant import (
    create_session,
    negotiate,
    get_session_summary,
    NEGOTIATION_SESSIONS,
)

logger = logging.getLogger("LexGuard-AI.Routes.Intelligence")
router = APIRouter(prefix="/intelligence", tags=["Legal Intelligence"])


# ──────────────────────────────────────────────
# POST /api/intelligence/simplify
# ──────────────────────────────────────────────

class SimplifyRequest(BaseModel):
    clause_title: str
    clause_content: str
    language: Optional[str] = None  # "hindi", "kannada", "tamil", "telugu"


@router.post("/simplify")
async def simplify_clause_endpoint(payload: SimplifyRequest):
    """
    Simplify a legal clause into 3 levels (Professional / Simple / Illiterate-friendly).
    Optionally translate all levels into Hindi, Kannada, Tamil, or Telugu.
    """
    logger.info(f"Simplify request: '{payload.clause_title}' lang={payload.language}")

    if payload.language and payload.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{payload.language}'. Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )

    try:
        result = simplify_and_translate(
            title=payload.clause_title,
            content=payload.clause_content,
            language=payload.language,
        )
        return result
    except Exception as e:
        logger.error(f"Simplification failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simplification engine error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/intelligence/negotiate/start
# ──────────────────────────────────────────────

class NegotiationStartRequest(BaseModel):
    document_id: str
    clause_title: str
    clause_content: str
    initial_analysis: Optional[dict] = None


@router.post("/negotiate/start")
async def start_negotiation(payload: NegotiationStartRequest):
    """
    Start a new negotiation session for a specific clause.
    Returns a session_id to use in subsequent /negotiate/turn calls.
    """
    logger.info(f"New negotiation session: '{payload.clause_title}'")
    try:
        session_id = create_session(
            document_id=payload.document_id,
            clause_title=payload.clause_title,
            clause_content=payload.clause_content,
            initial_analysis=payload.initial_analysis,
        )
        return {
            "session_id": session_id,
            "clause_title": payload.clause_title,
            "status": "session_active",
            "message": "Negotiation session started. Send your first concern or priority to /negotiate/turn.",
        }
    except Exception as e:
        logger.error(f"Failed to start negotiation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# POST /api/intelligence/negotiate/turn
# ──────────────────────────────────────────────

class NegotiationTurnRequest(BaseModel):
    session_id: str
    user_concern: str


@router.post("/negotiate/turn")
async def negotiation_turn(payload: NegotiationTurnRequest):
    """
    Submit one negotiation turn — the user's concern or priority.
    The AI adapts its recommendation contextually and maintains memory.
    """
    logger.info(f"Negotiation turn: session={payload.session_id}")
    try:
        result = negotiate(payload.session_id, payload.user_concern)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Negotiation turn failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Negotiation engine error: {str(e)}")


# ──────────────────────────────────────────────
# GET /api/intelligence/negotiate/summary/{session_id}
# ──────────────────────────────────────────────

@router.get("/negotiate/summary/{session_id}")
async def get_negotiation_summary(session_id: str):
    """Return a full transcript and summary of a negotiation session."""
    try:
        return get_session_summary(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────
# POST /api/intelligence/voice-script
# ──────────────────────────────────────────────

class VoiceScriptRequest(BaseModel):
    clause_title: str
    clause_content: str
    language: str = "english"
    literacy_tier: str = "simple"
    translate_first: bool = False


class VoiceDocumentRequest(BaseModel):
    sections: list  # [{ "title": str, "text": str }]
    language: str = "english"


@router.get("/voice/languages")
async def list_voice_languages():
    """Supported TTS languages and BCP-47 tags."""
    return {
        "languages": [
            {"code": k, "bcp47": v} for k, v in SUPPORTED_VOICE_LANGUAGES.items()
        ]
    }


@router.post("/voice-script")
async def create_voice_script(payload: VoiceScriptRequest):
    """
    Simplify (optional translate) then return TTS-ready script with pause-optimized chunks.
    """
    lang = payload.language.lower()
    if lang not in SUPPORTED_VOICE_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Supported: {list(SUPPORTED_VOICE_LANGUAGES.keys())}",
        )

    try:
        simplification_block = None
        if payload.translate_first and lang != "english":
            full = simplify_and_translate(
                payload.clause_title,
                payload.clause_content,
                language=lang,
            )
            simplification_block = full["translations"].get(lang, full["english"])
        else:
            full = simplify_and_translate(payload.clause_title, payload.clause_content)
            simplification_block = full["english"]

        simplification_block["_clause_title"] = payload.clause_title
        script = build_voice_script_from_simplification(
            simplification_block,
            literacy_tier=payload.literacy_tier,
            language=lang if lang != "english" else "english",
        )
        script["clause_title"] = payload.clause_title
        return script
    except Exception as e:
        logger.error(f"Voice script failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-document")
async def create_document_voice_queue(payload: VoiceDocumentRequest):
    """Queue long documents section-by-section for progressive TTS playback."""
    lang = payload.language.lower()
    if lang not in SUPPORTED_VOICE_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")
    try:
        return build_long_document_voice_queue(payload.sections, language=lang)
    except Exception as e:
        logger.error(f"Voice document queue failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
