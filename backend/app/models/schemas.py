from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ArticleBase(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    url: str
    source_name: Optional[str] = None
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None

class BookmarkCreate(BaseModel):
    article: ArticleBase

class BookmarkResponse(BaseModel):
    id: int
    article_id: str
    created_at: datetime
    article: ArticleBase

    class Config:
        from_attributes = True

class ReadingHistoryCreate(BaseModel):
    article: ArticleBase

class ReadingHistoryResponse(BaseModel):
    id: int
    article_id: str
    read_at: datetime
    article: ArticleBase

    class Config:
        from_attributes = True
