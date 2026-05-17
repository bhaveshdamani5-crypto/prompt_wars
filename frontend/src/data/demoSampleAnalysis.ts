import type { ContractAnalysisResult, RiskAssessmentItem } from '../types/analysis';

/** Built-in demo contract (mirrors backend sample_contract.py) */
export const SAMPLE_CONTRACT_DOCUMENT_TEXT = `SOFTWARE SERVICES AGREEMENT

This Software Services Agreement (the "Agreement") is entered into as of the Effective Date, by and between CloudScale Solutions Inc., with its principal place of business at Grand Cayman, Cayman Islands ("Company"), and the customer entity executing this Agreement ("Customer").

1. SERVICES AND PROPRIETARY RIGHTS
Company provides a cloud-based scaling dashboard. Customer agrees that Company retains sole and exclusive ownership of all right, title, and interest in and to the Services, including all software, source code, workflows, algorithms, and documentation. Furthermore, Customer hereby assigns to Company all right, title, and interest in and to any suggestions, enhancement requests, custom developments, or new features developed or requested by Customer in connection with the Services (the "IP Assignment").

2. PAYMENT AND FEES
Customer shall pay all fees within fifteen (15) days of the invoice date. Late payments shall bear interest at the rate of 2.5% per month or the maximum rate permitted by law, whichever is higher. All fees paid are non-refundable.

3. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and shall remain in effect for an initial term of three (3) years (the "Initial Term"). This Agreement shall automatically renew for successive three-year periods ("Renewal Terms") unless Customer provides written notice of non-renewal at least one hundred and twenty (120) days prior to the expiration of the current term. Company may terminate this Agreement for convenience at any time upon three (3) days' written notice to Customer. Customer may not terminate this Agreement for convenience.

4. CONFIDENTIALITY
Customer shall protect all Confidential Information of Company using a high degree of care. Customer shall not disclose, copy, or use the Confidential Information of Company for any purpose outside the scope of this Agreement. This confidentiality obligation shall survive indefinitely following the termination of this Agreement. Company has no reciprocal confidentiality obligation regarding Customer's data under this section.

5. LIMITATION OF LIABILITY
IN NO EVENT SHALL COMPANY, ITS AFFILIATES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA, OR BUSINESS. IN ADDITION, COMPANY'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL BE STRICTLY LIMITED TO A MAXIMUM OF FIFTY US DOLLARS ($50.00). CUSTOMER AGREES THAT CUSTOMER'S LIABILITY TO COMPANY FOR BREACH OF THIS AGREEMENT IS UNLIMITED.

6. INDEMNIFICATION
Customer shall defend, indemnify, and hold harmless Company, its affiliates, directors, and officers from and against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with Customer's use of the Services or any breach of this Agreement by Customer. Company shall have no obligation to defend or indemnify Customer for any intellectual property infringement claims or other third-party actions.

7. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by, and construed in accordance with, the laws of the Cayman Islands, without regard to conflicts of law principles. Any dispute, controversy, or claim arising out of or relating to this Agreement shall be settled by binding arbitration in Geneva, Switzerland, in accordance with the International Arbitration Rules. The arbitration shall be conducted in English and the costs of arbitration shall be borne entirely by the Customer.`;

const DEMO_RISKS: RiskAssessmentItem[] = [
  {
    id: 'demo-risk-1',
    clause_title: 'Broad IP assignment to vendor',
    severity: 'HIGH',
    category: 'INTELLECTUAL PROPERTY',
    clause_text:
      'Customer hereby assigns to Company all right, title, and interest in and to any suggestions, enhancement requests, custom developments, or new features developed or requested by Customer in connection with the Services (the "IP Assignment").',
    description:
      'Customer assigns all enhancements and custom work product to the vendor without compensation or license-back.',
    recommendation:
      'Limit assignment to materials created solely for the vendor; retain a perpetual license for Customer-owned feedback and jointly developed IP.',
    alternative_clause:
      'Customer grants Company a non-exclusive, royalty-free license to use feedback solely to improve the Services; Customer retains ownership of pre-existing IP and jointly developed deliverables.',
  },
  {
    id: 'demo-risk-2',
    clause_title: 'Aggressive payment terms',
    severity: 'MEDIUM',
    category: 'PAYMENT & FEES',
    clause_text:
      'Late payments shall bear interest at the rate of 2.5% per month or the maximum rate permitted by law, whichever is higher. All fees paid are non-refundable.',
    description: 'Short payment window, high default interest, and no refunds increase cash-flow and dispute risk.',
    recommendation:
      'Negotiate net-30 payment, cap interest at a reasonable annual rate, and allow pro-rata refunds on early termination without cause.',
  },
  {
    id: 'demo-risk-3',
    clause_title: 'Lock-in auto-renewal & asymmetric termination',
    severity: 'HIGH',
    category: 'TERMINATION & RENEWAL',
    clause_text:
      'This Agreement shall automatically renew for successive three-year periods ("Renewal Terms") unless Customer provides written notice of non-renewal at least one hundred and twenty (120) days prior to the expiration of the current term. Company may terminate this Agreement for convenience at any time upon three (3) days\' written notice to Customer. Customer may not terminate this Agreement for convenience.',
    description:
      'Vendor can exit quickly while Customer faces long renewal cycles and no convenience termination.',
    recommendation:
      'Require mutual convenience termination on 30–60 days notice and annual renewal with 30-day opt-out.',
  },
  {
    id: 'demo-risk-4',
    clause_title: 'One-way confidentiality',
    severity: 'HIGH',
    category: 'CONFIDENTIALITY',
    clause_text:
      'Company has no reciprocal confidentiality obligation regarding Customer\'s data under this section.',
    description: 'Customer must protect vendor secrets indefinitely while vendor has no stated duty to protect Customer data.',
    recommendation:
      'Insert mutual confidentiality, data-security standards, and survival limited to 3–5 years for non-trade-secret information.',
  },
  {
    id: 'demo-risk-5',
    clause_title: 'Absurd liability cap vs unlimited Customer exposure',
    severity: 'HIGH',
    category: 'LIMITATION OF LIABILITY',
    clause_text:
      'COMPANY\'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL BE STRICTLY LIMITED TO A MAXIMUM OF FIFTY US DOLLARS ($50.00). CUSTOMER AGREES THAT CUSTOMER\'S LIABILITY TO COMPANY FOR BREACH OF THIS AGREEMENT IS UNLIMITED.',
    description:
      'Vendor liability is capped at $50 while Customer faces unlimited liability — a commercially indefensible imbalance.',
    recommendation:
      'Negotiate mutual caps tied to fees paid in the prior 12 months (e.g., 1–2× annual contract value) with carve-outs for fraud, gross negligence, and data breaches.',
  },
  {
    id: 'demo-risk-6',
    clause_title: 'One-sided indemnification',
    severity: 'HIGH',
    category: 'INDEMNIFICATION',
    clause_text:
      'Customer shall defend, indemnify, and hold harmless Company, its affiliates, directors, and officers from and against any and all claims',
    description: 'Customer indemnifies vendor broadly; vendor has no reciprocal IP infringement indemnity.',
    recommendation:
      'Require mutual indemnities for IP infringement and data breaches caused by the indemnifying party’s negligence.',
  },
  {
    id: 'demo-risk-7',
    clause_title: 'Offshore governing law & costly arbitration',
    severity: 'HIGH',
    category: 'GOVERNING LAW',
    clause_text:
      'This Agreement shall be governed by, and construed in accordance with, the laws of the Cayman Islands',
    description:
      'Cayman law and Geneva arbitration with Customer bearing all arbitration costs increase enforcement cost and home-court disadvantage.',
    recommendation:
      'Select Customer’s principal place of business law and courts, or neutral arbitration with shared cost allocation.',
  },
];

const POLICY_NAMES: Record<string, string> = {
  standard_vendor: 'Standard Vendor Agreement Policy',
  gdpr_privacy: 'GDPR & Data Privacy Guard',
  employment: 'Employment Agreement Policy',
};

export function buildDemoSampleAnalysis(policyId: string): ContractAnalysisResult {
  return {
    id: `demo-${Date.now()}`,
    filename: 'cloudscale_vendor_agreement_sample.txt',
    compliance_score: 24,
    risks_found: DEMO_RISKS,
    summary:
      'This CloudScale vendor agreement is heavily vendor-favored: broad IP assignment, one-way confidentiality, a $50 liability cap for the vendor with unlimited Customer liability, one-sided indemnity, and offshore dispute resolution. Immediate renegotiation is recommended before execution.',
    verdict: 'HIGH RISK — Do not sign without substantial redlines.',
    policy_applied: POLICY_NAMES[policyId] ?? POLICY_NAMES.standard_vendor,
    document_text: SAMPLE_CONTRACT_DOCUMENT_TEXT,
    engine_source: 'demo',
  };
}
