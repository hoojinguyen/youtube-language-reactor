"""
Translation API routes
"""

from fastapi import APIRouter, HTTPException
from app.models.vocabulary import TranslationRequest, TranslationResponse
from app.database import get_db

router = APIRouter()

from deep_translator import GoogleTranslator

# Initialize translator
# We'll instantiate it per request or cached based on source/target pair

def translate_word(word: str, source_language: str = "en", target_language: str = "vi") -> str:
    """
    Translate a word using Google Translate via deep-translator.
    """
    word_clean = word.strip()
    if not word_clean:
        return ""
        
    try:
        translator = GoogleTranslator(source=source_language, target=target_language)
        translation = translator.translate(word_clean)
        return translation
    except Exception as e:
        print(f"Translation error: {e}")
        return f"[{word}]" # Fallback on error


def get_cached_translation(word: str, target_language: str) -> str | None:
    """Check if translation is cached in database"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT translation FROM translation_cache 
            WHERE word = ? AND target_language = ?
            """,
            (word.lower(), target_language)
        )
        result = cursor.fetchone()
        return result["translation"] if result else None


def cache_translation(word: str, translation: str, source_language: str, target_language: str):
    """Save translation to cache"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO translation_cache 
            (word, translation, source_language, target_language)
            VALUES (?, ?, ?, ?)
            """,
            (word.lower(), translation, source_language, target_language)
        )


@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """
    Translate a word to the target language.
    First checks the cache, then uses the translation service.
    """
    word = request.word.strip().lower()
    
    if not word:
        raise HTTPException(status_code=400, detail="Word is required")
    
    # Check cache first
    cached = get_cached_translation(word, request.target_language)
    if cached:
        return TranslationResponse(
            word=word,
            translation=cached,
            language=request.target_language,
            cached=True
        )
    
    # Translate
    translation = translate_word(word, request.source_language, request.target_language)
    
    # Cache the result if it's a real translation (not a placeholder)
    if not translation.startswith("["):
        cache_translation(
            word, 
            translation, 
            request.source_language, 
            request.target_language
        )
    
    return TranslationResponse(
        word=word,
        translation=translation,
        language=request.target_language,
        cached=False
    )


@router.get("/translate/{word}")
async def translate_get(word: str, target_language: str = "vi"):
    """GET endpoint for quick translation lookups"""
    request = TranslationRequest(word=word, target_language=target_language)
    return await translate(request)
