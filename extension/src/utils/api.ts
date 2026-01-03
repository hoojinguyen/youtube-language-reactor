import {
    TranslationRequest,
    TranslationResponse,
    VocabularyItem,
    DEFAULT_SETTINGS
} from '@/types';

// ============================================
// API Client for Local Backend
// ============================================

let apiEndpoint = DEFAULT_SETTINGS.apiEndpoint;

/**
 * Set the API endpoint (called when settings change)
 */
export function setApiEndpoint(endpoint: string): void {
    apiEndpoint = endpoint;
}

/**
 * Check if the API server is healthy
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${apiEndpoint}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}

/**
 * Translate a word using the local API
 */
export async function translateWord(request: TranslationRequest): Promise<TranslationResponse> {
    try {
        const response = await fetch(`${apiEndpoint}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: request.word,
                context: request.contextSentence,
                source_language: request.sourceLanguage || 'en',
                target_language: request.targetLanguage,
            }),
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            word: data.word,
            translation: data.translation,
            language: data.language || request.targetLanguage,
            pronunciation: data.pronunciation,
            partOfSpeech: data.part_of_speech,
            definitions: data.definitions,
        };
    } catch (error) {
        console.error('Translation error:', error);
        // Return a fallback response
        return {
            word: request.word,
            translation: `[${request.word}]`, // Placeholder when API is unavailable
            language: request.targetLanguage,
        };
    }
}

/**
 * Save vocabulary to the backend (for future sync)
 */
export async function saveVocabularyToBackend(item: Omit<VocabularyItem, 'id'>): Promise<VocabularyItem | null> {
    try {
        const response = await fetch(`${apiEndpoint}/api/vocabulary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_word: item.originalWord,
                translation: item.translation,
                context_sentence: item.contextSentence,
                video_id: item.videoId,
                video_title: item.videoTitle,
            }),
        });

        if (!response.ok) {
            throw new Error(`Vocabulary API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            originalWord: data.original_word,
            translation: data.translation,
            contextSentence: data.context_sentence,
            videoId: data.video_id,
            videoTitle: data.video_title,
            timestamp: data.timestamp,
        };
    } catch (error) {
        console.error('Save vocabulary error:', error);
        return null;
    }
}

/**
 * Get all vocabulary from the backend
 */
export async function getVocabularyFromBackend(): Promise<VocabularyItem[]> {
    try {
        const response = await fetch(`${apiEndpoint}/api/vocabulary`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Vocabulary API error: ${response.status}`);
        }

        const data = await response.json();
        return data.map((item: Record<string, unknown>) => ({
            id: item.id,
            originalWord: item.original_word,
            translation: item.translation,
            contextSentence: item.context_sentence,
            videoId: item.video_id,
            videoTitle: item.video_title,
            timestamp: item.timestamp,
        }));
    } catch (error) {
        console.error('Get vocabulary error:', error);
        return [];
    }
}

/**
 * Delete vocabulary from the backend
 */
export async function deleteVocabularyFromBackend(id: number): Promise<boolean> {
    try {
        const response = await fetch(`${apiEndpoint}/api/vocabulary/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        return response.ok;
    } catch (error) {
        console.error('Delete vocabulary error:', error);
        return false;
    }
}
