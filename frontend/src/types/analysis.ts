export interface RiskAssessmentItem {
  id: string;
  clause_title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  clause_text: string;
  description: string;
  recommendation: string;
  alternative_clause?: string;
}

export interface ContractAnalysisResult {
  id: string;
  filename: string;
  compliance_score: number;
  risks_found: RiskAssessmentItem[];
  summary: string;
  verdict: string;
  policy_applied: string;
  document_text: string;
  engine_source?: 'gemini' | 'demo';
}
