import os
import json
import uuid
import re
from typing import List, Dict, Any
from ..models.schemas import (
    ContractAnalysisResult, RiskAssessmentItem, RiskSeverity, ClauseCategory, ChatResponse
)
from .gemini_client import generate_json, is_configured, GEMINI_MODEL

api_configured = is_configured()
if api_configured:
    print(f"[LexGuard AI] Gemini API configured for compliance analysis ({GEMINI_MODEL}).")

def select_model():
    """Returns the most appropriate active model name."""
    return GEMINI_MODEL


def _safe_enum(enum_cls, value: Any, default):
    try:
        return enum_cls(str(value).strip().upper())
    except Exception:
        try:
            return enum_cls(str(value).strip())
        except Exception:
            return default


def _normalize_risks(raw_items: List[Dict[str, Any]]) -> List[RiskAssessmentItem]:
    risks: List[RiskAssessmentItem] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        risks.append(RiskAssessmentItem(
            id=str(item.get("id") or uuid.uuid4()),
            clause_title=str(item.get("clause_title") or "Unclassified Clause"),
            severity=_safe_enum(RiskSeverity, item.get("severity", "MEDIUM"), RiskSeverity.MEDIUM),
            category=_safe_enum(ClauseCategory, item.get("category", "GENERAL/OTHER"), ClauseCategory.OTHER),
            clause_text=str(item.get("clause_text") or ""),
            description=str(item.get("description") or "Potential issue detected in this clause."),
            recommendation=str(item.get("recommendation") or "Review and negotiate clearer, more balanced wording."),
            alternative_clause=item.get("alternative_clause") or None,
        ))
    return risks

GEMINI_KEY_HINT = (
    "Set GEMINI_API_KEY in backend/.env. If quota is exhausted, add judge keys: "
    "GEMINI_API_KEY_ALPHA, GEMINI_API_KEY_BETA, GEMINI_API_KEY_GAMMA."
)


def analyze_contract_text(text: str, filename: str, policy_name: str, rules: List[str]) -> ContractAnalysisResult:
    """Analyze contract text using Google Gemini only."""
    if not api_configured:
        raise RuntimeError(f"Gemini API key is not configured. {GEMINI_KEY_HINT}")

    try:
            rules_str = "\n".join([f"- {r}" for r in rules])
            
            prompt = f"""
You are LexGuard AI, an expert Indian and international contract review system.
Analyze the contract file "{filename}" under the "{policy_name}" compliance policy.

Use the policy rules below when relevant, but do not limit the audit to those rules:
{rules_str}

Your output must be specific to the document text. Do not produce generic assurances.
For lease, rent, deed, property, employment, services, SaaS, NDA, privacy, payment,
or vendor contracts, identify the practical legal and commercial issues that matter.

Audit checklist:
- Lease/property: rent, deposits, municipal taxes, repairs, alteration/demolition rights,
  subletting, possession, renewal, termination, default, indemnity, approvals, stamp duty,
  registration, governing law, dispute forum, and handover obligations.
- Commercial/vendor: liability caps, indemnity, IP, confidentiality, data privacy,
  payment, warranty, termination, renewal, audit rights, governing law, and remedies.
- Consumer/employee: unilateral obligations, penalties, restraint, salary/benefits,
  non-compete, notice periods, deductions, and unfair remedies.

Rules for risk items:
1. Include only issues supported by the supplied text.
2. Extract the exact matching clause text for every issue. Keep quotes concise but enough to prove the issue.
3. If the contract is long, prefer the most legally important issues over minor drafting style.
4. For a normal non-trivial contract, return 4 to 8 useful items. Use INFO only for neutral observations, not as a substitute for review.
5. Never return a single "General Clause Check Completed" style result.
6. Recommendations must be actionable and tailored to the clause.

Each risk item must include:
1. `id`: a unique UUID-style string
2. `clause_title`: a short title of the legal clause
3. `severity`: one of "HIGH", "MEDIUM", "LOW", "INFO"
4. `category`: one of "INDEMNIFICATION", "LIMITATION OF LIABILITY", "TERMINATION & RENEWAL", "INTELLECTUAL PROPERTY", "WARRANTY & DISCLAIMER", "CONFIDENTIALITY", "PAYMENT & FEES", "REGULATORY COMPLIANCE", "GENERAL/OTHER"
5. `clause_text`: exact quote of the clause in the text
6. `description`: legal risk explanation
7. `recommendation`: clear step-by-step guidance on how to negotiate or rewrite it
8. `alternative_clause`: a fair, mutual, and professionally drafted alternative text

Return a full JSON object containing:
- `id`: unique analysis run ID
- `filename`: "{filename}"
- `compliance_score`: number between 0 (high risk) and 100 (perfect compliance)
- `risks_found`: list of risk items
- `summary`: comprehensive executive summary explaining overall risk posture and contract intent
- `verdict`: legal action verdict (e.g. "Needs Critical Review", "Approved with Amendments", "Safe to Execute")
- `policy_applied`: "{policy_name}"

Return ONLY valid JSON. Do not include markdown formatting like ```json ... ```.

CONTRACT TEXT:
{text}
"""
            data = generate_json(
                prompt,
                temperature=0.12,
                max_output_tokens=12000,
                retries=2,
            )
            risks = _normalize_risks(data.get("risks_found", []))
            if not risks:
                raise RuntimeError("Gemini returned no risk items for a non-empty contract.")
                
            return ContractAnalysisResult(
                id=data.get("id", str(uuid.uuid4())),
                filename=filename,
                compliance_score=int(data.get("compliance_score", 70)),
                risks_found=risks,
                summary=data.get("summary", "Analysis completed successfully."),
                verdict=data.get("verdict", "Needs Revision"),
                policy_applied=policy_name,
                document_text=text,
                engine_source="gemini",
            )
    except Exception as e:
        raise RuntimeError(
            f"Gemini contract analysis failed: {e}. {GEMINI_KEY_HINT}"
        ) from e


def chat_about_contract(text: str, chat_history: List[Dict[str, Any]], user_message: str) -> ChatResponse:
    """Contract Q&A via Gemini only."""
    if not api_configured:
        raise RuntimeError(f"Gemini API key is not configured. {GEMINI_KEY_HINT}")

    history_str = ""
    for chat in chat_history[-6:]:
        role = "User" if chat.get("sender") == "user" else "LexGuard AI"
        history_str += f"{role}: {chat.get('text')}\n"

    prompt = f"""
You are LexGuard AI, an elite legal assistant chatbot.
Answer based only on the contract text below.

CONTRACT TEXT:
{text}

CONVERSATION HISTORY:
{history_str}

NEW USER QUESTION:
{user_message}

Return JSON with keys: reply (string), references (array of strings).
Return ONLY valid JSON.
"""
    try:
        data = generate_json(prompt, temperature=0.15, max_output_tokens=4096, retries=2)
        return ChatResponse(
            reply=data.get("reply", "I could not find an answer in this contract."),
            references=data.get("references", []),
        )
    except Exception as e:
        raise RuntimeError(f"Gemini chat failed: {e}. {GEMINI_KEY_HINT}") from e
