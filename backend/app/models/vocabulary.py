"""
Pydantic models for vocabulary data
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VocabularyBase(BaseModel):
    """Base vocabulary model"""
    original_word: str
    translation: str
    context_sentence: Optional[str] = None
    video_id: Optional[str] = None
    video_title: Optional[str] = None
    language: Optional[str] = "en"


class VocabularyCreate(VocabularyBase):
    """Model for creating vocabulary items"""
    pass


class VocabularyUpdate(BaseModel):
    """Model for updating vocabulary items"""
    original_word: Optional[str] = None
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    mastery: Optional[int] = None


class VocabularyResponse(VocabularyBase):
    """Model for vocabulary responses"""
    id: int
    mastery: int = 0
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranslationRequest(BaseModel):
    """Model for translation requests"""
    word: str
    context: Optional[str] = None
    source_language: str = "en"
    target_language: str = "vi"


class TranslationResponse(BaseModel):
    """Model for translation responses"""
    word: str
    translation: str
    language: str
    pronunciation: Optional[str] = None
    part_of_speech: Optional[str] = None
    definitions: Optional[list[str]] = None
    cached: bool = False
