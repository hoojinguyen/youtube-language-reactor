"""
Translation API routes
"""

from fastapi import APIRouter, HTTPException
from app.models.vocabulary import TranslationRequest, TranslationResponse
from app.database import get_db

router = APIRouter()

# Simple translation dictionary for demo purposes
# In production, integrate with Google Translate, DeepL, or LibreTranslate
DEMO_TRANSLATIONS = {
    # Common English words to Vietnamese
    "hello": "xin chào",
    "world": "thế giới",
    "thank": "cảm ơn",
    "thanks": "cảm ơn",
    "you": "bạn",
    "love": "yêu",
    "friend": "bạn bè",
    "good": "tốt",
    "bad": "xấu",
    "yes": "vâng",
    "no": "không",
    "please": "làm ơn",
    "sorry": "xin lỗi",
    "help": "giúp đỡ",
    "time": "thời gian",
    "day": "ngày",
    "night": "đêm",
    "water": "nước",
    "food": "thức ăn",
    "house": "nhà",
    "work": "công việc",
    "school": "trường học",
    "book": "sách",
    "learn": "học",
    "speak": "nói",
    "listen": "nghe",
    "read": "đọc",
    "write": "viết",
    "understand": "hiểu",
    "know": "biết",
    "think": "nghĩ",
    "want": "muốn",
    "need": "cần",
    "like": "thích",
    "see": "thấy",
    "come": "đến",
    "go": "đi",
    "make": "làm",
    "take": "lấy",
    "give": "cho",
    "find": "tìm",
    "tell": "kể",
    "ask": "hỏi",
    "use": "dùng",
    "feel": "cảm thấy",
    "try": "thử",
    "leave": "rời",
    "call": "gọi",
    "keep": "giữ",
    "let": "để",
    "begin": "bắt đầu",
    "seem": "dường như",
    "show": "cho xem",
    "hear": "nghe",
    "play": "chơi",
    "run": "chạy",
    "move": "di chuyển",
    "live": "sống",
    "believe": "tin",
    "hold": "giữ",
    "bring": "mang",
    "happen": "xảy ra",
    "write": "viết",
    "provide": "cung cấp",
    "sit": "ngồi",
    "stand": "đứng",
    "lose": "mất",
    "pay": "trả",
    "meet": "gặp",
    "include": "bao gồm",
    "continue": "tiếp tục",
    "set": "đặt",
    "learn": "học",
    "change": "thay đổi",
    "lead": "dẫn",
    "understand": "hiểu",
    "watch": "xem",
    "follow": "theo",
    "stop": "dừng",
    "create": "tạo",
    "speak": "nói",
    "read": "đọc",
    "allow": "cho phép",
    "add": "thêm",
    "spend": "tiêu",
    "grow": "lớn lên",
    "open": "mở",
    "walk": "đi bộ",
    "win": "thắng",
    "offer": "đề nghị",
    "remember": "nhớ",
    "consider": "xem xét",
    "appear": "xuất hiện",
    "buy": "mua",
    "wait": "đợi",
    "serve": "phục vụ",
    "die": "chết",
    "send": "gửi",
    "expect": "mong đợi",
    "build": "xây dựng",
    "stay": "ở lại",
    "fall": "rơi",
    "cut": "cắt",
    "reach": "đạt",
    "kill": "giết",
    "remain": "còn lại",
}


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


def translate_word(word: str, target_language: str = "vi") -> str:
    """
    Translate a word using the demo dictionary.
    In production, replace this with a real translation API.
    """
    word_lower = word.lower().strip()
    
    # Check demo dictionary
    if word_lower in DEMO_TRANSLATIONS:
        return DEMO_TRANSLATIONS[word_lower]
    
    # Return placeholder for unknown words
    return f"[{word}]"


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
    translation = translate_word(word, request.target_language)
    
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
