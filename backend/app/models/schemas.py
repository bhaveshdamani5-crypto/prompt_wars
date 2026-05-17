"""
LexGuard AI — Pydantic Data Models & Schemas
=============================================
Type-safe request/response validation models for the entire platform.
Used by routes, services, and multi-agent layers.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


# ──────────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────────

class RiskSeverity(str, Enum):
    """Risk severity levels for legal clause assessment."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ClauseCategory(str, Enum):
    """Legal clause classification categories."""
    INDEMNIFICATION = "INDEMNIFICATION"
    LIABILITY = "LIMITATION OF LIABILITY"
    TERMINATION = "TERMINATION & RENEWAL"
    INTELLECTUAL_PROPERTY = "INTELLECTUAL PROPERTY"
    WARRANTY = "WARRANTY & DISCLAIMER"
    CONFIDENTIALITY = "CONFIDENTIALITY"
    PAYMENT = "PAYMENT & FEES"
    COMPLIANCE = "REGULATORY COMPLIANCE"
    GOVERNING_LAW = "GOVERNING LAW"
    DATA_PRIVACY = "DATA PRIVACY"
    FORCE_MAJEURE = "FORCE MAJEURE"
    OTHER = "GENERAL/OTHER"


class ClauseType(str, Enum):
    """Structural classification of how a clause appears in the document."""
    NUMBERED_SECTION = "NUMBERED_SECTION"
    SUBSECTION = "SUBSECTION"
    BULLET_POINT = "BULLET_POINT"
    HEADING = "HEADING"
    DEFINITION = "DEFINITION"
    PARAGRAPH = "PARAGRAPH"
    SCHEDULE = "SCHEDULE"
    RECITAL = "RECITAL"


# ──────────────────────────────────────────────
# Clause Segmentation Models
# ──────────────────────────────────────────────

class SegmentedClause(BaseModel):
    """A single segmented clause extracted from a legal contract."""
    clause_id: str = Field(..., description="Unique identifier for this clause (e.g., 'clause_001')")
    title: str = Field(..., description="Short descriptive title of the clause")
    content: str = Field(..., description="Full text content of the clause")
    simplified_explanation: str = Field(..., description="Plain-English, point-wise simplified explanation of what this clause means")
    clause_type: ClauseType = Field(..., description="Structural type of the clause")
    risk_category: ClauseCategory = Field(ClauseCategory.OTHER, description="Legal risk category this clause falls under")
    parent_clause_id: Optional[str] = Field(None, description="ID of the parent clause if this is a subsection")


class ClauseSegmentationResult(BaseModel):
    """Complete result of the clause segmentation engine."""
    document_id: str = Field(..., description="Unique document analysis ID")
    filename: str = Field(..., description="Original filename of the uploaded document")
    total_clauses: int = Field(..., description="Total number of clauses extracted")
    clauses: List[SegmentedClause] = Field(default=[], description="List of all segmented clauses")
    document_summary: str = Field(..., description="High-level summary of the entire document")


# ──────────────────────────────────────────────
# Document Upload & Extraction Models
# ──────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    """Response returned after a document is uploaded and text is extracted."""
    document_id: str = Field(..., description="Unique document identifier for all downstream operations")
    filename: str = Field(..., description="Original uploaded filename")
    file_size_kb: float = Field(..., description="File size in kilobytes")
    file_type: str = Field(..., description="Detected MIME/extension type")
    page_count: Optional[int] = Field(None, description="Number of pages (for PDFs)")
    extracted_text: str = Field(..., description="Simplified, cleaned extracted text from the document")
    clause_segmentation: ClauseSegmentationResult = Field(..., description="Structured clause segmentation of the document")


# ──────────────────────────────────────────────
# Risk Assessment & Compliance Models
# ──────────────────────────────────────────────

class RiskAssessmentItem(BaseModel):
    """A single identified risk within a contract clause."""
    id: str = Field(..., description="Unique identifier for the risk assessment item")
    clause_title: str = Field(..., description="Short title of the clause analyzed")
    severity: RiskSeverity = Field(..., description="Severity of the legal risk")
    category: ClauseCategory = Field(..., description="Category of the clause")
    clause_text: str = Field(..., description="Exact or closely matching clause text extracted from the document")
    description: str = Field(..., description="Explanation of why this clause presents a risk")
    recommendation: str = Field(..., description="Actionable recommendation on how to handle or renegotiate this risk")
    alternative_clause: Optional[str] = Field(None, description="Suggested replacement wording for the clause")


class ContractAnalysisResult(BaseModel):
    """Complete compliance analysis result for a legal contract."""
    id: str = Field(..., description="Unique identifier for this analysis run")
    filename: str = Field(..., description="Name of the analyzed contract file")
    compliance_score: int = Field(..., ge=0, le=100, description="Overall compliance score from 0 (very risky) to 100 (fully compliant)")
    risks_found: List[RiskAssessmentItem] = Field(default=[], description="List of identified risks in the contract")
    summary: str = Field(..., description="Detailed executive summary of the document and its risk posture")
    verdict: str = Field(..., description="Final assessment verdict")
    policy_applied: str = Field(..., description="The compliance policy guideline used for the audit")
    document_text: Optional[str] = Field(None, description="Material clauses text shown in the document viewer")
    clause_segmentation: Optional[ClauseSegmentationResult] = Field(None, description="Structured clause breakdown")
    engine_source: Optional[str] = Field(None, description="gemini — powered by Google Gemini")


# ──────────────────────────────────────────────
# Policy Engine Models
# ──────────────────────────────────────────────

class PolicyRule(BaseModel):
    """A single rule within a compliance policy."""
    id: str
    rule_title: str
    rule_description: str
    category: ClauseCategory
    severity_level: RiskSeverity


class CompliancePolicy(BaseModel):
    """A compliance policy profile containing audit rules."""
    id: str = Field(..., description="Unique policy identifier")
    name: str = Field(..., description="Name of the compliance policy")
    description: str = Field(..., description="Description of the policy domain")
    rules: List[PolicyRule] = Field(default=[], description="Rules enforced by this policy")


# ──────────────────────────────────────────────
# Chat Agent Models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat request from the frontend."""
    document_id: str
    message: str


class ChatResponse(BaseModel):
    """AI chat response with evidence references."""
    reply: str
    references: List[str] = Field(default=[], description="Exact clause quotes cited as evidence")


# ──────────────────────────────────────────────
# Multi-Agent Legal Reasoning Schemas
# ──────────────────────────────────────────────

class CorporateDefenderAgentSchema(BaseModel):
    intent: str
    defense_points: List[str]


class ConsumerProtectionAgentSchema(BaseModel):
    unfairness_reasons: str
    flaws: List[str]


class NeutralJudgeAgentSchema(BaseModel):
    balanced_verdict: str
    fairness_score: int
    risk_level: str
    recommendation: str
    revised_clause: str
    key_changes: List[str] = []


class MultiAgentAuditRequest(BaseModel):
    """Request payload for multi-agent clause audit."""
    clause_title: str
    clause_content: str
    document_id: Optional[str] = Field(None, description="Optional analysis id for document context")


class MultiAgentAuditResponse(BaseModel):
    """Response returned from the 3-agent legal reasoning engine."""
    clause_title: str
    clause_content: str
    corporate_defender: CorporateDefenderAgentSchema
    consumer_protection: ConsumerProtectionAgentSchema
    neutral_judge: NeutralJudgeAgentSchema
    engine_source: Optional[str] = Field(None, description="gemini")

