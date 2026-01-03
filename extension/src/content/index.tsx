import './content.css';
import { subtitleExtractor } from './SubtitleExtractor';
import { subtitleOverlayManager } from './SubtitleOverlay';
import { SubtitleWord, SubtitleSegment, TranslationResponse, VocabularyItem } from '@/types';

// ============================================
// Content Script Entry Point
// ============================================

console.log('🎬 YouTube Language Reactor Lite: Content script loaded');

class YouTubeLanguageReactor {
  private isInitialized = false;
  private currentVideoId: string | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the extension
   */
  private async init(): Promise<void> {
    // Wait for the page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onPageReady());
    } else {
      await this.onPageReady();
    }

    // Listen for navigation events (YouTube SPA)
    this.setupNavigationListener();
    
    // Listen for messages from background script
    this.setupMessageListener();
  }

  /**
   * Called when the page is ready
   */
  private async onPageReady(): Promise<void> {
    console.log('📄 Page ready, checking if on video page...');
    await this.checkAndInitialize();
  }

  /**
   * Check if we're on a video page and initialize if so
   */
  private async checkAndInitialize(): Promise<void> {
    if (!subtitleExtractor.isVideoPage()) {
      console.log('📺 Not on a video page, waiting...');
      this.cleanup();
      return;
    }

    const videoId = subtitleExtractor.getVideoId();
    if (videoId === this.currentVideoId && this.isInitialized) {
      console.log('📺 Same video, already initialized');
      return;
    }

    this.currentVideoId = videoId;
    console.log(`📺 Video detected: ${videoId}`);

    // Wait a bit for YouTube to fully load the player
    await this.waitForPlayer();
    
    await this.initializeForVideo();
  }

  /**
   * Wait for the YouTube player to be ready
   */
  private waitForPlayer(): Promise<void> {
    return new Promise((resolve) => {
      const checkPlayer = () => {
        const player = document.querySelector('#movie_player');
        const video = document.querySelector('video');
        if (player && video) {
          resolve();
        } else {
          setTimeout(checkPlayer, 500);
        }
      };
      checkPlayer();
    });
  }

  /**
   * Initialize the extension for the current video
   */
  private async initializeForVideo(): Promise<void> {
    try {
      // Extract subtitles
      console.log('📝 Extracting subtitles...');
      const subtitles = await subtitleExtractor.extractSubtitles();
      
      if (subtitles.length === 0) {
        console.log('❌ No subtitles found for this video');
        this.showNoSubtitlesMessage();
        return;
      }

      console.log(`✅ Found ${subtitles.length} subtitle segments`);

      // Initialize overlay
      const overlayInitialized = subtitleOverlayManager.initialize();
      if (!overlayInitialized) {
        console.error('❌ Failed to initialize overlay');
        return;
      }

      // Set subtitles
      subtitleOverlayManager.setSubtitles(subtitles);

      // Set up callbacks
      subtitleOverlayManager.setOnTranslationRequest(this.handleTranslationRequest.bind(this));
      subtitleOverlayManager.setOnWordSave(this.handleWordSave.bind(this));

      this.isInitialized = true;
      console.log('🎉 YouTube Language Reactor initialized successfully!');

    } catch (error) {
      console.error('❌ Error initializing:', error);
    }
  }

  /**
   * Handle translation request from overlay
   */
  private async handleTranslationRequest(word: SubtitleWord, segment: SubtitleSegment): Promise<void> {
    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TRANSLATION',
        payload: {
          word: word.text,
          contextSentence: segment.text,
        },
      });

      if (response.success && response.data) {
        subtitleOverlayManager.setTranslation(response.data as TranslationResponse);
      }
    } catch (error) {
      console.error('Translation request failed:', error);
    }
  }

  /**
   * Handle word save from overlay
   */
  private async handleWordSave(word: SubtitleWord, segment: SubtitleSegment): Promise<void> {
    try {
      // Get current translation
      const translationResponse = await chrome.runtime.sendMessage({
        type: 'GET_TRANSLATION',
        payload: {
          word: word.text,
          contextSentence: segment.text,
        },
      });

      const translation = translationResponse.data as TranslationResponse;

      // Save to vocabulary
      const vocabularyItem: Omit<VocabularyItem, 'id'> = {
        originalWord: word.text,
        translation: translation?.translation || '',
        contextSentence: segment.text,
        videoId: this.currentVideoId || '',
        videoTitle: this.getVideoTitle(),
        timestamp: new Date().toISOString(),
      };

      const saveResponse = await chrome.runtime.sendMessage({
        type: 'SAVE_VOCABULARY',
        payload: vocabularyItem,
      });

      if (saveResponse.success) {
        this.showSaveNotification(word.text);
      }
    } catch (error) {
      console.error('Save word failed:', error);
    }
  }

  /**
   * Get the current video title
   */
  private getVideoTitle(): string {
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string');
    return titleElement?.textContent || 'Unknown Video';
  }

  /**
   * Show a notification when a word is saved
   */
  private showSaveNotification(word: string): void {
    const toast = document.createElement('div');
    toast.className = 'ylr-toast';
    toast.textContent = `✓ Saved "${word}" to vocabulary`;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * Show message when no subtitles are available
   */
  private showNoSubtitlesMessage(): void {
    console.log('No subtitles available for this video');
    // Could show a UI notification here
  }

  /**
   * Setup listener for YouTube's SPA navigation
   */
  private setupNavigationListener(): void {
    // YouTube uses pushState for navigation
    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      setTimeout(() => this.checkAndInitialize(), 1000);
    };

    // Also listen for popstate
    window.addEventListener('popstate', () => {
      setTimeout(() => this.checkAndInitialize(), 1000);
    });

    // Watch for URL changes via MutationObserver
    this.observer = new MutationObserver(() => {
      const newVideoId = subtitleExtractor.getVideoId();
      if (newVideoId !== this.currentVideoId) {
        this.checkAndInitialize();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup message listener for background script communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'TOGGLE_EXTENSION') {
        subtitleOverlayManager.setEnabled(message.payload.enabled);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Cleanup when leaving a video page
   */
  private cleanup(): void {
    this.isInitialized = false;
    subtitleOverlayManager.destroy();
  }
}

// Initialize the content script
new YouTubeLanguageReactor();
