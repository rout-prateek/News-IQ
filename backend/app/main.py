from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NEWSIQ AI Platform API",
    description="Backend for NEWSIQ News Intelligence Platform",
    version="1.0.0",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routers import agents, users, news, stream

# Include Routers
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(stream.router, prefix="/api/v1/agents", tags=["Stream"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(news.router, prefix="/api/v1/news", tags=["News"])

@app.get("/")
async def root():
    return {"message": "Welcome to NEWSIQ API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
