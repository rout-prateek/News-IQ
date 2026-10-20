import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from .base import BaseAgentNode, AgentState

logger = logging.getLogger(__name__)

class TimelineEvent(BaseModel):
    date: str = Field(description="Time or date string, e.g., '[14:30]' or '2024-03-12'")
    label: str = Field(description="Short description of the event.")
    tone: str = Field(description="'neutral', 'warning', or 'positive'")

class SourceComparison(BaseModel):
    source: str = Field(description="The name of the news source")
    lean: str = Field(description="Political lean, e.g., 'Center', 'Left', 'Right'")
    credibility: str = Field(description="Credibility score string, e.g., '82/100'")
    take: str = Field(description="The primary takeaway or slant from this source.")

class ImpactAnalysis(BaseModel):
    k: str = Field(description="Category of impact, e.g., 'Markets', 'Policy'")
    v: str = Field(description="Details of the impact.")

class EntityItem(BaseModel):
    name: str = Field(description="Name of entity")
    type: str = Field(description="Type of entity, e.g., 'Organization', 'Person', 'Location'")
    mentions: int = Field(description="Estimated number of mentions across sources.")

class IntelligenceMetadata(BaseModel):
    final_response: str = Field(description="The comprehensive markdown intelligence report.")
    quick_summary: List[str] = Field(description="A 3-bullet point executive summary.")
    timeline: List[TimelineEvent] = Field(description="Key events reconstructed from the articles.")
    source_comparison: List[SourceComparison] = Field(description="Comparison of how different sources are framing the story.")
    impact_analysis: List[ImpactAnalysis] = Field(description="Analysis of the real-world impact.")
    entities: List[EntityItem] = Field(description="Key entities involved.")
    tags: List[str] = Field(description="List of 3-5 categorical tags.")
    credibility_score: int = Field(description="Overall credibility score out of 100 based on the sources.")
    consensus_score: int = Field(description="Agreement score out of 100 representing how much sources agree.")
    bias_score: int = Field(description="Overall bias from -100 (extreme left) to 100 (extreme right). 0 is center.")
    recommended_questions: List[str] = Field(description="3 insightful follow-up questions the user could ask the AI.")

class SynthesisAgent(BaseAgentNode):
    def __init__(self):
        super().__init__("SynthesisAgent")
        self.llm = None
        self.system_prompt = """You are the Reasoning & Synthesis Agent for NEWSIQ, an AI-powered News Intelligence Platform.
Your task is to synthesize the provided news articles into a comprehensive, intelligent, and highly readable response for the user.

Rules:
1. Provide a detailed summary and context.
2. Compare viewpoints if there are contradictions across the sources.
3. DO NOT include raw credibility or bias metrics (e.g., "(Credibility: 0.85)") in the text. We extract these into visual dashboards. Keep the narrative clean, engaging, and highly readable.
4. Never hallucinate. Only use information provided in the articles.
5. Format the output elegantly using Markdown (bullet points, bold text for emphasis).
"""

    def _get_llm(self):
        if not self.llm and settings.GEMINI_API_KEY:
            keys = [k.strip() for k in settings.GEMINI_API_KEY.split(",") if k.strip()]
            agent_hash = sum(ord(c) for c in self.name)
            key_idx = agent_hash % len(keys) if keys else 0
            api_key = keys[key_idx] if keys else settings.GEMINI_API_KEY
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-3.1-flash-lite",
                api_key=api_key,
                temperature=0.3
            )
        return self.llm

    async def __call__(self, state: AgentState) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Synthesizing response for query: {state.get('user_query')}")
        
        if not settings.GEMINI_API_KEY:
            return {
                "final_response": "Gemini API Key is missing. I cannot generate an intelligent response at this time, but you can view the retrieved articles in the dashboard."
            }

        verified_articles = state.get("verified_articles", [])
        if not verified_articles:
            return {
                "final_response": "I couldn't find any credible news articles matching your query."
            }

        # Format context from verified articles
        context_parts = []
        for i, article in enumerate(verified_articles):
            title = article.get("title", "No Title")
            source = article.get("source_name", "Unknown Source")
            content = article.get("description") or article.get("content") or ""
            credibility = article.get("credibility_score", 0.5)
            bias = article.get("bias_label", "Unknown")
            
            context_parts.append(
                f"--- Article {i+1} ---\n"
                f"Title: {title}\n"
                f"Source: {source} (Credibility: {credibility:.2f}, Bias: {bias})\n"
                f"Content: {content}\n"
            )
        
        context_str = "\n".join(context_parts)
        
        # Build messages for the LLM
        system_instruction = self.system_prompt
        context_article = state.get("context_article")
        if context_article:
            system_instruction += (
                f"\nIMPORTANT: The user initiated this query from a specific story page: '{context_article.get('title')}'."
                f"\nPrioritize answering the query focusing on this specific article as the primary reference."
                f"\nCompare or cross-reference other articles in the context relative to this primary article."
            )
            
        messages = [
            SystemMessage(content=system_instruction),
            HumanMessage(content=f"User Query: {state.get('user_query')}\n\nRetrieved Context:\n{context_str}")
        ]
        
        try:
            llm = self._get_llm()
            if not llm:
                return {
                    "error": "Synthesis Failed: LLM not initialized due to missing API key.",
                    "final_response": "An error occurred while synthesizing the intelligence report."
                }
            
            structured_llm = llm.with_structured_output(IntelligenceMetadata)
            response: IntelligenceMetadata = await structured_llm.ainvoke(messages)
            
            # Serialize metadata back to dict for the UI
            metadata_dict = response.dict(exclude={"final_response"})
            
            return {
                "final_response": response.final_response,
                "intelligence_metadata": metadata_dict,
                "reasoning_context": "Synthesized from " + str(len(verified_articles)) + " articles."
            }
        except Exception as e:
            logger.error(f"[{self.name}] Error synthesizing response: {str(e)}")
            return {
                "error": f"Synthesis Failed: {str(e)}",
                "final_response": "An error occurred while synthesizing the intelligence report."
            }

synthesis_agent = SynthesisAgent()
