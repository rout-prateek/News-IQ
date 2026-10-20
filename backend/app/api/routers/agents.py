from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.agents.graph import run_news_pipeline
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    context_article: Optional[Dict[str, Any]] = None
    
class ChatResponse(BaseModel):
    response: str
    intent: Optional[str]
    articles_referenced: int
    raw_articles: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Endpoint to interact with the NEWSIQ Multi-Agent Pipeline.
    Takes a natural language query, runs it through the LangGraph agents,
    and returns a synthesized response and source articles.
    """
    try:
        # Run the full LangGraph pipeline
        state = await run_news_pipeline(request.query, context_article=request.context_article)
        
        if state.get("error"):
            raise HTTPException(status_code=500, detail=state["error"])
            
        verified = state.get("verified_articles", [])
        
        return ChatResponse(
            response=state.get("final_response", "Sorry, I could not generate a response."),
            intent=state.get("intent"),
            articles_referenced=len(verified),
            raw_articles=state.get("raw_articles", []),
            metadata=state.get("intelligence_metadata")
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
