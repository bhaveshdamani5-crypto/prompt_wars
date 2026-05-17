import { BACKEND_URL } from '../config';
import { buildDemoSampleAnalysis } from '../data/demoSampleAnalysis';
import type { ContractAnalysisResult } from '../types/analysis';

export type SampleLoadSource = 'api' | 'demo';

export interface SampleLoadResult {
  analysis: ContractAnalysisResult;
  source: SampleLoadSource;
  message?: string;
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.detail)) return body.detail.map((d: { msg?: string }) => d.msg).join('; ');
  } catch {
    /* ignore */
  }
  return `Server returned ${res.status}`;
}

/** Try live Gemini analysis; fall back to bundled demo when API is unreachable or errors. */
export async function loadSampleContract(policyId: string): Promise<SampleLoadResult> {
  const formData = new FormData();
  formData.append('policy_id', policyId);

  try {
    const res = await fetch(`${BACKEND_URL}/api/analyze/sample`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const analysis = (await res.json()) as ContractAnalysisResult;
      return { analysis, source: 'api' };
    }

    const apiError = await parseApiError(res);
    console.warn('[LexGuard] Sample API failed, using offline demo:', apiError);
    return {
      analysis: buildDemoSampleAnalysis(policyId),
      source: 'demo',
      message: apiError,
    };
  } catch (err) {
    const isLocalhost =
      BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
    console.warn('[LexGuard] Sample API unreachable, using offline demo:', err);
    return {
      analysis: buildDemoSampleAnalysis(policyId),
      source: 'demo',
      message: isLocalhost
        ? 'Backend not reachable. Start the API with run_project.bat or python -m app.main in backend/.'
        : `API unreachable at ${BACKEND_URL}. Set VITE_API_URL in Vercel to your deployed backend.`,
    };
  }
}
