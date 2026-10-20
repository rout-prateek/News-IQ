import logging
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.core.config import settings
from .base import BaseAgentNode, AgentState

logger = logging.getLogger(__name__)

class QueryAnalysis(BaseModel):
    intent: str = Field(description="The primary intent of the user query (e.g., 'news_search', 'explanation', 'summarization', 'general_chat')")
    expanded_query: str = Field(description="An optimized, expanded version of the search query suitable for a news API or vector search.")

class QueryUnderstandingAgent(BaseAgentNode):
    def __init__(self):
        super().__init__("QueryUnderstandingAgent")
        self.llm = None
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are the Query Understanding Agent for NEWSIQ, an AI-powered News Intelligence Platform. "
                       "Your job is to analyze the user's input, determine their intent, and generate an optimized search query "
                       "that will yield the best results from the NewsAPI /everything endpoint. "
                       "IMPORTANT: NewsAPI performs best with 2-4 broad keywords. Extract ONLY the core entities or main topics. "
                       "Do NOT use long phrases, exact titles, or special characters. Keep the expanded_query strictly to 2-4 keywords."),
            ("human", "{query}")
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
                temperature=0.2
            )
        return self.llm

    async def __call__(self, state: AgentState) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Analyzing query: {state['user_query']}")
        
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY missing. Using fallback query analysis.")
            return {
                "intent": "news_search",
                "expanded_query": state['user_query']
            }

        try:
            import re
            
            query = state["user_query"]
            # Expanded stopwords list to cover conversational phrases and typos
            stopwords = {
                "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent",
                "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant",
                "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during",
                "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having",
                "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how",
                "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets",
                "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
                "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she",
                "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the",
                "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd",
                "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up",
                "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when",
                "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont",
                "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself",
                "yourselves", "go", "going", "gone", "went", "tell", "show", "find", "get", "give", "inn", "news",
                "happening", "information", "latest", "on", "out", "about", "story"
            }
            
            # Remove punctuation and split
            words = re.sub(r'[^\w\s]', '', query).split()
            keywords = [w for w in words if w.lower() not in stopwords]
            
            expanded_query = " ".join(keywords[:5]) if keywords else query
            
            context_article = state.get("context_article")
            if context_article:
                context_text = f"{context_article.get('title', '')} {context_article.get('description', '')}"
                c_words = re.sub(r'[^\w\s]', '', context_text).split()
                c_keywords = [w for w in c_words if w.lower() not in stopwords]
                if c_keywords:
                    # Combine query keywords with context keywords to constrain results to this story
                    combined_parts = keywords[:2] + c_keywords[:2]
                    expanded_query = " ".join(combined_parts)
            
            logger.info(f"[{self.name}] Intent: news_search, Expanded Query (optimized): {expanded_query}")
            
            return {
                "intent": "news_search",
                "expanded_query": expanded_query
            }
        except Exception as e:
            logger.error(f"[{self.name}] Error analyzing query: {str(e)}")
            return {
                "error": f"Query Understanding Failed: {str(e)}"
            }

query_agent = QueryUnderstandingAgent()
