from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..models.schemas import ChatResponse
from ..utils.store import ANALYZED_DOCUMENTS
from ..services.gemini_service import chat_about_contract

router = APIRouter(prefix="/chat", tags=["Contract Intelligence Chat"])

class ChatMessage(BaseModel):
    sender: str  # "user" or "ai"
    text: str

class ChatRequestWithHistory(BaseModel):
    document_id: str
    message: str
    history: List[ChatMessage] = []

@router.post("", response_model=ChatResponse)
async def chat_document(request: ChatRequestWithHistory):
    """
    Chat with the AI Legal Assistant about a specific contract.
    Pass context and chat history to enable highly precise multi-turn conversations.
    """
    doc_id = request.document_id
    if doc_id not in ANALYZED_DOCUMENTS:
        raise HTTPException(
            status_code=404, 
            detail="Contract analysis session not found. Please upload the document first."
        )
        
    doc_data = ANALYZED_DOCUMENTS[doc_id]
    doc_text = doc_data["text"]
    
    # Format history for internal service consumption
    formatted_history = []
    for msg in request.history:
        formatted_history.append({
            "sender": msg.sender,
            "text": msg.text
        })
        
    try:
        # Request reply from Gemini or Mock intelligence fallback
        chat_reply = chat_about_contract(
            text=doc_text,
            chat_history=formatted_history,
            user_message=request.message
        )
        return chat_reply
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing contract chat request: {str(e)}"
        )
