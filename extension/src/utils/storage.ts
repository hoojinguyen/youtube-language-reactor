import {
    VocabularyItem,
    ExtensionSettings,
    DEFAULT_SETTINGS,
    ExtensionStats
} from '@/types';

// ============================================
// Chrome Storage Utilities
// ============================================

const STORAGE_KEYS = {
    VOCABULARY: 'vocabulary',
    SETTINGS: 'settings',
    TRANSLATION_CACHE: 'translationCache',
} as const;

/**
 * Get vocabulary items from storage
 */
export async function getVocabulary(): Promise<VocabularyItem[]> {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.VOCABULARY);
        return result[STORAGE_KEYS.VOCABULARY] || [];
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        return [];
    }
}

/**
 * Save a new vocabulary item
 */
export async function saveVocabularyItem(item: Omit<VocabularyItem, 'id'>): Promise<VocabularyItem> {
    const vocabulary = await getVocabulary();

    // Check if word already exists
    const existingIndex = vocabulary.findIndex(
        v => v.originalWord.toLowerCase() === item.originalWord.toLowerCase()
    );

    const newItem: VocabularyItem = {
        ...item,
        id: existingIndex >= 0 ? vocabulary[existingIndex].id : Date.now(),
        timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        // Update existing
        vocabulary[existingIndex] = newItem;
    } else {
        // Add new
        vocabulary.push(newItem);
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.VOCABULARY]: vocabulary });
    return newItem;
}

/**
 * Delete a vocabulary item by ID
 */
export async function deleteVocabularyItem(id: number): Promise<boolean> {
    try {
        const vocabulary = await getVocabulary();
        const filtered = vocabulary.filter(v => v.id !== id);
        await chrome.storage.local.set({ [STORAGE_KEYS.VOCABULARY]: filtered });
        return true;
    } catch (error) {
        console.error('Error deleting vocabulary item:', error);
        return false;
    }
}

/**
 * Clear all vocabulary
 */
export async function clearVocabulary(): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.VOCABULARY]: [] });
}

/**
 * Get extension settings
 */
export async function getSettings(): Promise<ExtensionSettings> {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
    } catch (error) {
        console.error('Error getting settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Update extension settings
 */
export async function updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: newSettings });
    return newSettings;
}

/**
 * Get cached translation
 */
export async function getCachedTranslation(word: string): Promise<string | null> {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.TRANSLATION_CACHE);
        const cache = result[STORAGE_KEYS.TRANSLATION_CACHE] || {};
        return cache[word.toLowerCase()] || null;
    } catch (error) {
        console.error('Error getting cached translation:', error);
        return null;
    }
}

/**
 * Cache a translation
 */
export async function cacheTranslation(word: string, translation: string): Promise<void> {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.TRANSLATION_CACHE);
        const cache = result[STORAGE_KEYS.TRANSLATION_CACHE] || {};
        cache[word.toLowerCase()] = translation;
        await chrome.storage.local.set({ [STORAGE_KEYS.TRANSLATION_CACHE]: cache });
    } catch (error) {
        console.error('Error caching translation:', error);
    }
}

/**
 * Get extension statistics
 */
export async function getStats(): Promise<ExtensionStats> {
    const vocabulary = await getVocabulary();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    const todayWords = vocabulary.filter(v => new Date(v.timestamp).getTime() >= todayStart).length;
    const weekWords = vocabulary.filter(v => new Date(v.timestamp).getTime() >= weekStart).length;

    // Sort by timestamp to get the last saved
    const sorted = [...vocabulary].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
        totalWords: vocabulary.length,
        todayWords,
        weekWords,
        lastSaved: sorted[0],
    };
}

/**
 * Export vocabulary to CSV
 */
export async function exportVocabularyToCSV(): Promise<string> {
    const vocabulary = await getVocabulary();

    const headers = ['Word', 'Translation', 'Context', 'Video ID', 'Date'];
    const rows = vocabulary.map(v => [
        v.originalWord,
        v.translation,
        v.contextSentence,
        v.videoId,
        new Date(v.timestamp).toLocaleDateString(),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
}
