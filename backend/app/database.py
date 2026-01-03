"""
Database configuration and initialization using SQLite
"""

import sqlite3
from pathlib import Path
from contextlib import contextmanager

# Database file path
DB_PATH = Path(__file__).parent.parent / "data" / "vocabulary.db"


def get_db_connection():
    """Create a database connection"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_db():
    """Initialize the database with required tables"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create vocabulary table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_word TEXT NOT NULL,
                translation TEXT NOT NULL,
                context_sentence TEXT,
                video_id TEXT,
                video_title TEXT,
                language TEXT DEFAULT 'en',
                mastery INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create translation cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS translation_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL UNIQUE,
                translation TEXT NOT NULL,
                source_language TEXT DEFAULT 'en',
                target_language TEXT DEFAULT 'vi',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create index for faster lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_vocabulary_word 
            ON vocabulary(original_word)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_cache_word 
            ON translation_cache(word)
        """)
        
        print("✅ Database initialized successfully")


def reset_db():
    """Reset the database (for development)"""
    if DB_PATH.exists():
        DB_PATH.unlink()
    init_db()
    print("🔄 Database reset complete")
