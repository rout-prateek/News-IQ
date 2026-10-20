import logging
from typing import List, Optional
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            logger.warning("Gemini API Key is missing. Vector embeddings will not be generated.")
            
        # Using the standard text embedding model from Gemini
        self.embedding_model = "text-embedding-004"

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate a 768-dimensional embedding vector for the given text using Gemini."""
        if not self.client or not text:
            return None
            
        try:
            # We use the synchronous call here as google-genai is primarily sync,
            # or we can wrap it in an executor if it blocks, but let's start simple.
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=text
            )
            
            # The response contains a list of embeddings if multiple inputs were provided
            # We provided a single string, so we return the first embedding's values
            if response and response.embeddings:
                return response.embeddings[0].values
            return None
            
        except Exception as e:
            logger.error(f"Error generating embedding with Gemini: {str(e)}")
            return None

vector_service = VectorService()
