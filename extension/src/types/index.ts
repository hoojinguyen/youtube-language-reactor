// ============================================
// Core Types for YouTube Language Reactor Lite
// ============================================

/**
 * Represents a single subtitle/caption segment
 */
export interface SubtitleSegment {
    id: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
    text: string;
    words: SubtitleWord[];
}

/**
 * Represents a single word within a subtitle segment
 */
export interface SubtitleWord {
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
}

/**
 * Represents a saved vocabulary item
 */
export interface VocabularyItem {
    id: number;
    originalWord: string;
    translation: string;
    contextSentence: string;
    videoId: string;
    videoTitle?: string;
    timestamp: string; // ISO date string
    language?: string;
    mastery?: number; // 0-100 for future SRS
}

/**
 * Translation request/response types
 */
export interface TranslationRequest {
    word: string;
    contextSentence?: string;
    sourceLanguage?: string;
    targetLanguage: string;
}

export interface TranslationResponse {
    word: string;
    translation: string;
    language: string;
    pronunciation?: string;
    partOfSpeech?: string;
    definitions?: string[];
}

/**
 * Extension settings
 */
export interface ExtensionSettings {
    enabled: boolean;
    targetLanguage: string; // User's native language for translations
    sourceLanguage: string; // Language they're learning
    showDualSubtitles: boolean;
    autoShowTranslation: boolean;
    subtitleFontSize: number; // in pixels
    subtitlePosition: 'bottom' | 'top';
    overlayOpacity: number; // 0-1
    apiEndpoint: string;
}

/**
 * Default extension settings
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
    enabled: true,
    targetLanguage: 'vi', // Vietnamese
    sourceLanguage: 'en', // English
    showDualSubtitles: true,
    autoShowTranslation: false,
    subtitleFontSize: 18,
    subtitlePosition: 'bottom',
    overlayOpacity: 0.9,
    apiEndpoint: 'http://localhost:5001',
};

/**
 * Message types for communication between extension components
 */
export type MessageType =
    | 'GET_TRANSLATION'
    | 'SAVE_VOCABULARY'
    | 'GET_VOCABULARY'
    | 'DELETE_VOCABULARY'
    | 'GET_SETTINGS'
    | 'UPDATE_SETTINGS'
    | 'TOGGLE_EXTENSION'
    | 'GET_STATS';

export interface ExtensionMessage<T = unknown> {
    type: MessageType;
    payload?: T;
}

export interface ExtensionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Stats for the popup display
 */
export interface ExtensionStats {
    totalWords: number;
    todayWords: number;
    weekWords: number;
    lastSaved?: VocabularyItem;
}

/**
 * YouTube video info
 */
export interface VideoInfo {
    videoId: string;
    title: string;
    channelName: string;
    duration: number;
    hasSubtitles: boolean;
    availableLanguages: string[];
}
