# NEWSIQ --- From Headlines to Intelligence

> **Information is abundant. Intelligence is scarce.**\
> NEWSIQ aims to turn fragmented news into contextualized,
> evidence-backed intelligence.

NEWSIQ is an AI-powered News Intelligence Platform designed to help
people go beyond headlines. It brings together reporting from multiple
sources and uses specialized AI analysis to help users understand **what
happened, why it matters, how sources differ, and what remains
uncertain**.

> **Status note:** TinyFish integration is described as planned/in
> progress below. Update this README to reflect what is actually
> implemented and tested.

## Contents

-   [Why NEWSIQ?](#why-newsiq)
-   [Features](#features)
-   [Pipeline](#pipeline)
-   [TinyFish Integration](#tinyfish-integration)
-   [Technology Stack](#technology-stack)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [API Design](#api-design)
-   [Responsible Analysis](#responsible-analysis)
-   [Roadmap](#roadmap)

## Why NEWSIQ?

People encounter the same event through news websites, social media,
commentary, and official statements. These sources can emphasize
different details, disagree, or omit important context.

NEWSIQ's goal is to make information easier to understand---not simply
to summarize it. It aims to bring evidence, source comparison, and
historical context together in one place.

## Features

  -----------------------------------------------------------------------
  Feature                             Purpose
  ----------------------------------- -----------------------------------
  **Quick & Detailed Summary**        Understand the key developments at
                                      a glance or in depth.

  **Credibility Analysis**            Examine evidence quality,
                                      corroboration, and claim-level
                                      uncertainty.

  **Bias & Framing Analysis**         Identify loaded language,
                                      sensational framing, and missing
                                      perspectives.

  **Historical Context**              Connect current stories to relevant
                                      earlier events.

  **Source Comparison**               Compare how different sources
                                      report the same event.

  **Impact Analysis**                 Explore potential implications for
                                      affected stakeholders.

  **Knowledge Graph**                 Explore relevant entities and their
                                      relationships.

  **Related Intelligence**            Discover relevant follow-up
                                      reporting and background sources.

  **Ask About This Story**            Ask contextual questions grounded
                                      in the article and its evidence.

  **Citations & Sources**             Trace findings back to the sources
                                      used to support them.
  -----------------------------------------------------------------------

Feature availability depends on the current implementation and the
evidence available for a story.

## Pipeline

``` text
Article Selection
       |
       v
Article, Entity & Claim Extraction
       |
       v
TinyFish Search / Fetch / Optional Web Agent
       |
       v
Evidence Normalization & Deduplication
       |
       v
Specialized Intelligence Agents
       |
       v
Validation & Evidence Checks
       |
       v
Gemma Intelligence Composer
       |
       v
Structured Intelligence Report
       |
       v
NEWSIQ Interface
```

1.  **Article input:** Resolve the selected article and extract
    metadata, claims, and entities.
2.  **Web retrieval:** Discover independent reporting, official
    statements, primary documents, and historical context.
3.  **Evidence processing:** Normalize retrieved content, deduplicate
    sources, and preserve source URLs and timestamps.
4.  **Specialized analysis:** Analyze summaries, credibility, framing,
    historical context, source differences, impact, entities, and
    related stories.
5.  **Validation and composition:** Validate schemas and citations,
    preserve disagreements, and assemble a structured report.
6.  **Report delivery:** Render the report in the NEWSIQ interface.

## TinyFish Integration

### Why TinyFish?

News intelligence requires more than the text of one article. It
benefits from independent reporting, official statements, primary
documents, and relevant background material.

NEWSIQ plans to integrate **TinyFish as its web intelligence and
retrieval layer**, supplying relevant web content to the analysis
pipeline.

Official resources: [TinyFish About](https://www.tinyfish.ai/about) ·
[TinyFish Platform](https://www.tinyfish.chat/) · [Web
Agent](https://www.tinyfish.chat/agent)

### Planned API Usage

  -----------------------------------------------------------------------
  Capability                          Intended role
  ----------------------------------- -----------------------------------
  **Search API**                      Discover current, relevant, and
                                      diverse sources related to an
                                      article and its claims.

  **Fetch API**                       Retrieve readable page content and
                                      available metadata from selected
                                      URLs.

  **Web Agent API**                   Handle complex multi-step browsing
                                      or dynamic websites when ordinary
                                      search and fetch are insufficient.
  -----------------------------------------------------------------------

Use the Web Agent selectively; not every retrieval task requires browser
automation. Implement requests and response parsing according to the
current TinyFish documentation and the account's enabled capabilities.

### Integration Flow

``` text
Selected Article
      |
      v
Extract Topics, Entities & Claims
      |
      v
Generate Targeted Queries
      |
      v
TinyFish Search
      |
      v
Select Relevant Sources
      |
      +----> TinyFish Fetch ----> Extract Content
      |
      +----> Optional Web Agent for Complex Browsing
                                  |
                                  v
                    Normalize & Deduplicate Evidence
                                  |
                                  v
                         Evidence Source Registry
                                  |
                                  v
                         NEWSIQ Analysis Agents
                                  |
                                  v
                         Gemma Report Composer
```

### Evidence and Provenance

Normalize retrieved sources into a common record containing, where
available:

-   Source ID and URL
-   Canonical URL
-   Title and publisher
-   Author
-   Publication and retrieval timestamps
-   Extracted content
-   Source type
-   Content hash
-   Retrieval status

Deduplicate canonical URLs and near-identical content. Do not treat
syndicated copies as independent corroboration. Preserve provenance so
report findings can link back to supporting evidence.

**Important distinction:** TinyFish retrieves information; NEWSIQ
evaluates and contextualizes the evidence. A page being retrievable does
not make its claims true. Credibility analysis should compare claims
against evidence, distinguish corroboration from contradiction, and
communicate uncertainty.

### Reliability and Cost Controls

The integration should include:

-   Timeouts, bounded retries, and rate limits
-   Concurrency limits and request budgets
-   Caching for reusable retrieval results
-   URL and content deduplication
-   Graceful handling of blocked pages and retrieval failures
-   Structured logs without secrets
-   Selective Web Agent use
-   Prompt-injection defenses for retrieved content
-   URL validation and SSRF protections

## Technology Stack

Confirm each item against the repository before describing it as
implemented.

  -----------------------------------------------------------------------
  Layer                               Intended technology / role
  ----------------------------------- -----------------------------------
  Frontend                            React, TypeScript, Tailwind CSS,
                                      Shadcn UI

  Backend                             Python, FastAPI

  Database and authentication         Supabase / PostgreSQL / Supabase
                                      Auth

  Web retrieval                       TinyFish Search, Fetch, and
                                      selectively Web Agent

  AI analysis                         Gemma-based analysis and report
                                      composition

  Validation                          Pydantic schemas and deterministic
                                      Python checks

  Knowledge graph                     Existing graph visualization
                                      library, such as React Flow

  Caching                             Redis or an existing suitable cache

  Testing                             Existing backend, frontend, and
                                      end-to-end test frameworks
  -----------------------------------------------------------------------

## Getting Started

These are generic setup steps. Adjust them to the actual repository
layout, package scripts, Python version, and entry points.

### Prerequisites

-   A supported Python version
-   Node.js version supported by the frontend
-   AI provider credentials for enabled features
-   Supabase credentials if Supabase is configured
-   TinyFish API credentials when TinyFish integration is enabled

### 1. Clone the repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd NEWSIQ
```

Replace `<YOUR_REPOSITORY_URL>` with the actual repository URL.

### 2. Set up the backend

``` bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell, activate the environment with:

``` powershell
.venv\Scripts\Activate.ps1
```

### 3. Configure environment variables

Create a local `.env` file based on `.env.example`. Add only the
credentials required by the integrations you use.

### 4. Run the backend

If the FastAPI entry point is `app.main:app`, a typical command is:

``` bash
uvicorn app.main:app --reload
```

Adjust the import path to match the repository.

### 5. Run the frontend

From the frontend directory, use the package manager and scripts
specified by the repository. For an npm project, the commands are
commonly:

``` bash
npm install
npm run dev
```

## Environment Variables

The following are illustrative names; align them with the actual code
and current provider documentation.

``` dotenv
# AI provider
GEMMA_API_KEY=

# TinyFish retrieval
TINYFISH_API_KEY=
TINYFISH_BASE_URL=

# Database/authentication, if configured
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional cache
REDIS_URL=
```

-   Verify TinyFish's current base URL and authentication method in its
    official documentation.
-   Keep backend secrets out of frontend code.
-   Never commit `.env` files or log credentials.
-   Remove unused variables from the final example file.

## API Design

Possible endpoints, subject to the existing backend contracts:

  ------------------------------------------------------------------------------------------
  Method                  Example endpoint                           Purpose
  ----------------------- ------------------------------------------ -----------------------
  `POST`                  `/api/intelligence/{article_id}/process`   Start report
                                                                     generation.

  `GET`                   `/api/intelligence/{article_id}/status`    Retrieve processing
                                                                     progress.

  `GET`                   `/api/intelligence/{article_id}/report`    Retrieve the structured
                                                                     report.

  `POST`                  `/api/intelligence/{article_id}/ask`       Ask a question grounded
                                                                     in the article and its
                                                                     evidence.
  ------------------------------------------------------------------------------------------

Document these routes as available only after implementation and
testing.

## Responsible Analysis

-   Link important factual findings to supporting source records
    wherever possible.
-   Distinguish confirmed, corroborated, disputed, unverified, and
    insufficient-evidence states.
-   Reject citations that do not resolve to known sources.
-   Avoid counting duplicated or syndicated articles as independent
    corroboration.
-   Use a documented, versioned methodology for numerical credibility
    scores.
-   Do not equate bias with falsity.
-   Preserve conflicting evidence instead of silently resolving
    disagreements.
-   Allow partial reports when an individual retrieval or analysis
    component fails.
-   Treat external page content as untrusted and protect against SSRF
    and prompt injection.
-   Keep credentials and sensitive data out of logs.

AI analysis can contain errors. Users should be able to inspect sources
and understand the limitations of each finding.

## Roadmap

-   [ ] Verify and complete TinyFish Search integration.
-   [ ] Verify and complete TinyFish Fetch integration.
-   [ ] Add selective Web Agent support for complex retrieval.
-   [ ] Normalize source data and preserve evidence provenance end to
    end.
-   [ ] Implement and validate specialized intelligence agents.
-   [ ] Add schema validation and reliable partial-report handling.
-   [ ] Implement Gemma-powered report composition.
-   [ ] Add caching, rate limiting, and retrieval-cost controls.
-   [ ] Test retrieval, citations, scoring, and failure scenarios.
-   [ ] Improve contextual Q&A and multilingual support.
-   [ ] Explore intelligence workflows for research papers, reports,
    policy documents, and other formats.

Update the checklist as work is completed. Do not mark features complete
until they have been tested.

## Contributing

1.  Open an issue describing the problem or proposed improvement.
2.  Discuss significant architecture changes before implementing them.
3.  Keep credentials and private configuration out of commits.
4.  Add tests for new functionality.
5.  Document changes to environment variables, endpoints, and schemas.

Adapt these guidelines to the repository's actual contribution workflow.

## Disclaimer

NEWSIQ supports information discovery and analysis; it does not replace
independent judgment or primary-source review. Credibility indicators
are assessments based on available evidence, not guarantees of truth.
Historical connections and impact scenarios may be incomplete or
uncertain.

------------------------------------------------------------------------

**NEWSIQ --- Don't just read the news. Understand it.**
