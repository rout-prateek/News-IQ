"""
Layer 1 — Context Builder

Assembles a rich, shared context object before any AI agent runs.
All agents receive this same context — no agent performs its own retrieval.

Pipeline:
  1. Parse incoming article (title, description, URL, source)
  2. Search NewsAPI for related coverage using title keywords
  3. Deduplicate articles by URL
  4. Build a unified ContextObject dict
"""

import logging
import hashlib
from typing import Dict, Any, List, Optional

from app.services.retrieval import news_retrieval_service

logger = logging.getLogger(__name__)

# In-memory cache for context objects (keyed by article hash)
_CONTEXT_CACHE: Dict[str, Dict[str, Any]] = {}


def _hash_article(article: Dict[str, Any]) -> str:
    """Generate a stable hash key from article title + URL."""
    raw = f"{article.get('title', '')}|{article.get('url', '')}".lower().strip()
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _deduplicate_articles(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate articles by URL or title similarity."""
    seen_urls = set()
    seen_titles = set()
    unique = []
    for a in articles:
        url = (a.get("url") or "").strip()
        title = (a.get("title") or "").strip().lower()

        # Skip if exact URL or title already seen
        if url and url in seen_urls:
            continue
        if title and title in seen_titles:
            continue

        if url:
            seen_urls.add(url)
        if title:
            seen_titles.add(title)
        unique.append(a)
    return unique


def _extract_keywords(title: str, description: Optional[str] = None) -> str:
    """Extract a search query from the article title.
    
    Uses the first 8 significant words from the title as the search query.
    Strips common noise words.
    """
    noise = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been",
        "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "and", "or", "but", "not", "this", "that", "it", "its",
        "has", "have", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "can", "shall",
        "up", "out", "if", "as", "so", "no", "than", "too", "very",
        "ap", "news", "reuters", "bloomberg", "nyt", "cnn",
    }
    words = title.split()
    keywords = [w.strip(".,!?:;'\"()-") for w in words if w.lower().strip(".,!?:;'\"()-") not in noise]
    # Take up to 3 keywords for a broader and highly relevant search (e.g. "Blanche nomination Trump")
    return " ".join(keywords[:3])


async def build_context(
    article: Dict[str, Any],
    related_articles: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build a shared context object for all AI agents.

    Args:
        article: The primary article dict with title, description, url, source_name.
        related_articles: Any related articles already provided by the client.

    Returns:
        A ContextObject dict with:
        - primary_article: The original article
        - related_articles: Deduplicated related coverage
        - context_text: A formatted text block for LLM consumption
        - cache_key: A hash key for caching
    """
    cache_key = _hash_article(article)

    # Return cached context if available
    if cache_key in _CONTEXT_CACHE:
        logger.info(f"[ContextBuilder] Cache hit for '{article.get('title', '')[:50]}'")
        return _CONTEXT_CACHE[cache_key]

    title = article.get("title") or ""
    description = article.get("description") or ""
    url = article.get("url") or ""
    source_name = article.get("source_name") or "Unknown"

    # --- Step 1: Retrieve related articles from NewsAPI ---
    newsapi_results: List[Dict[str, Any]] = []
    if title:
        search_query = _extract_keywords(title, description)
        try:
            logger.info(f"[ContextBuilder] Searching NewsAPI for: '{search_query}'")
            newsapi_results = await news_retrieval_service.search_news(
                query=search_query,
                page_size=10
            )
            logger.info(f"[ContextBuilder] Found {len(newsapi_results)} related articles from NewsAPI")
        except Exception as e:
            logger.warning(f"[ContextBuilder] NewsAPI search failed: {e}")

    # --- Step 2: Merge and deduplicate ---
    all_related = related_articles + newsapi_results
    all_related = _deduplicate_articles(all_related)

    # Remove the primary article itself from related
    all_related = [
        a for a in all_related
        if (a.get("url") or "").strip() != url.strip()
        and (a.get("title") or "").strip().lower() != title.strip().lower()
    ]

    # Cap at 8 related articles to keep context manageable
    all_related = all_related[:8]

    # --- Step 3: Build the context text ---
    context_parts = []

    context_parts.append(
        f"=== PRIMARY ARTICLE ===\n"
        f"Title: {title}\n"
        f"Source: {source_name}\n"
        f"URL: {url}\n"
        f"Content: {description}\n"
    )

    for i, rel in enumerate(all_related, 1):
        r_title = rel.get("title", "No Title")
        r_source = rel.get("source_name", "Unknown")
        r_content = rel.get("description") or rel.get("content") or ""
        r_url = rel.get("url", "")
        context_parts.append(
            f"=== RELATED ARTICLE {i} ===\n"
            f"Title: {r_title}\n"
            f"Source: {r_source}\n"
            f"URL: {r_url}\n"
            f"Content: {r_content}\n"
        )

    context_text = "\n".join(context_parts)

    # --- Step 4: Assemble context object ---
    context_obj = {
        "primary_article": {
            "title": title,
            "description": description,
            "url": url,
            "source_name": source_name,
        },
        "related_articles": all_related,
        "context_text": context_text,
        "cache_key": cache_key,
        "related_count": len(all_related),
    }

    # Cache the context
    _CONTEXT_CACHE[cache_key] = context_obj
    logger.info(f"[ContextBuilder] Built context with {len(all_related)} related articles")

    return context_obj
