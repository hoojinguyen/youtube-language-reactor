import { SubtitleSegment, SubtitleWord } from '@/types';

// ============================================
// YouTube Subtitle Extractor
// ============================================

/**
 * Extracts subtitles from YouTube's internal player data
 */
export class SubtitleExtractor {
    private videoId: string | null = null;
    private subtitles: SubtitleSegment[] = [];

    /**
     * Get the current video ID from the URL
     */
    getVideoId(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    /**
     * Check if we're on a YouTube video page
     */
    isVideoPage(): boolean {
        return window.location.pathname === '/watch' && !!this.getVideoId();
    }

    /**
     * Extract subtitles from YouTube's player response
     */
    async extractSubtitles(language?: string): Promise<SubtitleSegment[]> {
        try {
            this.videoId = this.getVideoId();
            if (!this.videoId) {
                throw new Error('No video ID found');
            }

            // Try to get captions from ytInitialPlayerResponse
            let playerResponse = this.getPlayerResponse();

            // If no player response found, or no captions in it, try fetching the page source
            if (!playerResponse || !this.hasCaptions(playerResponse)) {
                console.log('⚠️ Primary method failed, trying fallback fetch...');
                playerResponse = await this.fetchPlayerResponseFallback(this.videoId);
            }

            if (!playerResponse) {
                throw new Error('Could not find player response');
            }

            const captionTracks = this.getCaptionTracks(playerResponse);
            if (!captionTracks || captionTracks.length === 0) {
                console.warn('Captions object structure:', JSON.stringify(playerResponse.captions || 'None'));
                throw new Error('No caption tracks available');
            }

            // Find the desired language or use the first available
            let track = language
                ? captionTracks.find((t: CaptionTrack) => t.languageCode === language)
                : captionTracks[0];

            if (!track) {
                track = captionTracks[0];
            }

            // Fetch and parse the subtitle file
            const subtitleUrl = track.baseUrl;
            const subtitleXml = await this.fetchSubtitles(subtitleUrl);
            this.subtitles = this.parseXml(subtitleXml);

            return this.subtitles;
        } catch (error) {
            console.error('Error extracting subtitles:', error);
            return [];
        }
    }

    /**
     * Get available language codes for subtitles
     */
    getAvailableLanguages(): string[] {
        try {
            const playerResponse = this.getPlayerResponse();
            if (!playerResponse) return [];

            const captionTracks = this.getCaptionTracks(playerResponse);
            if (!captionTracks) return [];

            return captionTracks.map((track: CaptionTrack) => track.languageCode);
        } catch (error) {
            console.error('Error getting available languages:', error);
            return [];
        }
    }

    /**
     * Get the YouTube player response object from the page
     */
    private getPlayerResponse(): PlayerResponse | null {
        // Method 1: Try to get from window object (only works if not isolated, but worth checking)
        const win = window as WindowWithYT;
        if (win.ytInitialPlayerResponse) {
            console.log('Found ytInitialPlayerResponse in window');
            return win.ytInitialPlayerResponse;
        }

        // Method 2: Try to parse from script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || '';
            if (content.includes('ytInitialPlayerResponse')) {
                // Use [\s\S] to match newlines, look for the variable assignment
                const match = content.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
                if (match && match[1]) {
                    try {
                        const json = JSON.parse(match[1]);
                        if (json.captions) {
                            console.log('✅ Valid player response found');
                            return json;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        }

        // Method 3: Try to get from ytplayer config
        if (win.ytplayer?.config?.args?.raw_player_response) {
            return win.ytplayer.config.args.raw_player_response;
        }

        console.warn('Could not find ytInitialPlayerResponse via any method');
        return null;
    }

    /**
     * Extract caption tracks from player response
     */
    private getCaptionTracks(playerResponse: PlayerResponse): CaptionTrack[] | null {
        try {
            return playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || null;
        } catch {
            return null;
        }
    }

    /**
     * Fetch subtitle XML from URL
     */
    private async fetchSubtitles(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitles: ${response.status}`);
        }
        return response.text();
    }

    /**
     * Parse YouTube subtitle XML format
     */
    private parseXml(xmlString: string): SubtitleSegment[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');
        const textElements = doc.querySelectorAll('text');

        const segments: SubtitleSegment[] = [];

        textElements.forEach((element, index) => {
            const start = parseFloat(element.getAttribute('start') || '0');
            const duration = parseFloat(element.getAttribute('dur') || '0');
            const text = this.decodeHtmlEntities(element.textContent || '');

            segments.push({
                id: `segment-${index}`,
                startTime: start,
                endTime: start + duration,
                text: text,
                words: this.splitIntoWords(text, `segment-${index}`),
            });
        });

        return segments;
    }

    /**
     * Split text into individual words for hover functionality
     */
    private splitIntoWords(text: string, segmentId: string): SubtitleWord[] {
        const words: SubtitleWord[] = [];
        // Split by whitespace but keep track of positions
        const regex = /\S+/g;
        let match;
        let wordIndex = 0;

        while ((match = regex.exec(text)) !== null) {
            words.push({
                id: `${segmentId}-word-${wordIndex}`,
                text: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
            });
            wordIndex++;
        }

        return words;
    }

    /**
     * Decode HTML entities in subtitle text
     */
    private decodeHtmlEntities(text: string): string {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    /**
     * Get the current subtitle segment based on video time
     */
    getCurrentSegment(currentTime: number): SubtitleSegment | null {
        return this.subtitles.find(
            segment => currentTime >= segment.startTime && currentTime < segment.endTime
        ) || null;
    }

    /**
     * Get all subtitles
     */
    getSubtitles(): SubtitleSegment[] {
        return this.subtitles;
    }

    /**
     * Check if player response has captions
     */
    private hasCaptions(response: PlayerResponse): boolean {
        return !!response?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length;
    }

    /**
     * Fallback: Fetch the video page to find ytInitialPlayerResponse
     */
    private async fetchPlayerResponseFallback(videoId: string): Promise<PlayerResponse | null> {
        try {
            console.log('🔄 Fetching video page for fallback extraction...');
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const text = await response.text();

            // Look for ytInitialPlayerResponse in the fetched HTML
            const match = text.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
            if (match && match[1]) {
                try {
                    const json = JSON.parse(match[1]);
                    if (this.hasCaptions(json)) {
                        console.log('✅ Fallback fetch found valid captions!');
                        return json;
                    }
                } catch (e) {
                    // ignore parse error
                }
            }
            return null;
        } catch (error) {
            console.error('Fallback fetch failed:', error);
            return null;
        }
    }
}

// Type definitions for YouTube's internal APIs
interface CaptionTrack {
    baseUrl: string;
    languageCode: string;
    name?: { simpleText: string };
    vssId?: string;
}

interface PlayerResponse {
    captions?: {
        playerCaptionsTracklistRenderer?: {
            captionTracks?: CaptionTrack[];
        };
    };
}

interface WindowWithYT extends Window {
    ytInitialPlayerResponse?: PlayerResponse;
    ytplayer?: {
        config?: {
            args?: {
                raw_player_response?: PlayerResponse;
            };
        };
    };
}

// Export a singleton instance
export const subtitleExtractor = new SubtitleExtractor();
