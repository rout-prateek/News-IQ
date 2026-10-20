"""
Layer 4 — Intelligence Composer

After all agents complete and pass validation, the Composer merges
every validated JSON object into one unified Intelligence Report.

IMPORTANT:
  - The Composer does NOT re-analyze or reinterpret data.
  - It does NOT call any LLM.
  - It is a pure, deterministic merge function.
  - It fills missing optional fields with safe defaults.
  - It preserves every agent's output exactly as validated.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Default fallback values for each agent when it fails
AGENT_DEFAULTS = {
    "quickSummary": {
        "executive_summary": "Intelligence analysis could not be completed for this section.",
        "key_points": ["Analysis unavailable — agent did not respond."],
        "reading_time": "N/A",
        "category": "General",
    },
    "detailedSummary": {
        "background": "Detailed analysis could not be completed.",
        "current_situation": "Current situation analysis is unavailable.",
        "important_facts": [],
        "key_takeaways": ["Detailed summary agent did not respond."],
    },
    "credibility": {
        "score": 50,
        "confidence": 0,
        "agreement": 50,
        "unverified": 0,
        "reasoning": "Credibility analysis could not be completed.",
    },
    "bias": {
        "alignment": "Unknown",
        "score": 0.0,
        "emotional_language": "Not assessed.",
        "sensationalism": "Not assessed.",
        "missing_viewpoints": "Not assessed.",
        "reasoning": "Bias analysis could not be completed.",
    },
    "historicalContext": {
        "timeline": [],
    },
    "sourceComparison": {
        "viewpoints": [],
        "overall_consensus": "Source comparison not available.",
        "major_differences": "Not available.",
        "missing_information": "Not assessed.",
    },
    "impactAnalysis": {
        "economy": "Impact analysis not available.",
        "politics": "Impact analysis not available.",
        "society": "Impact analysis not available.",
        "businesses": "Impact analysis not available.",
        "technology": "Impact analysis not available.",
        "environment": "Impact analysis not available.",
    },
    "knowledgeGraph": {
        "nodes": [],
        "edges": [],
    },
    "entities": {
        "people": [],
        "organizations": [],
        "companies": [],
        "countries": [],
        "products": [],
        "laws": [],
        "treaties": [],
        "dates": [],
        "numbers": [],
    },
    "relatedStories": {
        "recommendations": [],
    },
}


def compose_intelligence_report(
    article: Dict[str, Any],
    agent_results: Dict[str, Optional[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Compose the final unified Intelligence Report.

    Args:
        article: The original article context (title, description, url, source_name).
        agent_results: Dict mapping agent names to their validated output (or None if failed).

    Returns:
        A single unified dict containing every section of the Intelligence Report.
    """
    report = {}

    # Include the original article metadata
    report["article"] = {
        "title": article.get("title", ""),
        "description": article.get("description", ""),
        "url": article.get("url", ""),
        "source_name": article.get("source_name", "Unknown"),
    }

    # Merge each agent's output, falling back to defaults if None
    for agent_name, default_value in AGENT_DEFAULTS.items():
        agent_data = agent_results.get(agent_name)
        if agent_data is not None:
            report[agent_name] = agent_data
        else:
            logger.warning(f"[Composer] Using default for failed agent: {agent_name}")
            report[agent_name] = default_value

    # Add metadata about the report
    failed_agents = [
        name for name, data in agent_results.items() if data is None
    ]
    report["metadata"] = {
        "total_agents": len(AGENT_DEFAULTS),
        "successful_agents": len(AGENT_DEFAULTS) - len(failed_agents),
        "failed_agents": failed_agents,
        "status": "complete" if not failed_agents else "partial",
    }

    logger.info(
        f"[Composer] Intelligence Report composed: "
        f"{report['metadata']['successful_agents']}/{report['metadata']['total_agents']} agents succeeded"
    )

    return report
