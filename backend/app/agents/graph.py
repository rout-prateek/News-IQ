import logging
from langgraph.graph import StateGraph, END
from .base import AgentState
from .query_agent import query_agent
from .retrieval_agent import retrieval_agent
from .validation_agent import validation_agent
from .synthesis_agent import synthesis_agent

logger = logging.getLogger(__name__)

def build_agent_graph():
    """Builds the LangGraph orchestration for the NEWSIQ pipeline."""
    
    workflow = StateGraph(AgentState)
    
    # Add Nodes
    workflow.add_node("query_understanding", query_agent)
    workflow.add_node("news_retrieval", retrieval_agent)
    workflow.add_node("source_validation", validation_agent)
    workflow.add_node("synthesis", synthesis_agent)
    
    # Define Edges (The flow)
    workflow.set_entry_point("query_understanding")
    workflow.add_edge("query_understanding", "news_retrieval")
    workflow.add_edge("news_retrieval", "source_validation")
    workflow.add_edge("source_validation", "synthesis")
    workflow.add_edge("synthesis", END)
    
    # Compile the graph
    app = workflow.compile()
    return app

# Singleton compiled graph instance
news_agent_pipeline = build_agent_graph()

async def run_news_pipeline(query: str, context_article: dict = None) -> AgentState:
    """Helper function to execute the entire graph pipeline for a user query."""
    
    raw_articles = [context_article] if context_article else []
    
    initial_state = AgentState(
        user_query=query,
        expanded_query=None,
        intent=None,
        raw_articles=raw_articles,
        verified_articles=[],
        reasoning_context=None,
        intelligence_metadata=None,
        final_response=None,
        messages=[],
        error=None,
        context_article=context_article
    )
    
    logger.info(f"Starting News Pipeline for query: {query}")
    final_state = await news_agent_pipeline.ainvoke(initial_state)
    return final_state
