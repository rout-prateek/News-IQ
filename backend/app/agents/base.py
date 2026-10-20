from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field

class AgentState(TypedDict):
    """
    The state of the AI Agent pipeline.
    Passed between nodes in the LangGraph.
    """
    user_query: str
    expanded_query: Optional[str]
    intent: Optional[str]
    
    # Retrieved articles from news sources
    raw_articles: List[Dict[str, Any]]
    
    # Articles that have passed validation/credibility checks
    verified_articles: List[Dict[str, Any]]
    
    # Generated reasoning or synthesis
    reasoning_context: Optional[str]
    
    # Structured intelligence metadata for UI components
    intelligence_metadata: Optional[Dict[str, Any]]
    
    # Final response to the user
    final_response: Optional[str]
    
    # Conversation history
    messages: List[BaseMessage]
    
    # Error state
    error: Optional[str]
    
    # Optional context article provided as primary reference
    context_article: Optional[Dict[str, Any]]

# Base structure for an agent node
class BaseAgentNode:
    """Base interface for an Agent Node in our LangGraph architecture."""
    def __init__(self, name: str):
        self.name = name
        
    async def __call__(self, state: AgentState) -> Dict[str, Any]:
        """
        Executes the agent's primary function.
        Returns a dictionary containing the updates to the AgentState.
        """
        raise NotImplementedError("Subclasses must implement __call__")
