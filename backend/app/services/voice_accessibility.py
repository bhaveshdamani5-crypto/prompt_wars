"""
LexGuard AI — Voice Accessibility Script Builder
=================================================
Prepares simplified legal text for browser TTS (Web Speech API).
No audio generation on server — formats text with pause markers and
literacy-tier phrasing for natural narration in 7 Indian languages.
"""

import re
from typing import Any, Dict, List, Optional

SUPPORTED_VOICE_LANGUAGES = {
    "english": "en-IN",
    "hindi": "hi-IN",
    "kannada": "kn-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "bengali": "bn-IN",
    "malayalam": "ml-IN",
}

LiteracyTier = str  # professional | simple | illiterate_friendly

# Per-language pause hints (comma density, section breaks)
LANG_PAUSE_STYLE: Dict[str, Dict[str, float]] = {
    "english": {"comma_pause": 1.0, "section_pause": 1.2},
    "hindi": {"comma_pause": 1.1, "section_pause": 1.3},
    "kannada": {"comma_pause": 1.1, "section_pause": 1.3},
    "tamil": {"comma_pause": 1.1, "section_pause": 1.3},
    "telugu": {"comma_pause": 1.1, "section_pause": 1.3},
    "bengali": {"comma_pause": 1.1, "section_pause": 1.3},
    "malayalam": {"comma_pause": 1.1, "section_pause": 1.3},
}

MAX_CHUNK_CHARS = 180
MAX_DOCUMENT_SECTIONS = 40


def _inject_pauses(text: str, language: str) -> str:
    """Add natural pauses via punctuation (SSML-free, works in Web Speech API)."""
    style = LANG_PAUSE_STYLE.get(language, LANG_PAUSE_STYLE["english"])
    multiplier = style["section_pause"]

    cleaned = (
        text.replace("#", "")
        .replace("*", "")
        .replace("`", "")
        .replace("\n\n", ". ")
        .replace("\n", ", ")
    )
    # Section headings → longer pause
    cleaned = re.sub(r"^([A-Z][A-Z\s&.]{4,})\s*$", r"\1. ", cleaned, flags=re.MULTILINE)
    # Lists → pause between items
    cleaned = re.sub(r"^[•\-–]\s+", ". ", cleaned, flags=re.MULTILINE)
    # Legal shorthand
    cleaned = re.sub(r"\bvs\.", "versus", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\be\.g\.", "for example", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bi\.e\.", "that is", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"₹\s*([\d,]+)", r"\1 rupees", cleaned)
    # Extra comma pauses for slower languages
    if multiplier > 1.0:
        cleaned = re.sub(r";\s*", ", , ", cleaned)
        cleaned = re.sub(r":\s*", ", ", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    if cleaned and not cleaned.endswith((".", "!", "?")):
        cleaned += "."
    return cleaned


def _chunk_for_speech(text: str, max_chars: int = MAX_CHUNK_CHARS) -> List[str]:
    """Split into TTS-friendly chunks on sentence boundaries."""
    if len(text) <= max_chars:
        return [text] if text.strip() else []

    chunks: List[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    current = ""

    for sentence in sentences:
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            if len(sentence) > max_chars:
                for part in re.split(r"(?<=[,;])\s+", sentence):
                    if len(part) <= max_chars:
                        chunks.append(part)
                    else:
                        for i in range(0, len(part), max_chars):
                            chunks.append(part[i : i + max_chars])
            else:
                current = sentence
    if current:
        chunks.append(current)
    return [c.strip() for c in chunks if c.strip()]


def build_voice_script_from_simplification(
    simplification: dict,
    *,
    literacy_tier: LiteracyTier = "simple",
    language: str = "english",
    include_advantages: bool = True,
    include_consequences: bool = True,
) -> Dict[str, Any]:
    """
    Build a speakable script from legal_simplifier output (english or translated block).
    """
    tier = literacy_tier if literacy_tier in ("professional", "simple", "illiterate_friendly") else "simple"
    block = simplification.get(tier, simplification.get("simple", {}))

    parts: List[str] = []
    title_hint = simplification.get("_clause_title", "")
    if title_hint:
        parts.append(f"Clause: {title_hint}.")

    expl = block.get("explanation", "")
    if expl:
        parts.append(expl)

    if include_consequences:
        rwc = block.get("real_world_consequence", "")
        if rwc:
            parts.append(f"In real life: {rwc}")

    if include_advantages:
        adv = block.get("advantages", [])
        if adv:
            parts.append("Advantages: " + ". ".join(adv[:3]) + ".")

        dis = block.get("disadvantages", [])
        if dis:
            parts.append("Risks to watch: " + ". ".join(dis[:3]) + ".")

    raw = " ".join(parts)
    paused = _inject_pauses(raw, language)
    chunks = _chunk_for_speech(paused)

    return {
        "language": language,
        "bcp47": SUPPORTED_VOICE_LANGUAGES.get(language, "en-IN"),
        "literacy_tier": tier,
        "full_script": paused,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "estimated_speak_minutes": round(len(paused) / 900, 1),
    }


def build_voice_script_from_plain_text(
    text: str,
    *,
    language: str = "english",
    section_title: Optional[str] = None,
) -> Dict[str, Any]:
    """Format arbitrary simplified explanation text for TTS."""
    body = text
    if section_title:
        body = f"{section_title}. {body}"
    paused = _inject_pauses(body, language)
    chunks = _chunk_for_speech(paused)
    return {
        "language": language,
        "bcp47": SUPPORTED_VOICE_LANGUAGES.get(language, "en-IN"),
        "full_script": paused,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "estimated_speak_minutes": round(len(paused) / 900, 1),
    }


def build_long_document_voice_queue(
    sections: List[Dict[str, str]],
    *,
    language: str = "english",
    max_sections: int = MAX_DOCUMENT_SECTIONS,
) -> Dict[str, Any]:
    """
    Handle long documents: queue section-by-section scripts.
    Each section: { "title": str, "text": str }
    """
    limited = sections[:max_sections]
    queue: List[Dict[str, Any]] = []
    total_chunks = 0

    for i, sec in enumerate(limited):
        script = build_voice_script_from_plain_text(
            sec.get("text", ""),
            language=language,
            section_title=sec.get("title"),
        )
        script["section_index"] = i
        queue.append(script)
        total_chunks += script["chunk_count"]

    return {
        "language": language,
        "section_count": len(queue),
        "truncated": len(sections) > max_sections,
        "total_chunks": total_chunks,
        "sections": queue,
        "estimated_speak_minutes": round(total_chunks * 12 / 60, 1),
    }
