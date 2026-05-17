from typing import List, Dict
from ..models.schemas import CompliancePolicy, PolicyRule, ClauseCategory, RiskSeverity

# In-memory dictionary of preset compliance policies
PRESET_POLICIES: Dict[str, CompliancePolicy] = {
    "standard_vendor": CompliancePolicy(
        id="standard_vendor",
        name="Standard Vendor Agreement Policy",
        description="Checks if a standard commercial vendor contract matches typical business protections, focusing on liability, IP protection, and payment terms.",
        rules=[
            PolicyRule(
                id="sv_01",
                rule_title="Mutual Indemnification Required",
                rule_description="The indemnification clause must protect both parties equally. Avoid one-sided obligations that only benefit the vendor.",
                category=ClauseCategory.INDEMNIFICATION,
                severity_level=RiskSeverity.HIGH
            ),
            PolicyRule(
                id="sv_02",
                rule_title="Reasonable Limitation of Liability",
                rule_description="The contract must have an aggregate liability cap (e.g., 12 months fees). Unlimited liability or no caps are high risks.",
                category=ClauseCategory.LIABILITY,
                severity_level=RiskSeverity.HIGH
            ),
            PolicyRule(
                id="sv_03",
                rule_title="Pre-Existing IP Carve-Outs",
                rule_description="Both parties must retain their pre-existing Intellectual Property rights, and custom works must have clear license terms.",
                category=ClauseCategory.INTELLECTUAL_PROPERTY,
                severity_level=RiskSeverity.MEDIUM
            ),
            PolicyRule(
                id="sv_04",
                rule_title="Notice of Auto-Renewal",
                rule_description="Auto-renewals must require at least 30-day notice prior to renewal, rather than long 90-day lock-ins.",
                category=ClauseCategory.TERMINATION,
                severity_level=RiskSeverity.MEDIUM
            )
        ]
    ),
    "gdpr_privacy": CompliancePolicy(
        id="gdpr_privacy",
        name="GDPR & Data Privacy Guard",
        description="Audits data privacy safeguards, checking for appropriate data processor responsibilities, breach reporting, and security clauses.",
        rules=[
            PolicyRule(
                id="dp_01",
                rule_title="Breach Notification Protocol",
                rule_description="Processor must notify of any data breach within 48 to 72 hours, aligned with GDPR Article 33.",
                category=ClauseCategory.COMPLIANCE,
                severity_level=RiskSeverity.HIGH
            ),
            PolicyRule(
                id="dp_02",
                rule_title="Standard Contractual Clauses (SCCs)",
                rule_description="If cross-border data transfer occurs, valid SCCs or adequacy mechanisms must be specified.",
                category=ClauseCategory.COMPLIANCE,
                severity_level=RiskSeverity.HIGH
            ),
            PolicyRule(
                id="dp_03",
                rule_title="Confidentiality of Personnel",
                rule_description="Data processor must ensure that personnel authorized to process personal data have committed themselves to confidentiality.",
                category=ClauseCategory.CONFIDENTIALITY,
                severity_level=RiskSeverity.MEDIUM
            )
        ]
    ),
    "mutual_nda": CompliancePolicy(
        id="mutual_nda",
        name="Mutual NDA Standard Policy",
        description="Verifies that a Non-Disclosure Agreement provides equal, mutual protection for both disclosing and receiving parties.",
        rules=[
            PolicyRule(
                id="nda_01",
                rule_title="Strict Mutuality of Obligations",
                rule_description="Both parties must be bound by identical confidentiality and non-disclosure obligations. Avoid unilateral NDAs.",
                category=ClauseCategory.CONFIDENTIALITY,
                severity_level=RiskSeverity.HIGH
            ),
            PolicyRule(
                id="nda_02",
                rule_title="Standard Exclusions from Confidential Info",
                rule_description="Standard carve-outs must exist: public knowledge, already in possession, independently developed, or legally compelled.",
                category=ClauseCategory.CONFIDENTIALITY,
                severity_level=RiskSeverity.MEDIUM
            ),
            PolicyRule(
                id="nda_03",
                rule_title="Reasonable Protection Duration",
                rule_description="The confidentiality obligation should persist for a reasonable term, typically 2 to 5 years post-termination.",
                category=ClauseCategory.TERMINATION,
                severity_level=RiskSeverity.LOW
            )
        ]
    )
}

def get_policies() -> List[CompliancePolicy]:
    """Retrieve all available compliance policies."""
    return list(PRESET_POLICIES.values())

def get_policy_by_id(policy_id: str) -> CompliancePolicy:
    """Retrieve a specific policy, defaulting to the general standard vendor policy."""
    return PRESET_POLICIES.get(policy_id, PRESET_POLICIES["standard_vendor"])
