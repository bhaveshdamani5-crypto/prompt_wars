"""
LexGuard AI — Multi-Agent Orchestration Registry (v3)
=====================================================
Production-oriented agent society with phased pipelines, memory scopes,
escalation, and debate hooks. Clause-level deep audit uses specialized agents.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, List, Optional

logger = logging.getLogger("LexGuard-AI.Orchestrator")


class PipelinePhase(str, Enum):
    INGEST = "ingest"
    SEGMENT = "segment"
    CLAUSE_ANALYZE = "clause_analyze"
    DEBATE = "debate"
    SYNTHESIZE = "synthesize"
    SIMPLIFY = "simplify"
    ACCESSIBILITY = "accessibility"
    VERDICT = "verdict"
    NEGOTIATE = "negotiate"


class MemoryScope(str, Enum):
    DOCUMENT = "document"
    CLAUSE = "clause"
    SESSION = "session"
    USER_PROFILE = "user_profile"


@dataclass
class AgentSpec:
    agent_id: str
    name: str
    responsibility: str
    phase: PipelinePhase
    why_exists: str
    parallel_group: Optional[str] = None
    escalates_to: Optional[str] = None


# ── Agent society registry (hackathon / production reference) ──

AGENT_REGISTRY: List[AgentSpec] = [
    AgentSpec("ingest_01", "Document Ingestion Agent", "Validate, OCR/extract, normalize text", PipelinePhase.INGEST, "Clean input prevents downstream hallucination."),
    AgentSpec("segment_02", "Clause Relationship Analyzer", "Split contract; parent-child clause graph", PipelinePhase.SEGMENT, "Clause-level reasoning requires structure."),
    AgentSpec("alpha", "Corporate Defense Agent", "Business justification for each clause", PipelinePhase.DEBATE, "Adversarial balance — every contract has two sides.", parallel_group="debate"),
    AgentSpec("beta", "Consumer Rights Agent", "Exploit detection, unfair terms", PipelinePhase.DEBATE, "Protects ordinary humans from one-sided terms.", parallel_group="debate"),
    AgentSpec("gamma", "Verdict Synthesizer", "Fairness score, recommendation, revised clause", PipelinePhase.SYNTHESIZE, "Explainable final judgment from debate evidence."),
    AgentSpec("ambiguity_04", "Legal Ambiguity Detector", "Vague language, undefined terms", PipelinePhase.CLAUSE_ANALYZE, "Ambiguity is where companies hide risk."),
    AgentSpec("contradiction_05", "Contradiction Detector", "Cross-clause conflicts", PipelinePhase.CLAUSE_ANALYZE, "Contradictions invalidate user trust in summaries."),
    AgentSpec("risk_06", "Real-world Risk Mapper", "Concrete harm scenarios", PipelinePhase.CLAUSE_ANALYZE, "Users need consequences, not legal labels."),
    AgentSpec("financial_07", "Financial Impact Agent", "Money exposure, caps, penalties", PipelinePhase.CLAUSE_ANALYZE, "Most users care about rupees lost or gained."),
    AgentSpec("emotional_08", "Emotional Impact Analyzer", "Stress, power imbalance, urgency", PipelinePhase.CLAUSE_ANALYZE, "Emotional UX drives adoption for vulnerable users."),
    AgentSpec("simplify_09", "Simplification Expert", "3-tier literacy explanations", PipelinePhase.SIMPLIFY, "Literate and illiterate users need different language."),
    AgentSpec("literacy_10", "Literacy Adaptation Agent", "Vocabulary, tone, examples by profile", PipelinePhase.SIMPLIFY, "Same law, different cognitive load."),
    AgentSpec("translate_11", "Regional Language Translator", "7-language legal-preserving translation", PipelinePhase.SIMPLIFY, "India-scale access requires native languages."),
    AgentSpec("voice_12", "Voice Accessibility Agent", "TTS scripts, pauses, chunking", PipelinePhase.ACCESSIBILITY, "Illiterate and elderly users listen more than read."),
    AgentSpec("negotiate_13", "Contract Negotiation Strategist", "Tradeoffs, leverage, revised asks", PipelinePhase.NEGOTIATE, "Users defend clauses with real-life context."),
    AgentSpec("ethical_14", "Ethical Compliance Agent", "DPDP, consumer protection alignment", PipelinePhase.CLAUSE_ANALYZE, "Regulatory trust for judges and enterprises."),
    AgentSpec("hallucination_15", "Hallucination Checker", "Quote verification vs source text", PipelinePhase.SYNTHESIZE, "Legal AI must cite, not invent clauses."),
    AgentSpec("confidence_16", "Confidence Validator", "Score certainty per claim", PipelinePhase.SYNTHESIZE, "Low-confidence claims trigger human review."),
    AgentSpec("trust_17", "Trust Scoring Agent", "Aggregate trust index for UI", PipelinePhase.VERDICT, "Single trust number for demo impact."),
    AgentSpec("senior_18", "Child/Senior Accessibility Agent", "Ultra-simple mode, slower voice", PipelinePhase.ACCESSIBILITY, "Vulnerable populations are core mission."),
    AgentSpec("precedent_19", "Precedent/Pattern Agent", "Similar clause patterns", PipelinePhase.CLAUSE_ANALYZE, "Pattern memory improves consistency."),
]


@dataclass
class OrchestratorContext:
    document_id: str
    filename: str
    raw_text: str
    user_profile: Dict[str, Any] = field(default_factory=dict)
    memory: Dict[MemoryScope, Dict[str, Any]] = field(default_factory=dict)

    def remember(self, scope: MemoryScope, key: str, value: Any) -> None:
        self.memory.setdefault(scope, {})[key] = value

    def recall(self, scope: MemoryScope, key: str, default: Any = None) -> Any:
        return self.memory.get(scope, {}).get(key, default)


@dataclass
class PipelineResult:
    phase: PipelinePhase
    outputs: Dict[str, Any]
    confidence: float = 0.85
    escalated: bool = False


# Fast scan pipeline: ingest → local segment → single compliance LLM → store
FAST_SCAN_PIPELINE: List[PipelinePhase] = [
    PipelinePhase.INGEST,
    PipelinePhase.SEGMENT,
    PipelinePhase.CLAUSE_ANALYZE,
    PipelinePhase.VERDICT,
]

# Deep clause audit: debate + synthesize + simplify + voice
DEEP_CLAUSE_PIPELINE: List[PipelinePhase] = [
    PipelinePhase.DEBATE,
    PipelinePhase.SYNTHESIZE,
    PipelinePhase.SIMPLIFY,
    PipelinePhase.ACCESSIBILITY,
]


def get_agents_for_phase(phase: PipelinePhase) -> List[AgentSpec]:
    return [a for a in AGENT_REGISTRY if a.phase == phase]


def should_escalate(fairness_score: int, confidence: float) -> bool:
    """Escalate to human review when score extreme or confidence low."""
    return fairness_score < 25 or fairness_score > 95 or confidence < 0.55


async def run_debate_phase(
    clause_title: str,
    clause_content: str,
    runner: Callable[[str, str], Awaitable[Dict[str, Any]]],
) -> PipelineResult:
    """Execute debate phase via injected multi-agent runner."""
    output = await runner(clause_title, clause_content)
    score = output.get("neutral_judge", {}).get("fairness_score", 50)
    return PipelineResult(
        phase=PipelinePhase.DEBATE,
        outputs=output,
        confidence=0.8,
        escalated=should_escalate(score, 0.8),
    )
