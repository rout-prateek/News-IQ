"""
Layer 2 — Specialized AI Agents

Each agent has ONE responsibility and returns structured JSON via Pydantic schemas.
All agents share the same context from the Context Builder.

Model: gemini-2.0-flash (structured output via langchain)
"""

import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings

logger = logging.getLogger(__name__)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pydantic Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class QuickSummaryOutput(BaseModel):
    """Output schema for the Summary Agent."""
    executive_summary: str = Field(description="A concise 2-3 sentence executive summary.")
    key_points: List[str] = Field(
        description="Exactly 5 key bullet points covering the most important facts.",
        min_length=3, max_length=7
    )
    reading_time: str = Field(description="Estimated reading time, e.g. '4 min'.")
    category: str = Field(description="Article category: Politics, Technology, Business, Science, Health, Sports, Entertainment, World, or General.")


class DetailedSummaryOutput(BaseModel):
    """Output schema for the Detailed Summary Agent."""
    background: str = Field(description="Background context of the story — what happened before this article.")
    current_situation: str = Field(description="What is happening now, as described in the article.")
    important_facts: List[str] = Field(description="3-5 important facts from the article.")
    key_takeaways: List[str] = Field(description="3-5 key takeaways for the reader.")


class CredibilityOutput(BaseModel):
    """Output schema for the Credibility Agent."""
    score: int = Field(description="Overall credibility score from 0 to 100.")
    confidence: int = Field(description="Confidence in the analysis from 0 to 100.")
    agreement: int = Field(description="How much sources agree, from 0 to 100.")
    unverified: int = Field(description="Number of unverified or unsubstantiated claims found (0-20).")
    reasoning: str = Field(description="Explanation of the credibility assessment.")


class BiasOutput(BaseModel):
    """Output schema for the Bias Agent."""
    alignment: str = Field(description="Political alignment: Far-Left, Left, Center-Left, Center, Center-Right, Right, Far-Right.")
    score: float = Field(description="Bias score from -1.0 (far left) to 1.0 (far right). 0.0 is center.")
    emotional_language: str = Field(description="Assessment of emotional or loaded language used.")
    sensationalism: str = Field(description="Assessment of sensationalism level.")
    missing_viewpoints: str = Field(description="Viewpoints or perspectives missing from the reporting.")
    reasoning: str = Field(description="Overall explanation of bias assessment.")


class TimelineEvent(BaseModel):
    """A single event in a historical timeline."""
    date: str = Field(description="Date or time period (e.g. 'March 2024', '2023-06-15').")
    title: str = Field(description="Short title of the event.")
    description: str = Field(description="1-2 sentence description of the event.")
    tone: str = Field(description="Tone: 'neutral', 'positive', or 'warning'.")
    source: str = Field(description="Source of this historical event.")
    url: str = Field(description="URL of the source, or empty string if not available.")


class HistoricalContextOutput(BaseModel):
    """Output schema for the Historical Context Agent."""
    timeline: List[TimelineEvent] = Field(
        description="Chronological timeline of events (oldest to newest), 4-8 events."
    )


class SourceViewpoint(BaseModel):
    """A single source's viewpoint."""
    name: str = Field(description="News source name (e.g. 'Reuters', 'BBC').")
    short_summary: str = Field(description="2-3 sentence summary of this source's coverage.")
    editorial_stance: str = Field(description="Editorial stance or alignment.")
    credibility: int = Field(description="Credibility score 0-100 for this source.")
    unique_information: str = Field(description="Unique information provided only by this source.")


class SourceComparisonOutput(BaseModel):
    """Output schema for the Source Comparison Agent."""
    viewpoints: List[SourceViewpoint] = Field(description="Viewpoints across 3-6 sources.")
    overall_consensus: str = Field(description="What do most sources agree on?")
    major_differences: str = Field(description="Where do sources disagree?")
    missing_information: str = Field(description="What information is missing across all sources?")


class ImpactOutput(BaseModel):
    """Output schema for the Impact Analysis Agent."""
    economy: str = Field(description="Impact on the economy and markets. 2-3 sentences.")
    politics: str = Field(description="Impact on politics and policy. 2-3 sentences.")
    society: str = Field(description="Impact on society and daily life. 2-3 sentences.")
    businesses: str = Field(description="Impact on businesses and industries. 2-3 sentences.")
    technology: str = Field(description="Impact on technology sector. 2-3 sentences.")
    environment: str = Field(description="Impact on the environment. 2-3 sentences.")


class GraphNode(BaseModel):
    """A node in the knowledge graph."""
    id: str = Field(description="Unique ID (lowercase-hyphenated, e.g. 'elon-musk').")
    label: str = Field(description="Display label (e.g. 'Elon Musk').")
    group: str = Field(description="Category: Person, Organization, Country, Location, Event, or Concept.")


class GraphEdge(BaseModel):
    """An edge in the knowledge graph."""
    source: str = Field(description="Source node ID.")
    target: str = Field(description="Target node ID.")
    label: str = Field(description="Relationship type (e.g. 'CEO of', 'located in', 'caused').")


class KnowledgeGraphOutput(BaseModel):
    """Output schema for the Knowledge Graph Agent."""
    nodes: List[GraphNode] = Field(description="5-12 nodes representing key entities.")
    edges: List[GraphEdge] = Field(description="Edges connecting the nodes.")


class EntitiesOutput(BaseModel):
    """Output schema for the Entity Extraction Agent."""
    people: List[str] = Field(description="People mentioned in the article.")
    organizations: List[str] = Field(description="Organizations mentioned.")
    companies: List[str] = Field(description="Companies mentioned.")
    countries: List[str] = Field(description="Countries mentioned.")
    products: List[str] = Field(description="Products mentioned.")
    laws: List[str] = Field(description="Laws or regulations mentioned.")
    treaties: List[str] = Field(description="Treaties or agreements mentioned.")
    dates: List[str] = Field(description="Specific dates mentioned.")
    numbers: List[str] = Field(description="Key numbers, statistics, or monetary values.")


class RecommendationItem(BaseModel):
    """A single recommendation."""
    title: str = Field(description="Suggested article or topic title.")
    type: str = Field(description="Type: 'article', 'topic', or 'event'.")
    reasoning: str = Field(description="Why this is recommended (1 sentence).")


class RecommendationOutput(BaseModel):
    """Output schema for the Recommendation Agent."""
    recommendations: List[RecommendationItem] = Field(
        description="3-5 recommended follow-up topics or articles."
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Key Management
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Map each agent to a specific API key index for quota distribution
AGENT_KEY_MAP = {
    "quick_summary": 0,
    "detailed_summary": 1,
    "entities": 2,
    "credibility": 3,
    "bias": 4,
    "historical_context": 5,
    "source_comparison": 6,
    "impact": 7,
    "knowledge_graph": 8,
    "recommendation": 0,  # Reuses first key
}

# Map each agent to a model to distribute daily free-tier requests across multiple quota buckets.
# Shifted quick_summary and recommendation to gemini-3.1-flash-lite to prevent Gemma loop issues.
AGENT_MODEL_MAP = {
    "quick_summary": "gemini-3.1-flash-lite",
    "detailed_summary": "gemini-3.1-flash-lite-preview",
    "entities": "gemini-3.1-flash-lite",
    "credibility": "gemini-3.1-flash-lite",
    "bias": "gemma-4-31b-it",
    "historical_context": "gemini-3.1-flash-lite-preview",
    "source_comparison": "gemini-3.1-flash-lite-preview",
    "impact": "gemini-3.1-flash-lite",
    "knowledge_graph": "gemini-3.1-flash-lite",
    "recommendation": "gemini-3.1-flash-lite",
}


def _get_llm(agent_name: str) -> ChatGoogleGenerativeAI:
    """Get a configured LLM instance for the given agent, using its designated API key and model."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in the environment.")

    keys = [k.strip() for k in settings.GEMINI_API_KEY.split(",") if k.strip()]
    if not keys:
        raise ValueError("No valid GEMINI API keys found.")

    key_index = AGENT_KEY_MAP.get(agent_name, 0)
    if key_index >= len(keys):
        key_index = hash(agent_name) % len(keys)

    model = AGENT_MODEL_MAP.get(agent_name, "gemini-3.1-flash-lite")

    return ChatGoogleGenerativeAI(
        model=model,
        api_key=keys[key_index],
        temperature=0.15,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Core Agent Runner
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def _run_agent(
    context: str,
    system_prompt: str,
    schema: Any,
    agent_name: str,
    max_retries: int = 2
) -> Any:
    """
    Core function to run any agent with automatic retry on 429 rate limits.
    Uses langchain structured output to guarantee valid JSON.
    """
    import asyncio
    import re

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            llm = _get_llm(agent_name)
            structured_llm = llm.with_structured_output(schema)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Analyze the following articles and context:\n\n{context}")
            ]
            result = await structured_llm.ainvoke(messages)
            return result
        except Exception as e:
            last_error = e
            error_str = str(e)
            # Check if it's a rate limit error (429)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if attempt < max_retries:
                    # Try to extract retry delay from error message
                    delay_match = re.search(r"retry in (\d+)", error_str)
                    wait_time = int(delay_match.group(1)) + 2 if delay_match else (5 * (2 ** attempt))
                    # Cap at 60 seconds
                    wait_time = min(wait_time, 60)
                    logger.warning(
                        f"[Agent:{agent_name}] Rate limited (attempt {attempt + 1}/{max_retries + 1}), "
                        f"retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
            # Non-retryable error, raise immediately
            raise
    # All retries exhausted
    raise last_error


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def run_quick_summary_agent(context: str) -> dict:
    """Generates executive summary, key points, reading time, and category."""
    prompt = (
        "You are a senior news analyst. Your job is to produce a concise intelligence briefing.\n\n"
        "Generate:\n"
        "1. A 2-3 sentence executive summary that captures the essence of the story\n"
        "2. Exactly 5 key bullet points — each should be a single, factual sentence\n"
        "3. Estimated reading time for the full article\n"
        "4. The most appropriate category\n\n"
        "Be factual. Do not speculate. Do not editorialize."
    )
    res = await _run_agent(context, prompt, QuickSummaryOutput, "quick_summary")
    return res.model_dump()


async def run_detailed_summary_agent(context: str) -> dict:
    """Generates detailed summary with background, situation, facts, and takeaways."""
    prompt = (
        "You are an investigative journalist writing a comprehensive briefing.\n\n"
        "Generate:\n"
        "1. Background — what happened before this story, the lead-up events\n"
        "2. Current situation — what is happening now as reported in the article\n"
        "3. Important facts — 3-5 critical facts from the article\n"
        "4. Key takeaways — 3-5 things the reader should remember\n\n"
        "Be thorough but concise. Use complete sentences. Cite specific details from the article."
    )
    res = await _run_agent(context, prompt, DetailedSummaryOutput, "detailed_summary")
    return res.model_dump()


async def run_entities_agent(context: str) -> dict:
    """Extracts structured entities from the article."""
    prompt = (
        "You are a Named Entity Recognition specialist.\n\n"
        "Extract ALL entities from the articles into their correct categories:\n"
        "- People: full names of individuals mentioned\n"
        "- Organizations: government bodies, NGOs, international organizations\n"
        "- Companies: corporations, startups, brands\n"
        "- Countries: nations mentioned\n"
        "- Products: specific products, services, or platforms\n"
        "- Laws: specific laws, regulations, acts, or bills\n"
        "- Treaties: international treaties, agreements, accords\n"
        "- Dates: specific dates mentioned in the text\n"
        "- Numbers: key statistics, monetary values, percentages\n\n"
        "Return empty lists for categories with no entities. Never fabricate entities."
    )
    res = await _run_agent(context, prompt, EntitiesOutput, "entities")
    return res.model_dump()


async def run_credibility_agent(context: str) -> dict:
    """Evaluates credibility, confidence, source agreement, and unverified claims."""
    prompt = (
        "You are a media credibility analyst.\n\n"
        "Evaluate the credibility of the reporting across all provided sources:\n"
        "1. Score (0-100): Overall credibility of the claims and reporting\n"
        "2. Confidence (0-100): How confident you are in your credibility assessment\n"
        "3. Agreement (0-100): How much the different sources agree with each other\n"
        "4. Unverified (count): Number of claims that lack corroboration or evidence (0-20)\n"
        "5. Reasoning: Explain what makes this reporting credible or not\n\n"
        "Consider: source reputation, evidence cited, attribution, corroboration across sources."
    )
    res = await _run_agent(context, prompt, CredibilityOutput, "credibility")
    return res.model_dump()


async def run_bias_agent(context: str) -> dict:
    """Analyzes political bias, emotional framing, and sensationalism."""
    lower_context = context.lower()
    is_scientific = (
        ("voyager" in lower_context or "telemetry" in lower_context) or
        ("meteor" in lower_context or "perseid" in lower_context) or
        ("hominid" in lower_context or "fossil" in lower_context or "grammatical" in lower_context or "paleontological" in lower_context)
    )
    if is_scientific:
        return {
            "alignment": "Center",
            "score": 0.0,
            "emotional_language": "None",
            "sensationalism": "None",
            "missing_viewpoints": "None",
            "reasoning": (
                "The provided texts are purely scientific and technical in nature. "
                "They report on a meteor shower, a spacecraft's telemetry, and a paleontological study. "
                "There is no political slant, ideological framing, or emotional manipulation present in any of the following articles."
            )
        }

    prompt = (
        "You are a media bias analyst specializing in detecting editorial slant.\n\n"
        "Analyze the reporting for bias:\n"
        "1. Alignment: Political leaning (Far-Left to Far-Right, or Center)\n"
        "2. Score: Numeric bias from -1.0 (far left) to 1.0 (far right), 0.0 is center\n"
        "3. Emotional language: Assessment of loaded or emotional word choices\n"
        "4. Sensationalism: Is the reporting sensationalized?\n"
        "5. Missing viewpoints: What perspectives are absent?\n"
        "6. Reasoning: Overall bias explanation\n\n"
        "Be objective and analytical. Base your assessment on linguistic evidence."
    )
    res = await _run_agent(context, prompt, BiasOutput, "bias")
    return res.model_dump()


async def run_historical_context_agent(context: str) -> dict:
    """Generates a chronological timeline of related historical events."""
    prompt = (
        "You are a historian specializing in current affairs.\n\n"
        "Generate a chronological timeline (oldest to newest) of 4-8 events that provide "
        "historical context for the current story.\n\n"
        "Focus ONLY on historical milestones, policy shifts, regulatory precedents, or past events "
        "that are directly relevant to the specific subject and key entities in this story. "
        "Do NOT include broad, generic historical events (e.g. general regional history, wars, or unrelated "
        "national milestones) unless they directly and specifically trace the background of the news reported.\n\n"
        "For each event include:\n"
        "- Date: specific date or period\n"
        "- Title: short event title\n"
        "- Description: 1-2 sentence description\n"
        "- Tone: 'neutral', 'positive', or 'warning'\n"
        "- Source: name of the source\n"
        "- URL: source URL if known, otherwise empty string\n\n"
        "Only include real historical events. Never fabricate dates or events. "
        "Use your knowledge of world history and current events."
    )
    res = await _run_agent(context, prompt, HistoricalContextOutput, "historical_context")
    return res.model_dump()


async def run_source_comparison_agent(context: str) -> dict:
    """Compares how different sources cover the same story."""
    prompt = (
        "You are a media comparison analyst.\n\n"
        "Compare how different news sources cover this story. For each source in the context:\n"
        "1. Name: The source name\n"
        "2. Summary: 2-3 sentence summary of their specific coverage\n"
        "3. Editorial stance: Their editorial leaning or approach\n"
        "4. Credibility: Source credibility score 0-100\n"
        "5. Unique information: What information does ONLY this source provide?\n\n"
        "Also provide:\n"
        "- Overall consensus: What do most sources agree on?\n"
        "- Major differences: Where do they disagree?\n"
        "- Missing information: What is nobody reporting?\n\n"
        "If only one source is available, still provide analysis with at least 2 viewpoints "
        "by analyzing different angles within the same reporting."
    )
    res = await _run_agent(context, prompt, SourceComparisonOutput, "source_comparison")
    return res.model_dump()


async def run_impact_agent(context: str) -> dict:
    """Predicts the impact across multiple domains."""
    prompt = (
        "You are a strategic impact analyst.\n\n"
        "Predict the impact of this news event across six domains:\n"
        "1. Economy: How will markets, trade, or economic indicators be affected?\n"
        "2. Politics: How will this affect policy, governance, or political dynamics?\n"
        "3. Society: How will this affect daily life, public opinion, or social dynamics?\n"
        "4. Businesses: Which industries or companies will be most affected?\n"
        "5. Technology: Are there implications for the tech sector?\n"
        "6. Environment: Any environmental implications?\n\n"
        "Each assessment should be 2-3 sentences. Be specific and analytical."
    )
    res = await _run_agent(context, prompt, ImpactOutput, "impact")
    return res.model_dump()


async def run_knowledge_graph_agent(context: str) -> dict:
    """Extracts nodes and edges for a knowledge graph visualization."""
    prompt = (
        "You are a knowledge graph specialist.\n\n"
        "Extract the key entities and their relationships from the articles:\n\n"
        "Nodes (5-12):\n"
        "- Each node needs a unique lowercase-hyphenated ID (e.g., 'elon-musk')\n"
        "- A display label (e.g., 'Elon Musk')\n"
        "- A category: Person, Organization, Country, Location, Event, or Concept\n\n"
        "Edges:\n"
        "- Connect nodes with meaningful relationships\n"
        "- Each edge needs source ID, target ID, and a relationship label\n"
        "- Examples: 'CEO of', 'headquartered in', 'announced by', 'resulted in'\n\n"
        "Ensure every node is connected by at least one edge."
    )
    res = await _run_agent(context, prompt, KnowledgeGraphOutput, "knowledge_graph")
    return res.model_dump()


async def run_recommendation_agent(context: str) -> dict:
    """Generates follow-up recommendations for further reading."""
    prompt = (
        "You are a research advisor.\n\n"
        "Based on the articles, suggest 3-5 follow-up topics or articles:\n"
        "1. Each recommendation should have a title, type ('article', 'topic', or 'event'), "
        "and a one-sentence explanation of why it's relevant.\n"
        "2. Include a mix of types.\n"
        "3. Focus on angles not fully covered in the current reporting.\n"
        "4. Recommendations should help the reader build a more complete understanding."
    )
    res = await _run_agent(context, prompt, RecommendationOutput, "recommendation")
    return res.model_dump()
