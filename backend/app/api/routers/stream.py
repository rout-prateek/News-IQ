import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.agents.orchestrator import orchestrator

logger = logging.getLogger(__name__)
router = APIRouter()

class ArticleContext(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    source_name: Optional[str] = None

class StreamRequest(BaseModel):
    article: ArticleContext
    related_articles: List[ArticleContext] = []

@router.post("/stream")
async def stream_intelligence(request: StreamRequest):
    """
    Streams structured JSON chunks from the AI agents as they complete.
    """
    article_dict = request.article.dict()
    related_dicts = [a.dict() for a in request.related_articles]
    
    return StreamingResponse(
        orchestrator.stream_intelligence(article_dict, related_dicts),
        media_type="text/event-stream"
    )
