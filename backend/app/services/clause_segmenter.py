"""
LexGuard AI — Intelligent Legal Clause Segmentation Engine
============================================================
Splits contracts into logical, structured clauses using Gemini AI.

Capabilities:
  - Detect numbered sections, subsections, bullet points, headings
  - Classify each clause by legal category
  - Generate plain-English simplified explanations per clause
  - Preserve parent-child clause relationships
  - Return structured JSON consumed by downstream AI agents
  - Handle messy OCR text and inconsistent formatting robustly
"""

import os
import json
import uuid
import logging
from typing import List, Optional

from .gemini_client import generate_json, get_model, is_configured

from ..models.schemas import (
    SegmentedClause,
    ClauseSegmentationResult,
    ClauseType,
    ClauseCategory,
)

logger = logging.getLogger("LexGuard-AI.ClauseSegmenter")

# ──────────────────────────────────────────────
# Gemini Configuration
# ──────────────────────────────────────────────

_gemini_configured: bool = is_configured()


def _get_model():
    """Return the configured Gemini model instance."""
    return get_model()


# ──────────────────────────────────────────────
# Gemini-Powered Clause Segmentation
# ──────────────────────────────────────────────

def segment_clauses_fast(
    extracted_text: str,
    filename: str,
    document_id: str,
) -> ClauseSegmentationResult:
    """
    Instant local regex segmentation — no Gemini call.
    Used during full-document scan so we only pay for ONE AI request (compliance).
    """
    return _segment_locally(extracted_text, filename, document_id)


def segment_clauses(
    extracted_text: str,
    filename: str,
    document_id: str,
    *,
    use_ai: bool = True,
) -> ClauseSegmentationResult:
    """
    Use Gemini AI to intelligently segment a legal contract into
    structured clauses with classifications and simplified explanations.

    Each clause includes:
      - clause_id: unique identifier (e.g., "clause_001")
      - title: descriptive heading
      - content: the original clause text
      - simplified_explanation: plain-English, point-wise explanation
      - clause_type: structural type (NUMBERED_SECTION, SUBSECTION, etc.)
      - risk_category: legal category (INDEMNIFICATION, LIABILITY, etc.)
      - parent_clause_id: for subsections, the ID of the parent clause

    Falls back to a regex-based local parser if Gemini is unavailable.
    Set use_ai=False for fast scan mode (local only).
    """
    if not use_ai:
        return segment_clauses_fast(extracted_text, filename, document_id)

    if _gemini_configured:
        try:
            return _segment_with_gemini(extracted_text, filename, document_id)
        except Exception as e:
            logger.error(f"Gemini clause segmentation failed: {e}. Using local fallback.")

    # Fallback: local regex-based segmentation
    return _segment_locally(extracted_text, filename, document_id)


def _segment_with_gemini(
    text: str,
    filename: str,
    document_id: str,
) -> ClauseSegmentationResult:
    """
    Send extracted text to Gemini for intelligent clause segmentation.
    Returns fully structured ClauseSegmentationResult.
    """
    prompt: str = f"""You are LexGuard AI, an expert legal contract clause segmentation engine.

Analyze the following legal document text from "{filename}" and split it into individual, logical clauses.

For EACH clause you identify, return a JSON object with these exact fields:
1. "clause_id": a sequential ID like "clause_001", "clause_002", etc.
2. "title": a short, descriptive title for the clause (e.g., "Limitation of Liability", "Payment Terms")
3. "content": the EXACT original text of the clause as it appears in the document
4. "simplified_explanation": a clear, plain-English, point-wise explanation of what this clause means for a non-lawyer. Use bullet points (•) for each key point. Cover EVERY detail — amounts, dates, obligations, penalties, rights. Do NOT be vague.
5. "clause_type": one of: "NUMBERED_SECTION", "SUBSECTION", "BULLET_POINT", "HEADING", "DEFINITION", "PARAGRAPH", "SCHEDULE", "RECITAL"
6. "risk_category": one of: "INDEMNIFICATION", "LIMITATION OF LIABILITY", "TERMINATION & RENEWAL", "INTELLECTUAL PROPERTY", "WARRANTY & DISCLAIMER", "CONFIDENTIALITY", "PAYMENT & FEES", "REGULATORY COMPLIANCE", "GOVERNING LAW", "DATA PRIVACY", "FORCE MAJEURE", "GENERAL/OTHER"
7. "parent_clause_id": if this is a sub-clause, provide the clause_id of its parent section. Otherwise null.

CRITICAL INSTRUCTIONS:
- Segment EVERY part of the document — preamble, definitions, schedules, exhibits, signatures.
- Do NOT merge multiple distinct clauses into one.
- Do NOT skip short clauses or boilerplate — include everything.
- For "simplified_explanation", think of explaining to someone who has never read a contract before. Be specific, not generic. Reference actual numbers, dates, party names from the text.
- Handle messy OCR text gracefully — infer section boundaries from context if formatting is inconsistent.

Also provide:
- "document_summary": A 3-5 sentence high-level summary of the entire document's purpose and scope.

Return a single JSON object with this structure:
{{
  "document_summary": "...",
  "clauses": [
    {{
      "clause_id": "clause_001",
      "title": "...",
      "content": "...",
      "simplified_explanation": "...",
      "clause_type": "...",
      "risk_category": "...",
      "parent_clause_id": null
    }}
  ]
}}

Return ONLY valid JSON. No markdown formatting.

DOCUMENT TEXT:
{text}
"""

    data: dict = generate_json(
        prompt,
        temperature=0.12,
        max_output_tokens=12000,
        retries=2,
    )
    logger.info(f"Gemini returned {len(data.get('clauses', []))} segmented clauses.")

    # Parse into Pydantic models
    clauses: List[SegmentedClause] = []
    for item in data.get("clauses", []):
        try:
            clause = SegmentedClause(
                clause_id=item.get("clause_id", f"clause_{uuid.uuid4().hex[:6]}"),
                title=item.get("title", "Untitled Clause"),
                content=item.get("content", ""),
                simplified_explanation=item.get("simplified_explanation", "No simplification available."),
                clause_type=_safe_clause_type(item.get("clause_type", "PARAGRAPH")),
                risk_category=_safe_risk_category(item.get("risk_category", "GENERAL/OTHER")),
                parent_clause_id=item.get("parent_clause_id", None),
            )
            clauses.append(clause)
        except Exception as parse_err:
            logger.warning(f"Skipped malformed clause: {parse_err}")

    return ClauseSegmentationResult(
        document_id=document_id,
        filename=filename,
        total_clauses=len(clauses),
        clauses=clauses,
        document_summary=data.get("document_summary", "Legal document analyzed and segmented."),
    )


# ──────────────────────────────────────────────
# Local Fallback Segmenter (regex-based)
# ──────────────────────────────────────────────

def _segment_locally(
    text: str,
    filename: str,
    document_id: str,
) -> ClauseSegmentationResult:
    """
    Fallback clause segmenter using regex pattern matching.
    Splits on numbered sections, headings, and paragraph breaks.
    """
    import re

    clauses: List[SegmentedClause] = []

    # Split on common legal section patterns
    # Match patterns like "1.", "1.1", "Section 1", "ARTICLE I", "a)", "(a)", etc.
    section_pattern = re.compile(
        r'(?:^|\n\n)'
        r'(?:'
        r'(?:\d+\.[\d.]*\s+[A-Z])'  # "1. HEADING" or "1.1 Sub"
        r'|(?:Section\s+\d+)'        # "Section 1"
        r'|(?:ARTICLE\s+[IVX\d]+)'   # "ARTICLE I"
        r'|(?:[A-Z][A-Z\s&]{4,})'    # "ALL CAPS HEADING"
        r')',
        re.MULTILINE
    )

    # Find all split points
    splits = list(section_pattern.finditer(text))

    if not splits:
        # No sections found — treat entire text as one clause
        clauses.append(SegmentedClause(
            clause_id="clause_001",
            title="Full Document",
            content=text[:2000] if len(text) > 2000 else text,
            simplified_explanation="This document could not be automatically segmented into distinct clauses. Manual review recommended.",
            clause_type=ClauseType.PARAGRAPH,
            risk_category=ClauseCategory.OTHER,
            parent_clause_id=None,
        ))
    else:
        for i, match in enumerate(splits):
            start: int = match.start()
            end: int = splits[i + 1].start() if i + 1 < len(splits) else len(text)
            section_text: str = text[start:end].strip()

            if len(section_text) < 10:
                continue

            # Extract title from first line
            lines = section_text.split("\n", 1)
            title: str = lines[0].strip()[:80]
            content: str = section_text

            clauses.append(SegmentedClause(
                clause_id=f"clause_{i + 1:03d}",
                title=title,
                content=content,
                simplified_explanation=f"This section covers: {title}. Please refer to the full text for details.",
                clause_type=ClauseType.NUMBERED_SECTION,
                risk_category=ClauseCategory.OTHER,
                parent_clause_id=None,
            ))

    return ClauseSegmentationResult(
        document_id=document_id,
        filename=filename,
        total_clauses=len(clauses),
        clauses=clauses,
        document_summary=f"Document '{filename}' segmented into {len(clauses)} clauses using local pattern matching.",
    )


# ──────────────────────────────────────────────
# Safe Enum Parsers
# ──────────────────────────────────────────────

def _safe_clause_type(value: str) -> ClauseType:
    """Safely convert a string to ClauseType enum, defaulting to PARAGRAPH."""
    try:
        return ClauseType(value)
    except (ValueError, KeyError):
        return ClauseType.PARAGRAPH


def _safe_risk_category(value: str) -> ClauseCategory:
    """Safely convert a string to ClauseCategory enum, defaulting to OTHER."""
    try:
        return ClauseCategory(value)
    except (ValueError, KeyError):
        return ClauseCategory.OTHER
