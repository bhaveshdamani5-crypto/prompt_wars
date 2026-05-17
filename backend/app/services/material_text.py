"""Extract materially important contract text for analysis and the document viewer."""

from __future__ import annotations

import re
from typing import Dict, List

_IMPORTANCE_WEIGHTS: Dict[str, int] = {
    "indemnif": 12,
    "hold harmless": 12,
    "limitation of liability": 14,
    "liable": 8,
    "consequential": 9,
    "aggregate liability": 11,
    "termination": 10,
    "automatically renew": 11,
    "auto-renew": 11,
    "renewal": 8,
    "intellectual property": 10,
    "confidential": 8,
    "governing law": 7,
    "arbitration": 9,
    "jurisdiction": 8,
    "payment": 7,
    "fee": 6,
    "warranty": 7,
    "disclaimer": 7,
    "data processing": 10,
    "personal data": 10,
    "privacy": 9,
    "non-compete": 10,
    "non-solicit": 9,
    "assignment": 7,
    "force majeure": 6,
    "penalty": 9,
    "liquidated damages": 10,
    "exclusive remedy": 8,
    "audit": 7,
    "subcontract": 6,
    "municipal": 8,
    "tax": 6,
    "repairs": 7,
    "demolish": 8,
    "alteration": 7,
}


def _paragraphs(text: str) -> List[str]:
    parts = re.split(r"\n\s*\n", text)
    return [p.strip() for p in parts if len(p.strip()) > 40]


def _score_paragraph(paragraph: str) -> int:
    lower = paragraph.lower()
    score = min(len(paragraph) // 200, 5)
    for needle, weight in _IMPORTANCE_WEIGHTS.items():
        if needle in lower:
            score += weight
    if re.search(r"\d+\s*(%|days|months|years|₹|\$|eur)", lower):
        score += 3
    return score


def extract_material_text(full_text: str, max_chars: int = 28_000) -> str:
    """Keep high-importance paragraphs only; omit boilerplate where possible."""
    if not full_text or len(full_text) <= max_chars:
        return full_text.strip()

    ranked = sorted(
        ((_score_paragraph(p), p) for p in _paragraphs(full_text)),
        key=lambda x: x[0],
        reverse=True,
    )
    selected: List[str] = []
    total = 0
    for score, para in ranked:
        if score < 4:
            continue
        if total + len(para) > max_chars:
            break
        selected.append(para)
        total += len(para) + 2

    if not selected:
        return full_text[:max_chars]

    header = "[Material clauses — boilerplate omitted]\n\n"
    body = "\n\n".join(selected)
    combined = header + body
    return combined[:max_chars] if len(combined) > max_chars else combined
