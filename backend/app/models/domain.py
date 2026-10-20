from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, ARRAY, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from .base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True) # Matches Supabase UUID
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bookmarks = relationship("Bookmark", back_populates="user")
    reading_history = relationship("ReadingHistory", back_populates="user")

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(String, primary_key=True, index=True) # Can be hash of URL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String, unique=True, nullable=False)
    source_name = Column(String, nullable=True)
    author = Column(String, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    image_url = Column(String, nullable=True)
    
    # Intelligence Fields
    credibility_score = Column(Float, nullable=True)
    bias_label = Column(String, nullable=True)
    summary_quick = Column(Text, nullable=True)
    summary_detailed = Column(Text, nullable=True)
    key_takeaways = Column(JSON, nullable=True) # List of strings
    
    # Vector Embeddings
    embedding = Column(Vector(768), nullable=True) # Gemini embeddings have 768 dimensions
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    article_id = Column(String, ForeignKey("articles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="bookmarks")
    article = relationship("Article")

class ReadingHistory(Base):
    __tablename__ = "reading_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    article_id = Column(String, ForeignKey("articles.id"))
    read_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="reading_history")
    article = relationship("Article")
