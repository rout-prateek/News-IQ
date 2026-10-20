from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.services.retrieval import news_retrieval_service

router = APIRouter()

@router.get("/trending")
async def get_trending_news(
    category: str = "general",
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Fetch top trending headlines directly from NewsAPI."""
    articles = await news_retrieval_service.fetch_top_headlines(
        country="in",
        category=category,
        page_size=limit
    )
    # Serialize datetime before returning
    for a in articles:
        if a.get("published_at"):
            a["published_at"] = a["published_at"].isoformat()
    return articles

@router.get("/search")
async def search_news(
    q: str,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Search for news articles using NewsAPI."""
    articles = await news_retrieval_service.search_news(
        query=q,
        page_size=limit
    )
    for a in articles:
        if a.get("published_at"):
            a["published_at"] = a["published_at"].isoformat()
    return articles

@router.get("/feed")
async def get_personalized_feed(
    topics: str = "Technology,Markets",
    limit: int = 24
) -> List[Dict[str, Any]]:
    """Fetch a personalized feed of articles based on selected topics."""
    topic_list = [t.strip() for t in topics.split(",") if t.strip()]
    if not topic_list:
        topic_list = ["Technology", "Markets"]
        
    articles = []
    per_topic_limit = max(4, limit // len(topic_list))
    
    for topic in topic_list:
        try:
            if topic == "Technology":
                results = await news_retrieval_service.fetch_top_headlines(category="technology", page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Technology"
                articles.extend(results)
            elif topic == "Markets":
                results = await news_retrieval_service.fetch_top_headlines(category="business", page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Markets"
                articles.extend(results)
            elif topic == "General":
                results = await news_retrieval_service.fetch_top_headlines(category="general", page_size=per_topic_limit)
                for r in results:
                    r["category"] = "General"
                articles.extend(results)
            elif topic == "Policy":
                results = await news_retrieval_service.search_news(query='public policy government regulation elections', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Policy"
                articles.extend(results)
            elif topic == "Energy":
                results = await news_retrieval_service.search_news(query='solar renewable wind energy power grid', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Energy"
                articles.extend(results)
            elif topic == "Security" or topic == "Geopolitics":
                results = await news_retrieval_service.search_news(query='national security cybersecurity geopolitical defense foreign policy', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Geopolitics" if topic == "Geopolitics" else "Security"
                articles.extend(results)
            elif topic == "Climate":
                results = await news_retrieval_service.search_news(query='climate change global warming carbon emissions', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Climate"
                articles.extend(results)
            elif topic == "Health":
                results = await news_retrieval_service.search_news(query='public health medical research vaccine FDA', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Health"
                articles.extend(results)
            elif topic == "Science":
                results = await news_retrieval_service.search_news(query='scientific research space exploration astrophysics', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Science"
                articles.extend(results)
            elif topic == "Economy":
                results = await news_retrieval_service.search_news(query='inflation interest rates GDP unemployment economy', page_size=per_topic_limit)
                for r in results:
                    r["category"] = "Economy"
                articles.extend(results)
        except Exception as e:
            logger.warning(f"Failed to fetch feed articles for topic {topic}: {e}")

    # Deduplicate articles
    seen_urls = set()
    unique_articles = []
    for a in articles:
        url = a.get("url")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_articles.append(a)

    # Sort all articles by published_at DESCENDING (latest first)
    from datetime import datetime, timezone
    def sort_key(x):
        pub = x.get("published_at")
        if not pub:
            return datetime.min.replace(tzinfo=timezone.utc)
        if pub.tzinfo is None:
            return pub.replace(tzinfo=timezone.utc)
        return pub

    unique_articles.sort(key=sort_key, reverse=True)

    # Serialize datetime before returning
    for a in unique_articles:
        if a.get("published_at") and hasattr(a["published_at"], "isoformat"):
            a["published_at"] = a["published_at"].isoformat()

    return unique_articles[:limit]
