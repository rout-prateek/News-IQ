"""
News Intelligence Orchestrator

The central pipeline that coordinates all 4 layers:
  1. Context Builder → Build shared context from article + NewsAPI
  2. AI Agents → Run all agents in parallel
  3. Validator → Validate each agent's output
  4. Composer → Merge into final Intelligence Report

Streams SSE events as each agent completes, giving the frontend
live progress updates. The final DONE event includes the composed report.
"""

import logging
import asyncio
import json
from datetime import datetime, date
from typing import Dict, Any, List, AsyncGenerator

def default_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


from .context_builder import build_context
from .validator import validate_agent_output
from .composer import compose_intelligence_report
from .specialized_agents import (
    run_quick_summary_agent,
    run_detailed_summary_agent,
    run_entities_agent,
    run_credibility_agent,
    run_bias_agent,
    run_historical_context_agent,
    run_source_comparison_agent,
    run_impact_agent,
    run_knowledge_graph_agent,
    run_recommendation_agent,
)

logger = logging.getLogger(__name__)

# In-memory cache for completed intelligence reports
_REPORT_CACHE: Dict[str, str] = {}


class IntelligenceOrchestrator:
    """
    Central orchestrator for the News Intelligence Engine.
    
    Pipeline:
        Request → Context Builder → [Agents ∥] → Validator → Composer → SSE Stream
    """

    def __init__(self):
        # Map agent names (matching frontend expectations) to their functions
        self.agent_map = {
            "quickSummary": run_quick_summary_agent,
            "detailedSummary": run_detailed_summary_agent,
            "entities": run_entities_agent,
            "credibility": run_credibility_agent,
            "bias": run_bias_agent,
            "historicalContext": run_historical_context_agent,
            "sourceComparison": run_source_comparison_agent,
            "impactAnalysis": run_impact_agent,
            "knowledgeGraph": run_knowledge_graph_agent,
            "relatedStories": run_recommendation_agent,
        }

    async def stream_intelligence(
        self,
        article: Dict[str, Any],
        related_articles: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """
        Full 4-layer pipeline with SSE streaming.

        Yields Server-Sent Event strings as each agent finishes.
        The final event is a DONE marker with the composed report.
        """

        # ━━━━ Layer 1: Context Builder ━━━━
        try:
            logger.info("[Orchestrator] Layer 1: Building context...")
            yield self._sse({"status": "PROGRESS", "step": "context", "message": "Building article context..."})

            context_obj = await build_context(article, related_articles)
            context_text = context_obj["context_text"]
            cache_key = context_obj["cache_key"]

            yield self._sse({
                "status": "PROGRESS",
                "step": "context_done",
                "message": f"Context built with {context_obj['related_count']} related articles"
            })
        except Exception as e:
            logger.error(f"[Orchestrator] Context Builder failed: {e}")
            # Fallback: build a minimal context from the article itself
            context_text = (
                f"Title: {article.get('title', '')}\n"
                f"Source: {article.get('source_name', '')}\n"
                f"Content: {article.get('description', '')}\n"
            )
            cache_key = "fallback"
            yield self._sse({"status": "PROGRESS", "step": "context_fallback", "message": "Using fallback context"})

        # ━━━━ Check cache for complete report ━━━━
        if cache_key in _REPORT_CACHE:
            logger.info(f"[Orchestrator] Full report cache hit for key: {cache_key}")
            cached_report = json.loads(_REPORT_CACHE[cache_key])
            # Stream each agent result from cache
            for agent_name in self.agent_map:
                if agent_name in cached_report:
                    yield self._sse({"agent": agent_name, "data": cached_report[agent_name], "cached": True})
            yield self._sse({"status": "DONE", "report": cached_report})
            return

        # ━━━━ Layer 2 & 3: Run Agents + Validate ━━━━
        logger.info("[Orchestrator] Layer 2: Running agents in parallel...")
        agent_results: Dict[str, Any] = {}

        # Semaphore to limit concurrency to 3 simultaneous API calls,
        # preventing us from exceeding the 15 RPM per-minute rate limits.
        sem = asyncio.Semaphore(3)

        # Future to pass detailedSummary output to quickSummary
        detailed_summary_future = asyncio.Future()

        async def _run_and_validate(name: str, func) -> dict:
            """Run a single agent, then validate its output."""
            try:
                logger.info(f"[Orchestrator] Starting agent: {name}")
                
                # Chaining: quickSummary waits for detailedSummary output
                if name == "quickSummary":
                    logger.info("[Orchestrator] quickSummary waiting for detailedSummary...")
                    detailed_data = await detailed_summary_future
                    
                    # Construct a clear context string purely from the detailed summary
                    detailed_text = (
                        f"Background: {detailed_data.get('background', '')}\n"
                        f"Current Situation: {detailed_data.get('current_situation', '')}\n"
                        f"Key Takeaways:\n" + "\n".join(f"- {t}" for t in detailed_data.get('key_takeaways', []))
                    )
                    async with sem:
                        raw_result = await func(detailed_text)
                else:
                    async with sem:
                        # Introduce a tiny stagger sleep to prevent simultaneous network burst
                        await asyncio.sleep(0.3)
                        raw_result = await func(context_text)

                # Layer 3: Validate
                validated = validate_agent_output(name, raw_result)
                
                if validated is not None:
                    # If this is detailedSummary, resolve the future for quickSummary
                    if name == "detailedSummary":
                        detailed_summary_future.set_result(validated)
                    return {"agent": name, "data": validated, "cached": False}
                else:
                    if name == "detailedSummary":
                        # Resolve future with default values if validation fails
                        detailed_summary_future.set_result({
                            "background": "Unavailable.",
                            "current_situation": "Unavailable.",
                            "key_takeaways": ["Analysis failed."]
                        })
                    logger.warning(f"[Orchestrator] Agent {name} output failed validation")
                    return {"agent": name, "error": "Validation failed"}

            except Exception as e:
                logger.error(f"[Orchestrator] Agent {name} failed: {str(e)}")
                if name == "detailedSummary":
                    # Resolve future with default values on exception
                    detailed_summary_future.set_result({
                        "background": "Unavailable.",
                        "current_situation": "Unavailable.",
                        "key_takeaways": ["Analysis failed."]
                    })
                return {"agent": name, "error": str(e)}

        # Launch all agents concurrently (quickSummary will internally await detailedSummary)
        tasks = [
            asyncio.create_task(_run_and_validate(name, func))
            for name, func in self.agent_map.items()
        ]

        # Stream results as each agent completes
        for future in asyncio.as_completed(tasks):
            result = await future
            agent_name = result.get("agent", "unknown")

            if "data" in result:
                agent_results[agent_name] = result["data"]
            else:
                agent_results[agent_name] = None  # Mark as failed

            # Stream to frontend
            yield self._sse(result)

        # ━━━━ Layer 4: Compose ━━━━
        logger.info("[Orchestrator] Layer 4: Composing intelligence report...")
        report = compose_intelligence_report(article, agent_results)

        # Attach the actual related articles retrieved during Context Builder
        report["relatedArticles"] = context_obj.get("related_articles", [])

        # Cache the composed report
        try:
            _REPORT_CACHE[cache_key] = json.dumps(report, default=default_serializer)
            logger.info(f"[Orchestrator] Report cached with key: {cache_key}")
        except Exception as e:
            logger.warning(f"[Orchestrator] Failed to cache report: {e}")

        # Send final DONE event
        yield self._sse({"status": "DONE", "report": report})
        logger.info("[Orchestrator] Pipeline complete.")

    @staticmethod
    def _sse(data: dict) -> str:
        """Format a dict as a Server-Sent Event string."""
        return f"data: {json.dumps(data, default=default_serializer)}\n\n"


# Singleton instance
orchestrator = IntelligenceOrchestrator()
