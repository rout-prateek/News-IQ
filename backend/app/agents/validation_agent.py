import logging
import asyncio
from typing import Dict, Any, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.core.config import settings
from .base import BaseAgentNode, AgentState

logger = logging.getLogger(__name__)

class ValidationResult(BaseModel):
    credibility_score: float = Field(description="A score from 0.0 to 1.0 representing the credibility and reliability of the article.")
    bias_label: str = Field(description="Label for bias: 'Left', 'Center-Left', 'Center', 'Center-Right', 'Right', or 'Unknown'")
    confidence: float = Field(description="Confidence score for this assessment from 0.0 to 1.0")

class SourceValidationAgent(BaseAgentNode):
    def __init__(self):
        super().__init__("SourceValidationAgent")
        self.llm = None
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are the Source Validation & Credibility Agent for NEWSIQ. "
                       "Evaluate the following article title, description, and source for credibility and bias. "
                       "Assign a credibility score (0.0 to 1.0) and a political bias label (Left, Center-Left, Center, Center-Right, Right, Unknown)."),
            ("human", "Source: {source}\nTitle: {title}\nDescription: {description}")
        ])
        
    def _get_llm(self):
        if not self.llm and settings.GEMINI_API_KEY:
            keys = [k.strip() for k in settings.GEMINI_API_KEY.split(",") if k.strip()]
            agent_hash = sum(ord(c) for c in self.name)
            key_idx = agent_hash % len(keys) if keys else 0
            api_key = keys[key_idx] if keys else settings.GEMINI_API_KEY
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-3.1-flash-lite",
                api_key=api_key,
                temperature=0.1
            )
        return self.llm

    async def _validate_article(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a single article without an LLM call to save quota."""
        source_name = article.get("source_name", "Unknown").lower()
        
        # Simple heuristic lookup instead of LLM to save N API calls
        bias = "Center"
        if any(x in source_name for x in ["fox", "breitbart", "nypost", "epoch"]):
            bias = "Right"
        elif any(x in source_name for x in ["cnn", "msnbc", "huffpost", "vox"]):
            bias = "Left"
        elif any(x in source_name for x in ["nytimes", "washington post"]):
            bias = "Center-Left"
        elif any(x in source_name for x in ["wsj", "bloomberg"]):
            bias = "Center-Right"
            
        credibility = 0.85
        if any(x in source_name for x in ["reuters", "ap", "associated press", "bbc", "npr", "pbs"]):
            credibility = 0.95
            
        article["credibility_score"] = credibility
        article["bias_label"] = bias
        article["validation_confidence"] = 0.9
        
        return article

    async def __call__(self, state: AgentState) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Validating {len(state.get('raw_articles', []))} articles.")
        
        raw_articles = state.get("raw_articles", [])
        if not raw_articles:
            return {"verified_articles": []}
            
        # Run validation concurrently for all articles
        tasks = [self._validate_article(article) for article in raw_articles]
        verified_articles = await asyncio.gather(*tasks)
        
        # We could filter out articles with very low credibility here, but for now we keep all
        # and just attach the scores.
        
        return {
            "verified_articles": verified_articles
        }

validation_agent = SourceValidationAgent()
