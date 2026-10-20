from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.domain import User, Article, Bookmark, ReadingHistory
from app.models.schemas import BookmarkCreate, BookmarkResponse, ReadingHistoryCreate, ReadingHistoryResponse

router = APIRouter()

async def ensure_user(db: AsyncSession, supabase_user) -> User:
    """Ensures the user exists in our DB, if not, creates them based on Supabase JWT."""
    result = await db.execute(select(User).where(User.id == supabase_user.id))
    user = result.scalars().first()
    if not user:
        user = User(
            id=supabase_user.id,
            email=supabase_user.email,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def ensure_article(db: AsyncSession, article_data) -> Article:
    """Ensures the article exists in DB before linking it."""
    result = await db.execute(select(Article).where(Article.id == article_data.id))
    article = result.scalars().first()
    if not article:
        article = Article(
            id=article_data.id,
            title=article_data.title,
            description=article_data.description,
            url=article_data.url,
            source_name=article_data.source_name,
            image_url=article_data.image_url,
            published_at=article_data.published_at,
        )
        db.add(article)
        await db.commit()
        await db.refresh(article)
    return article

from sqlalchemy.orm import selectinload

@router.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all bookmarks for the current user."""
    user = await ensure_user(db, current_user)
    result = await db.execute(
        select(Bookmark)
        .options(selectinload(Bookmark.article))
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    )
    return result.scalars().all()

@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bookmark an article."""
    user = await ensure_user(db, current_user)
    article = await ensure_article(db, data.article)
    
    # Check if already bookmarked
    result = await db.execute(
        select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.article_id == article.id)
    )
    existing = result.scalars().first()
    if existing:
        return existing
        
    bookmark = Bookmark(user_id=user.id, article_id=article.id)
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    # Attach article for response
    bookmark.article = article
    return bookmark

@router.delete("/bookmarks/{article_id}")
async def delete_bookmark(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove a bookmark."""
    user = await ensure_user(db, current_user)
    result = await db.execute(
        select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.article_id == article_id)
    )
    bookmark = result.scalars().first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
        
    await db.delete(bookmark)
    await db.commit()
    return {"success": True}

@router.post("/history", response_model=ReadingHistoryResponse)
async def add_to_history(
    data: ReadingHistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add an article to reading history."""
    user = await ensure_user(db, current_user)
    article = await ensure_article(db, data.article)
    
    # Check if recently read (maybe just update timestamp if we care, or just add new record)
    # We will just add a new record for simplicity, or update if exists.
    result = await db.execute(
        select(ReadingHistory).where(ReadingHistory.user_id == user.id, ReadingHistory.article_id == article.id)
    )
    existing = result.scalars().first()
    if existing:
        return existing
        
    history = ReadingHistory(user_id=user.id, article_id=article.id)
    db.add(history)
    await db.commit()
    await db.refresh(history)
    history.article = article
    return history

@router.get("/history", response_model=List[ReadingHistoryResponse])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all reading history for the current user."""
    user = await ensure_user(db, current_user)
    result = await db.execute(
        select(ReadingHistory)
        .options(selectinload(ReadingHistory.article))
        .where(ReadingHistory.user_id == user.id)
        .order_by(ReadingHistory.read_at.desc())
        .limit(50)
    )
    return result.scalars().all()

from sqlalchemy import func

@router.get("/stats")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get aggregated reading and bookmark stats for the user."""
    user = await ensure_user(db, current_user)
    
    # Count bookmarks
    bookmarks_count = await db.scalar(
        select(func.count(Bookmark.id)).where(Bookmark.user_id == user.id)
    )
    
    # Count history
    history_count = await db.scalar(
        select(func.count(ReadingHistory.id)).where(ReadingHistory.user_id == user.id)
    )
    
    # Mocking time-series and source data for Analytics page
    return {
        "articles_read": history_count or 0,
        "bookmarks_saved": bookmarks_count or 0,
        "active_days": 1,
        "activity_timeline": [
            {"name": "Mon", "reads": 2, "bookmarks": 0},
            {"name": "Tue", "reads": 5, "bookmarks": 2},
            {"name": "Wed", "reads": 3, "bookmarks": 1},
            {"name": "Thu", "reads": 8, "bookmarks": 4},
            {"name": "Fri", "reads": 4, "bookmarks": 1},
            {"name": "Sat", "reads": 1, "bookmarks": 0},
            {"name": "Sun", "reads": history_count, "bookmarks": bookmarks_count}
        ],
        "sources_distribution": [
            {"name": "CNN", "value": 30},
            {"name": "Reuters", "value": 45},
            {"name": "BBC", "value": 25}
        ]
    }

from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    full_name: str

@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = await ensure_user(db, current_user)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name or user.email.split("@")[0]
    }

@router.put("/profile")
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = await ensure_user(db, current_user)
    user.full_name = data.full_name
    await db.commit()
    return {"success": True, "full_name": user.full_name}

@router.get("/notifications")
async def get_notifications(
    current_user = Depends(get_current_user)
):
    # Mocked notifications for the Lovable UI compliance
    return [
        {"id": 1, "title": "Synthesis Complete", "message": "Agent 3 finished analyzing 'The Future of AI'.", "time": "2 mins ago", "unread": True},
        {"id": 2, "title": "Breaking News", "message": "Global markets rally as tech stocks surge.", "time": "1 hour ago", "unread": True},
        {"id": 3, "title": "Weekly Report Ready", "message": "Your personalized reading analytics for this week are available.", "time": "1 day ago", "unread": False}
    ]
