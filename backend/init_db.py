import asyncio
import logging
from sqlalchemy import text
from app.core.db import engine
from app.models.base import Base
# Import domain models so they are registered in Base.metadata
from app.models import domain

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    async with engine.begin() as conn:
        logger.info("Ensuring pgvector extension is enabled...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        
        logger.info("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
