# LEXGUARD AI — Production Multi-Agent Architecture

**An AI Legal Shield for Every Human**

This document defines the production-grade agent society, pipelines, and accessibility systems implemented and planned in the LexGuard AI codebase.

---

## 1. Agent Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │     ORCHESTRATOR (orchestrator.py)   │
                    │  Pipelines · Memory · Escalation     │
                    └─────────────────┬───────────────────┘
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     ▼                                ▼                                ▼
 INGEST/SEGMENT                  CLAUSE ANALYZE                    DEBATE LAYER
 (local + optional AI)           (risk, financial, ethical…)      Alpha ∥ Beta → Gamma
     │                                │                                │
     └────────────────────────────────┴────────────────────────────────┘
                                      ▼
                         SIMPLIFY → TRANSLATE → VOICE → VERDICT
                                      ▼
                              NEGOTIATE (session memory)
```

**Why many agents?** Legal trust requires adversarial reasoning (corporate vs consumer), specialized detectors (ambiguity, contradiction), and accessibility layers—not one monolithic summarizer.

---

## 2. Agent Registry (19+ roles)

| ID | Agent | Phase | Why it exists |
|----|-------|-------|---------------|
| ingest_01 | Document Ingestion | INGEST | Clean OCR/PDF input |
| segment_02 | Clause Relationship Analyzer | SEGMENT | Parent-child clause graph |
| alpha | Corporate Defense | DEBATE | Legitimate business justification |
| beta | Consumer Rights | DEBATE | Exploit & unfairness detection |
| gamma | Verdict Synthesizer | SYNTHESIZE | Fairness score + revised clause |
| ambiguity_04 | Legal Ambiguity Detector | CLAUSE_ANALYZE | Hidden vague terms |
| contradiction_05 | Contradiction Detector | CLAUSE_ANALYZE | Cross-clause conflicts |
| risk_06 | Real-world Risk Mapper | CLAUSE_ANALYZE | Concrete harm scenarios |
| financial_07 | Financial Impact | CLAUSE_ANALYZE | Caps, penalties, ₹ exposure |
| emotional_08 | Emotional Impact | CLAUSE_ANALYZE | Power imbalance UX |
| simplify_09 | Simplification Expert | SIMPLIFY | 3 literacy tiers |
| literacy_10 | Literacy Adaptation | SIMPLIFY | Profile-based vocabulary |
| translate_11 | Regional Translator | SIMPLIFY | 7 Indian languages |
| voice_12 | Voice Accessibility | ACCESSIBILITY | TTS scripts + pauses |
| negotiate_13 | Negotiation Strategist | NEGOTIATE | Contextual tradeoffs |
| ethical_14 | Ethical Compliance | CLAUSE_ANALYZE | DPDP / consumer law |
| hallucination_15 | Hallucination Checker | SYNTHESIZE | Quote verification |
| confidence_16 | Confidence Validator | SYNTHESIZE | Human-review triggers |
| trust_17 | Trust Scoring | VERDICT | Single trust index |
| senior_18 | Child/Senior Accessibility | ACCESSIBILITY | Ultra-simple + slow voice |
| precedent_19 | Precedent/Pattern | CLAUSE_ANALYZE | Similar clause memory |

Implementation: `backend/app/agents/orchestrator.py`, `multi_agent_engine.py`.

---

## 3. Data Flow Pipeline

### Fast Scan (default — **implemented**)

1. **Upload** → `process_document_upload()` — pdfplumber/TXT local; images → one Vision call.
2. **Local segment** → `segment_clauses_fast()` — regex, **0 Gemini calls**.
3. **Compliance** → `analyze_contract_text()` — **1 Gemini call** (risks, score, verdict).
4. **Store** → `ANALYZED_DOCUMENTS` for chat/negotiation.

**Before:** 2 parallel Gemini calls (~20–40s). **After:** 1 call (~8–15s).

### Deep Clause Audit (on demand)

1. User selects clause → `POST /api/analyze/clause`
2. Alpha ∥ Beta (parallel) → Gamma synthesis
3. Optional: `POST /api/intelligence/simplify` + `/voice-script`

---

## 4. Memory Architecture

| Scope | Keys | Used by |
|-------|------|---------|
| DOCUMENT | raw_text, segmentation, analysis | Chat, re-scan |
| CLAUSE | debate outputs, simplification | Clause panel |
| SESSION | negotiation turns, user priorities | Negotiation API |
| USER_PROFILE | literacy, language, age_group | Future adaptive UI |

`OrchestratorContext` in `orchestrator.py` provides `remember()` / `recall()`.

---

## 5. Orchestration Design

- **Fast pipeline:** `FAST_SCAN_PIPELINE` — ingest → segment → analyze → verdict.
- **Deep pipeline:** `DEEP_CLAUSE_PIPELINE` — debate → synthesize → simplify → accessibility.
- **Escalation:** `should_escalate(fairness_score, confidence)` → human review when score &lt; 25 or confidence &lt; 0.55.
- **Parallel groups:** Debate agents share `parallel_group="debate"`.

---

## 6. n8n Workflow Design (recommended)

```
Webhook (upload) → FastAPI /api/analyze
                 → Branch: score < 40 → Slack alert
                 → Branch: per HIGH risk → /api/analyze/clause
                 → Merge → Airtable/Notion audit log
Human feedback → Webhook → /api/intelligence/negotiate/turn
```

n8n handles retries, scheduling, CRM—not core reasoning (stays in FastAPI + Gemini).

---

## 7. FastAPI Responsibilities

| Route | Role |
|-------|------|
| `/api/analyze` | Fast scan upload |
| `/api/analyze/clause` | Multi-agent debate |
| `/api/intelligence/simplify` | 3-tier + translate |
| `/api/intelligence/voice-script` | TTS-ready chunks |
| `/api/intelligence/negotiate/*` | Session negotiation |
| `/api/chat` | Document Q&A |

---

## 8. Gemini API Strategy

- **Model:** `gemini-2.5-flash` — speed + JSON mode.
- **Fast scan:** 1 compliance call, `max_output_tokens: 8192`, `temperature: 0.2`.
- **Debate:** JSON mode, `temperature: 0.15`, retries with backoff.
- **Simplify/translate:** Separate calls on demand (not during scan).
- **Cap input:** `MAX_ANALYSIS_CHARS = 10_000`.

---

## 9–12. Scoring & Simplification

- **Risk severity:** HIGH / MEDIUM / LOW / INFO (compliance agent).
- **Fairness score:** 0–100 from Gamma judge (clause debate).
- **Trust score:** Weighted blend (planned): compliance + fairness + confidence.
- **Simplification:** Professional / Simple / Illiterate-friendly (`legal_simplifier.py`).

---

## 13. Accessibility & Voice

- **Backend:** `voice_accessibility.py` — pause injection, chunking ≤180 chars, long-doc queues.
- **Frontend:** `voiceEngine.ts` — Web Speech API, 7 languages, literacy-tier speech rate.
- **Flow:** Simplify → voice-script → chunked TTS with Play/Pause/Stop.

---

## 14–15. Multilingual Strategy

**Languages:** English, Hindi, Kannada, Tamil, Telugu, Bengali, Malayalam.

| Concern | Approach |
|---------|----------|
| Translation quality | Gemini legal translator prompt; meaning-preservation rules |
| Legal meaning | Same JSON schema across languages; no added/removed obligations |
| Voice | BCP-47 tags (`hi-IN`, `kn-IN`, …); slower rate for conversational tier |

---

## 16–19. Reliability

- **Errors:** HTTP 4xx validation, 5xx logged; local fallbacks for segmentation & analysis.
- **Hallucination:** Require `clause_text` quotes; hallucination agent verifies substring match (roadmap).
- **Confidence:** Per-agent JSON + aggregate; low → escalate.
- **Human feedback:** Negotiation turns update verdict; future: thumbs on clauses.

---

## 20–25. Scale, Testing, Demo

- **Scale:** Stateless API + Redis session store; async clause audits; queue for batch PDFs.
- **Testing:** Sample contract `/api/analyze/sample`; unit tests for `segment_clauses_fast`, voice chunking.
- **Edge cases:** Scanned PDFs, empty files, 100+ page truncation notice, offline mock engine.
- **Demo flow:** Upload → fast scan → risk matrix → debate one clause → simplify + Listen → negotiate.
- **Judge-winning:** Adversarial 3-agent debate, 7-language voice, literacy tiers, negotiation memory, sub-15s scan.

---

## User Type Adaptation Matrix

| Profile | Vocabulary | Output |
|---------|------------|--------|
| Professional | Legal terms OK | Professional tier + faster TTS |
| Average literate | Plain English | Simple tier |
| Semi-literate | Short sentences | Simple + voice default |
| Illiterate | Analogies, no jargon | Conversational tier + voice |
| Elderly | Slower TTS, larger chunks | illiterate_friendly + rate 0.82 |
| Rural / non-English | Regional language | translate_first + native TTS |

---

*Last updated: implementation pass — fast scan, voice API, orchestrator registry.*
