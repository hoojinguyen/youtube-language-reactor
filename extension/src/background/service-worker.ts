import {
    ExtensionMessage,
    ExtensionResponse,
    TranslationRequest,
    VocabularyItem,
    ExtensionSettings
} from '@/types';
import {
    getVocabulary,
    saveVocabularyItem,
    deleteVocabularyItem,
    getSettings,
    updateSettings,
    getCachedTranslation,
    cacheTranslation,
    getStats
} from '@/utils/storage';
import { translateWord, checkApiHealth, setApiEndpoint } from '@/utils/api';

// ============================================
// Service Worker (Background Script)
// ============================================

console.log('🔧 YouTube Language Reactor Lite: Service Worker started');

// Initialize settings
let currentSettings: ExtensionSettings | null = null;

async function initializeSettings(): Promise<void> {
    currentSettings = await getSettings();
    setApiEndpoint(currentSettings.apiEndpoint);
    console.log('Settings loaded:', currentSettings);
}

initializeSettings();

// ============================================
// Message Handler
// ============================================

chrome.runtime.onMessage.addListener(
    (
        message: ExtensionMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: ExtensionResponse) => void
    ) => {
        // Handle messages asynchronously
        handleMessage(message)
            .then(sendResponse)
            .catch((error) => {
                console.error('Message handler error:', error);
                sendResponse({ success: false, error: error.message });
            });

        // Return true to indicate async response
        return true;
    }
);

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    console.log('📬 Received message:', message.type);

    switch (message.type) {
        case 'GET_TRANSLATION':
            return handleGetTranslation(message.payload as TranslationRequest);

        case 'SAVE_VOCABULARY':
            return handleSaveVocabulary(message.payload as Omit<VocabularyItem, 'id'>);

        case 'GET_VOCABULARY':
            return handleGetVocabulary();

        case 'DELETE_VOCABULARY':
            return handleDeleteVocabulary(message.payload as { id: number });

        case 'GET_SETTINGS':
            return handleGetSettings();

        case 'UPDATE_SETTINGS':
            return handleUpdateSettings(message.payload as Partial<ExtensionSettings>);

        case 'TOGGLE_EXTENSION':
            return handleToggleExtension(message.payload as { enabled: boolean });

        case 'GET_STATS':
            return handleGetStats();

        default:
            return { success: false, error: `Unknown message type: ${message.type}` };
    }
}

// ============================================
// Message Handlers
// ============================================

async function handleGetTranslation(request: TranslationRequest): Promise<ExtensionResponse> {
    const settings = await getSettings();

    // Clean the word (remove punctuation)
    const cleanWord = request.word.replace(/[^\w\s]/g, '').trim().toLowerCase();

    // Check cache first
    const cached = await getCachedTranslation(cleanWord);
    if (cached) {
        console.log('📦 Translation from cache:', cleanWord);
        return {
            success: true,
            data: {
                word: cleanWord,
                translation: cached,
                language: settings.targetLanguage,
            },
        };
    }

    // Request translation from API
    const translation = await translateWord({
        word: cleanWord,
        contextSentence: request.contextSentence,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
    });

    // Cache the result
    if (translation.translation && !translation.translation.startsWith('[')) {
        await cacheTranslation(cleanWord, translation.translation);
    }

    return { success: true, data: translation };
}

async function handleSaveVocabulary(
    item: Omit<VocabularyItem, 'id'>
): Promise<ExtensionResponse> {
    const savedItem = await saveVocabularyItem(item);
    console.log('💾 Vocabulary saved:', savedItem);
    return { success: true, data: savedItem };
}

async function handleGetVocabulary(): Promise<ExtensionResponse> {
    const vocabulary = await getVocabulary();
    return { success: true, data: vocabulary };
}

async function handleDeleteVocabulary(payload: { id: number }): Promise<ExtensionResponse> {
    const success = await deleteVocabularyItem(payload.id);
    return { success };
}

async function handleGetSettings(): Promise<ExtensionResponse> {
    const settings = await getSettings();
    return { success: true, data: settings };
}

async function handleUpdateSettings(
    newSettings: Partial<ExtensionSettings>
): Promise<ExtensionResponse> {
    const settings = await updateSettings(newSettings);
    currentSettings = settings;

    // Update API endpoint if changed
    if (newSettings.apiEndpoint) {
        setApiEndpoint(newSettings.apiEndpoint);
    }

    return { success: true, data: settings };
}

async function handleToggleExtension(payload: { enabled: boolean }): Promise<ExtensionResponse> {
    await updateSettings({ enabled: payload.enabled });

    // Notify active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: 'TOGGLE_EXTENSION',
                payload: { enabled: payload.enabled },
            });
        } catch {
            // Tab might not have content script
        }
    }

    return { success: true };
}

async function handleGetStats(): Promise<ExtensionResponse> {
    const stats = await getStats();
    return { success: true, data: stats };
}

// ============================================
// Extension Icon Badge
// ============================================

async function updateBadge(): Promise<void> {
    const stats = await getStats();
    const text = stats.totalWords > 0 ? stats.totalWords.toString() : '';

    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
}

// Update badge periodically
setInterval(updateBadge, 30000);

// ============================================
// API Health Check
// ============================================

async function checkApi(): Promise<void> {
    const healthy = await checkApiHealth();
    console.log(`🏥 API health: ${healthy ? 'OK' : 'OFFLINE'}`);
}

// Check API on startup
checkApi();

// ============================================
// Installation Handler
// ============================================

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('🎉 Extension installed!');

        // Initialize default settings
        await initializeSettings();

        // Open options page for initial setup
        chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
        console.log('🔄 Extension updated to version:', chrome.runtime.getManifest().version);
    }
});
