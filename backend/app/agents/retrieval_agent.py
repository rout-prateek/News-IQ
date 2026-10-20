import logging
from typing import Dict, Any
from .base import BaseAgentNode, AgentState
from app.services.retrieval import news_retrieval_service

logger = logging.getLogger(__name__)

class NewsRetrievalAgent(BaseAgentNode):
    def __init__(self):
        super().__init__("NewsRetrievalAgent")

    async def __call__(self, state: AgentState) -> Dict[str, Any]:
        existing_articles = state.get("raw_articles", [])
        if existing_articles:
            logger.info(f"[{self.name}] Context article provided. Will fetch additional sources to cross-reference.")
            
        query = state.get("expanded_query") or state.get("user_query")
        logger.info(f"[{self.name}] Fetching news for query: {query}")
        
        try:
            # We can use the generic search or top headlines depending on intent
            intent = state.get("intent", "news_search")
            
            allow_fallback = not bool(existing_articles)
            if intent == "trending" or query.strip() == "":
                articles = await news_retrieval_service.fetch_top_headlines(page_size=10, allow_fallback=allow_fallback)
            else:
                articles = await news_retrieval_service.search_news(query=query, page_size=10, allow_fallback=allow_fallback)
                
            logger.info(f"[{self.name}] Retrieved {len(articles)} articles.")
            
            # Combine provided context articles with the newly retrieved ones, avoiding duplicates by URL
            combined = list(existing_articles)
            existing_urls = {a.get("url") for a in combined if a.get("url")}
            for a in articles:
                if a.get("url") not in existing_urls:
                    combined.append(a)
                    existing_urls.add(a.get("url"))
            
            return {
                "raw_articles": combined
            }
        except Exception as e:
            logger.error(f"[{self.name}] Error fetching news: {str(e)}")
            return {
                "error": f"News Retrieval Failed: {str(e)}",
                "raw_articles": []
            }

retrieval_agent = NewsRetrievalAgent()
