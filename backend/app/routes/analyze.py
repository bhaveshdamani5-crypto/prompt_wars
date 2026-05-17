"""
LexGuard AI — Document Upload & Analysis Routes
=================================================
FAST SCAN (default): local clause segmentation (instant) + ONE Gemini compliance
call. Previously ran two heavy Gemini calls in parallel (~20–40s). Now ~8–15s.

Text is capped at MAX_ANALYSIS_CHARS to prevent 30s+ Gemini latency on huge docs.
"""

import asyncio
import logging
import time
import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ..models.schemas import (
    DocumentUploadResponse,
    ContractAnalysisResult,
    ClauseSegmentationResult,
    MultiAgentAuditRequest,
    MultiAgentAuditResponse,
)
from ..services.document_service import process_document_upload
from ..services.clause_segmenter import segment_clauses, segment_clauses_fast
from ..services.gemini_service import analyze_contract_text
from ..services.material_text import extract_material_text
from ..agents.compliance_agent import get_policy_by_id
from ..agents.multi_agent_engine import run_clause_multi_agent_audit
from ..utils.store import ANALYZED_DOCUMENTS
from ..utils.sample_contract import SAMPLE_CONTRACT_TEXT

logger = logging.getLogger("LexGuard-AI.Routes.Analyze")

router = APIRouter(prefix="/analyze", tags=["Contract Analysis"])

# ── Performance: cap text sent to Gemini to avoid 30s+ waits on huge docs ──
MAX_ANALYSIS_CHARS = 30_000


def _cap_text(text: str) -> str:
    """Truncate text to MAX_ANALYSIS_CHARS for fast Gemini responses."""
    if len(text) <= MAX_ANALYSIS_CHARS:
        return text
    logger.warning(
        f"Document truncated {len(text)} → {MAX_ANALYSIS_CHARS} chars for speed."
    )
    return text[:MAX_ANALYSIS_CHARS] + "\n\n[... document truncated for performance ...]"


# ──────────────────────────────────────────────
# POST /api/analyze/upload — Upload & Extract
# ──────────────────────────────────────────────

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_and_extract_document(
    file: UploadFile = File(..., description="Legal contract file (PDF, PNG, JPG, JPEG, TXT)"),
):
    """Upload a legal document and extract + segment it."""
    filename: Optional[str] = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    logger.info(f"Upload request: '{filename}'")

    try:
        file_bytes: bytes = await file.read()
        result: dict = process_document_upload(
            file_bytes=file_bytes,
            filename=filename,
            content_type=file.content_type,
        )

        capped_text = _cap_text(result["extracted_text"])
        segmentation: ClauseSegmentationResult = segment_clauses(
            extracted_text=capped_text,
            filename=filename,
            document_id=result["document_id"],
        )

        ANALYZED_DOCUMENTS[result["document_id"]] = {
            "text": result["extracted_text"],
            "filename": filename,
            "segmentation": segmentation,
        }

        return DocumentUploadResponse(
            document_id=result["document_id"],
            filename=filename,
            file_size_kb=result["file_size_kb"],
            file_type=result["file_type"],
            page_count=result["page_count"],
            extracted_text=result["extracted_text"],
            clause_segmentation=segmentation,
        )

    except ValueError as val_err:
        logger.warning(f"Validation error for '{filename}': {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Upload failed for '{filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/analyze — Full Compliance Analysis
# OPTIMIZED: Both AI calls run CONCURRENTLY
# ──────────────────────────────────────────────

@router.post("", response_model=ContractAnalysisResult)
async def analyze_document(
    file: UploadFile = File(...),
    policy_id: str = Form("standard_vendor"),
):
    """
    Upload + full compliance analysis.
    FAST SCAN: local segmentation (ms) + single Gemini compliance call (~8–15s).
    """
    filename: Optional[str] = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    logger.info(f"Full analysis: '{filename}' policy='{policy_id}'")
    t0 = time.perf_counter()

    try:
        file_bytes: bytes = await file.read()

        # Step 1: Extract text (local; images still use one Vision call)
        result: dict = process_document_upload(
            file_bytes=file_bytes,
            filename=filename,
            content_type=file.content_type,
        )

        extracted_text: str = result["extracted_text"]
        material_text: str = extract_material_text(extracted_text)
        capped_text: str = _cap_text(material_text)

        policy = get_policy_by_id(policy_id)
        rule_descriptions: list[str] = [rule.rule_description for rule in policy.rules]

        # Step 2: Clause split on material text only (local, fast)
        segmentation = segment_clauses_fast(
            capped_text, filename, result["document_id"]
        )
        logger.info(
            f"Local segmentation done in {(time.perf_counter() - t0):.2f}s "
            f"({segmentation.total_clauses} clauses)"
        )

        # Step 3: Single Gemini compliance analysis
        loop = asyncio.get_event_loop()
        analysis = await loop.run_in_executor(
            None,
            analyze_contract_text,
            capped_text,
            filename,
            policy.name,
            rule_descriptions,
        )

        analysis.clause_segmentation = segmentation
        analysis.document_text = capped_text

        ANALYZED_DOCUMENTS[analysis.id] = {
            "text": capped_text,
            "full_text": extracted_text,
            "filename": filename,
            "analysis": analysis,
            "segmentation": segmentation,
        }

        elapsed = time.perf_counter() - t0
        logger.info(
            f"Analysis complete in {elapsed:.2f}s: "
            f"score={analysis.compliance_score}, clauses={segmentation.total_clauses}"
        )
        return analysis

    except ValueError as val_err:
        logger.warning(f"Validation error: {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Analysis failed for '{filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/analyze/sample — Demo Document
# OPTIMIZED: Concurrent AI calls
# ──────────────────────────────────────────────

@router.post("/sample", response_model=ContractAnalysisResult)
async def analyze_sample_document(
    policy_id: str = Form("standard_vendor"),
):
    """Load and analyze the built-in sample vendor agreement (fast scan)."""
    logger.info(f"Sample analysis: policy='{policy_id}'")
    t0 = time.perf_counter()

    try:
        doc_id: str = str(uuid.uuid4())
        material_text = extract_material_text(SAMPLE_CONTRACT_TEXT)
        capped_text = _cap_text(material_text)
        sample_name = "cloudscale_vendor_agreement_sample.txt"

        policy = get_policy_by_id(policy_id)
        rule_descriptions: list[str] = [rule.rule_description for rule in policy.rules]

        segmentation = segment_clauses_fast(capped_text, sample_name, doc_id)

        loop = asyncio.get_event_loop()
        analysis = await loop.run_in_executor(
            None,
            analyze_contract_text,
            capped_text,
            sample_name,
            policy.name,
            rule_descriptions,
        )

        analysis.clause_segmentation = segmentation
        analysis.document_text = capped_text

        ANALYZED_DOCUMENTS[analysis.id] = {
            "text": capped_text,
            "full_text": SAMPLE_CONTRACT_TEXT,
            "filename": "cloudscale_vendor_agreement_sample.txt",
            "analysis": analysis,
            "segmentation": segmentation,
        }

        logger.info(
            f"Sample analysis complete in {time.perf_counter() - t0:.2f}s: "
            f"score={analysis.compliance_score}"
        )
        return analysis

    except Exception as e:
        logger.error(f"Sample analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ──────────────────────────────────────────────
# POST /api/analyze/clause — Multi-Agent Audit
# ──────────────────────────────────────────────

@router.post("/clause", response_model=MultiAgentAuditResponse)
async def audit_clause_with_multi_agent(payload: MultiAgentAuditRequest):
    """
    Run a 3-agent AI audit (Corporate Defender, Consumer Protection,
    Neutral Judge) on a specific contract clause. Alpha + Beta run in parallel.
    """
    logger.info(f"Clause audit: '{payload.clause_title}'")

    try:
        document_context = ""
        if payload.document_id:
            stored = ANALYZED_DOCUMENTS.get(payload.document_id, {})
            document_context = stored.get("text") or stored.get("full_text") or ""

        result = await run_clause_multi_agent_audit(
            clause_title=payload.clause_title,
            clause_content=payload.clause_content,
            document_context=document_context,
        )
        return result
    except Exception as e:
        logger.error(f"Multi-Agent audit failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Multi-Agent error: {str(e)}")
