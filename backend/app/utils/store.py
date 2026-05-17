from typing import Dict, Any

# Simple global thread-safe-ish memory store for keeping track of analyzed contract documents and text
# Format: { document_id: { "text": str, "filename": str, "analysis": ContractAnalysisResult } }
ANALYZED_DOCUMENTS: Dict[str, Any] = {}
