"""
Vocabulary management API routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.models.vocabulary import (
    VocabularyCreate,
    VocabularyUpdate,
    VocabularyResponse
)
from app.database import get_db

router = APIRouter()


@router.get("/vocabulary", response_model=List[VocabularyResponse])
async def get_vocabulary(
    search: Optional[str] = Query(None, description="Search in word or translation"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Get all vocabulary items with optional search and pagination"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        if search:
            cursor.execute(
                """
                SELECT * FROM vocabulary 
                WHERE original_word LIKE ? OR translation LIKE ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                """,
                (f"%{search}%", f"%{search}%", limit, offset)
            )
        else:
            cursor.execute(
                """
                SELECT * FROM vocabulary 
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset)
            )
        
        rows = cursor.fetchall()
        
        return [
            VocabularyResponse(
                id=row["id"],
                original_word=row["original_word"],
                translation=row["translation"],
                context_sentence=row["context_sentence"],
                video_id=row["video_id"],
                video_title=row["video_title"],
                language=row["language"] or "en",
                mastery=row["mastery"] or 0,
                timestamp=datetime.fromisoformat(row["timestamp"]) if row["timestamp"] else datetime.now(),
                created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(),
                updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now()
            )
            for row in rows
        ]


@router.get("/vocabulary/{item_id}", response_model=VocabularyResponse)
async def get_vocabulary_item(item_id: int):
    """Get a single vocabulary item by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Vocabulary item not found")
        
        return VocabularyResponse(
            id=row["id"],
            original_word=row["original_word"],
            translation=row["translation"],
            context_sentence=row["context_sentence"],
            video_id=row["video_id"],
            video_title=row["video_title"],
            language=row["language"] or "en",
            mastery=row["mastery"] or 0,
            timestamp=datetime.fromisoformat(row["timestamp"]) if row["timestamp"] else datetime.now(),
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now()
        )


@router.post("/vocabulary", response_model=VocabularyResponse)
async def create_vocabulary(item: VocabularyCreate):
    """Create a new vocabulary item"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if word already exists
        cursor.execute(
            "SELECT id FROM vocabulary WHERE LOWER(original_word) = LOWER(?)",
            (item.original_word,)
        )
        existing = cursor.fetchone()
        
        now = datetime.now().isoformat()
        
        if existing:
            # Update existing item
            cursor.execute(
                """
                UPDATE vocabulary SET
                    translation = ?,
                    context_sentence = ?,
                    video_id = ?,
                    video_title = ?,
                    timestamp = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    item.translation,
                    item.context_sentence,
                    item.video_id,
                    item.video_title,
                    now,
                    now,
                    existing["id"]
                )
            )
            item_id = existing["id"]
        else:
            # Create new item
            cursor.execute(
                """
                INSERT INTO vocabulary 
                (original_word, translation, context_sentence, video_id, video_title, language, timestamp, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.original_word,
                    item.translation,
                    item.context_sentence,
                    item.video_id,
                    item.video_title,
                    item.language,
                    now,
                    now,
                    now
                )
            )
            item_id = cursor.lastrowid
        
        # Fetch and return the created/updated item
        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        
        return VocabularyResponse(
            id=row["id"],
            original_word=row["original_word"],
            translation=row["translation"],
            context_sentence=row["context_sentence"],
            video_id=row["video_id"],
            video_title=row["video_title"],
            language=row["language"] or "en",
            mastery=row["mastery"] or 0,
            timestamp=datetime.fromisoformat(row["timestamp"]) if row["timestamp"] else datetime.now(),
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now()
        )


@router.put("/vocabulary/{item_id}", response_model=VocabularyResponse)
async def update_vocabulary(item_id: int, item: VocabularyUpdate):
    """Update an existing vocabulary item"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (item_id,))
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Vocabulary item not found")
        
        # Build update query dynamically
        updates = []
        values = []
        
        if item.original_word is not None:
            updates.append("original_word = ?")
            values.append(item.original_word)
        if item.translation is not None:
            updates.append("translation = ?")
            values.append(item.translation)
        if item.context_sentence is not None:
            updates.append("context_sentence = ?")
            values.append(item.context_sentence)
        if item.mastery is not None:
            updates.append("mastery = ?")
            values.append(item.mastery)
        
        if updates:
            updates.append("updated_at = ?")
            values.append(datetime.now().isoformat())
            values.append(item_id)
            
            cursor.execute(
                f"UPDATE vocabulary SET {', '.join(updates)} WHERE id = ?",
                values
            )
        
        # Fetch and return updated item
        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        
        return VocabularyResponse(
            id=row["id"],
            original_word=row["original_word"],
            translation=row["translation"],
            context_sentence=row["context_sentence"],
            video_id=row["video_id"],
            video_title=row["video_title"],
            language=row["language"] or "en",
            mastery=row["mastery"] or 0,
            timestamp=datetime.fromisoformat(row["timestamp"]) if row["timestamp"] else datetime.now(),
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(),
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now()
        )


@router.delete("/vocabulary/{item_id}")
async def delete_vocabulary(item_id: int):
    """Delete a vocabulary item"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute("SELECT id FROM vocabulary WHERE id = ?", (item_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Vocabulary item not found")
        
        cursor.execute("DELETE FROM vocabulary WHERE id = ?", (item_id,))
        
        return {"message": "Vocabulary item deleted", "id": item_id}


@router.get("/vocabulary/stats/summary")
async def get_vocabulary_stats():
    """Get vocabulary statistics"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total count
        cursor.execute("SELECT COUNT(*) as count FROM vocabulary")
        total = cursor.fetchone()["count"]
        
        # Today's count
        cursor.execute(
            "SELECT COUNT(*) as count FROM vocabulary WHERE DATE(timestamp) = DATE('now')"
        )
        today = cursor.fetchone()["count"]
        
        # This week's count
        cursor.execute(
            "SELECT COUNT(*) as count FROM vocabulary WHERE timestamp >= DATE('now', '-7 days')"
        )
        week = cursor.fetchone()["count"]
        
        # Average mastery
        cursor.execute("SELECT AVG(mastery) as avg FROM vocabulary")
        avg_mastery = cursor.fetchone()["avg"] or 0
        
        return {
            "total_words": total,
            "today_words": today,
            "week_words": week,
            "average_mastery": round(avg_mastery, 1)
        }
