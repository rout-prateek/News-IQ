"""
Layer 3 — Validation Layer

Validates and repairs every agent output before it reaches the frontend.
Ensures:
  - Valid JSON structure
  - No missing required fields
  - Numeric scores in valid ranges
  - Empty arrays instead of None
  - Graceful handling of malformed responses
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def _clamp(value: Any, min_val: int, max_val: int, default: int) -> int:
    """Clamp a numeric value to a valid range, returning default if not a number."""
    try:
        v = int(value)
        return max(min_val, min(max_val, v))
    except (TypeError, ValueError):
        return default


def _clamp_float(value: Any, min_val: float, max_val: float, default: float) -> float:
    """Clamp a float value to a valid range."""
    try:
        v = float(value)
        return max(min_val, min(max_val, v))
    except (TypeError, ValueError):
        return default


def _ensure_list(value: Any, min_items: int = 0) -> list:
    """Ensure a value is a list, filling with defaults if needed."""
    if not isinstance(value, list):
        return []
    return value


def _ensure_str(value: Any, default: str = "") -> str:
    """Ensure a value is a non-None string."""
    if value is None:
        return default
    return str(value)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Per-Agent Validators
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def validate_quick_summary(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair QuickSummary output."""
    try:
        return {
            "executive_summary": _ensure_str(data.get("executive_summary"), "Summary unavailable."),
            "key_points": _ensure_list(data.get("key_points"))[:7] or ["Analysis in progress..."],
            "reading_time": _ensure_str(data.get("reading_time"), "3 min"),
            "category": _ensure_str(data.get("category"), "General"),
        }
    except Exception as e:
        logger.error(f"[Validator] QuickSummary validation failed: {e}")
        return None


def validate_detailed_summary(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair DetailedSummary output."""
    try:
        return {
            "background": _ensure_str(data.get("background"), "Background information unavailable."),
            "current_situation": _ensure_str(data.get("current_situation"), "Current situation unavailable."),
            "important_facts": _ensure_list(data.get("important_facts")),
            "key_takeaways": _ensure_list(data.get("key_takeaways")) or ["Analysis in progress..."],
        }
    except Exception as e:
        logger.error(f"[Validator] DetailedSummary validation failed: {e}")
        return None


def validate_credibility(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair Credibility output."""
    try:
        return {
            "score": _clamp(data.get("score"), 0, 100, 50),
            "confidence": _clamp(data.get("confidence"), 0, 100, 50),
            "agreement": _clamp(data.get("agreement"), 0, 100, 50),
            "unverified": _clamp(data.get("unverified"), 0, 20, 0),
            "reasoning": _ensure_str(data.get("reasoning") or data.get("explanation"), "Credibility analysis unavailable."),
        }
    except Exception as e:
        logger.error(f"[Validator] Credibility validation failed: {e}")
        return None


def validate_bias(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair Bias output."""
    try:
        return {
            "alignment": _ensure_str(data.get("alignment"), "Center"),
            "score": _clamp_float(data.get("score"), -1.0, 1.0, 0.0),
            "emotional_language": _ensure_str(data.get("emotional_language"), "Not assessed."),
            "sensationalism": _ensure_str(data.get("sensationalism"), "Not assessed."),
            "missing_viewpoints": _ensure_str(data.get("missing_viewpoints"), "Not assessed."),
            "reasoning": _ensure_str(data.get("reasoning"), "Bias analysis unavailable."),
        }
    except Exception as e:
        logger.error(f"[Validator] Bias validation failed: {e}")
        return None


def validate_historical_context(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair HistoricalContext output."""
    try:
        raw_timeline = _ensure_list(data.get("timeline"))
        validated_timeline = []
        for event in raw_timeline:
            if isinstance(event, dict):
                validated_timeline.append({
                    "date": _ensure_str(event.get("date"), "Unknown"),
                    "title": _ensure_str(event.get("title") or event.get("label"), "Event"),
                    "description": _ensure_str(event.get("description"), ""),
                    "tone": _ensure_str(event.get("tone"), "neutral"),
                    "source": _ensure_str(event.get("source"), ""),
                    "url": _ensure_str(event.get("url"), ""),
                })
        return {"timeline": validated_timeline}
    except Exception as e:
        logger.error(f"[Validator] HistoricalContext validation failed: {e}")
        return None


def validate_source_comparison(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair SourceComparison output."""
    try:
        raw_viewpoints = _ensure_list(data.get("viewpoints"))
        validated_viewpoints = []
        for vp in raw_viewpoints:
            if isinstance(vp, dict):
                validated_viewpoints.append({
                    "name": _ensure_str(vp.get("name") or vp.get("source"), "Unknown Source"),
                    "short_summary": _ensure_str(vp.get("short_summary") or vp.get("summary"), ""),
                    "editorial_stance": _ensure_str(vp.get("editorial_stance") or vp.get("alignment") or vp.get("lean"), "Unknown"),
                    "credibility": _clamp(vp.get("credibility"), 0, 100, 70),
                    "unique_information": _ensure_str(vp.get("unique_information"), ""),
                })
        return {
            "viewpoints": validated_viewpoints,
            "overall_consensus": _ensure_str(data.get("overall_consensus"), "Consensus not available."),
            "major_differences": _ensure_str(data.get("major_differences"), "Differences not available."),
            "missing_information": _ensure_str(data.get("missing_information"), "Not assessed."),
        }
    except Exception as e:
        logger.error(f"[Validator] SourceComparison validation failed: {e}")
        return None


def validate_impact(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair Impact output."""
    try:
        return {
            "economy": _ensure_str(data.get("economy"), "Impact analysis unavailable."),
            "politics": _ensure_str(data.get("politics"), "Impact analysis unavailable."),
            "society": _ensure_str(data.get("society"), "Impact analysis unavailable."),
            "businesses": _ensure_str(data.get("businesses"), "Impact analysis unavailable."),
            "technology": _ensure_str(data.get("technology"), "Impact analysis unavailable."),
            "environment": _ensure_str(data.get("environment"), "Impact analysis unavailable."),
        }
    except Exception as e:
        logger.error(f"[Validator] Impact validation failed: {e}")
        return None


def validate_knowledge_graph(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair KnowledgeGraph output."""
    try:
        raw_nodes = _ensure_list(data.get("nodes"))
        raw_edges = _ensure_list(data.get("edges"))

        validated_nodes = []
        node_ids = set()
        for node in raw_nodes:
            if isinstance(node, dict) and node.get("id"):
                validated_nodes.append({
                    "id": str(node["id"]),
                    "label": _ensure_str(node.get("label") or node.get("name"), node["id"]),
                    "group": _ensure_str(node.get("group") or node.get("type"), "Concept"),
                })
                node_ids.add(str(node["id"]))

        validated_edges = []
        for edge in raw_edges:
            if isinstance(edge, dict):
                src = str(edge.get("source", ""))
                tgt = str(edge.get("target", ""))
                if src in node_ids and tgt in node_ids:
                    validated_edges.append({
                        "source": src,
                        "target": tgt,
                        "label": _ensure_str(edge.get("label"), "related to"),
                    })

        return {"nodes": validated_nodes, "edges": validated_edges}
    except Exception as e:
        logger.error(f"[Validator] KnowledgeGraph validation failed: {e}")
        return None


def validate_entities(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair Entities output."""
    try:
        return {
            "people": _ensure_list(data.get("people")),
            "organizations": _ensure_list(data.get("organizations")),
            "companies": _ensure_list(data.get("companies")),
            "countries": _ensure_list(data.get("countries")),
            "products": _ensure_list(data.get("products")),
            "laws": _ensure_list(data.get("laws")),
            "treaties": _ensure_list(data.get("treaties")),
            "dates": _ensure_list(data.get("dates")),
            "numbers": _ensure_list(data.get("numbers")),
        }
    except Exception as e:
        logger.error(f"[Validator] Entities validation failed: {e}")
        return None


def validate_recommendations(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and repair Recommendation output."""
    try:
        raw_recs = _ensure_list(data.get("recommendations"))
        validated_recs = []
        for rec in raw_recs:
            if isinstance(rec, dict):
                validated_recs.append({
                    "title": _ensure_str(rec.get("title"), "Recommended topic"),
                    "type": _ensure_str(rec.get("type"), "topic"),
                    "reasoning": _ensure_str(rec.get("reasoning"), "Related to this story."),
                })
        return {"recommendations": validated_recs}
    except Exception as e:
        logger.error(f"[Validator] Recommendations validation failed: {e}")
        return None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main Validator Dispatch
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Map agent names to their validator functions
VALIDATORS = {
    "quickSummary": validate_quick_summary,
    "detailedSummary": validate_detailed_summary,
    "credibility": validate_credibility,
    "bias": validate_bias,
    "historicalContext": validate_historical_context,
    "sourceComparison": validate_source_comparison,
    "impactAnalysis": validate_impact,
    "knowledgeGraph": validate_knowledge_graph,
    "entities": validate_entities,
    "relatedStories": validate_recommendations,
}


def validate_agent_output(agent_name: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Validate a single agent's output.
    
    Returns the validated (and potentially repaired) data,
    or None if the data is unrecoverable.
    """
    validator = VALIDATORS.get(agent_name)
    if not validator:
        logger.warning(f"[Validator] No validator registered for agent '{agent_name}'")
        return data  # Pass through if no validator exists

    validated = validator(data)
    if validated is None:
        logger.error(f"[Validator] Agent '{agent_name}' output failed validation — returning None")
    else:
        logger.info(f"[Validator] Agent '{agent_name}' output validated successfully")
    
    return validated
