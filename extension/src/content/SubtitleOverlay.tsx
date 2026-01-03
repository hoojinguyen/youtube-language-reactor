import React, { useState, useCallback, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SubtitleSegment, SubtitleWord, TranslationResponse } from '@/types';

// ============================================
// Subtitle Overlay Component
// ============================================

interface SubtitleOverlayProps {
  segments: SubtitleSegment[];
  currentTime: number;
  onWordHover: (word: SubtitleWord, segment: SubtitleSegment) => void;
  onWordClick: (word: SubtitleWord, segment: SubtitleSegment) => void;
  onWordLeave: () => void;
  translation: TranslationResponse | null;
  hoveredWord: SubtitleWord | null;
  isEnabled: boolean;
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  segments,
  currentTime,
  onWordHover,
  onWordClick,
  onWordLeave,
  translation,
  hoveredWord,
  isEnabled,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the current subtitle segment based on video time
  const currentSegment = segments.find(
    segment => currentTime >= segment.startTime && currentTime < segment.endTime
  );

  // Handle word hover with tooltip positioning
  const handleWordHover = useCallback(
    (e: React.MouseEvent, word: SubtitleWord, segment: SubtitleSegment) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      onWordHover(word, segment);
    },
    [onWordHover]
  );

  if (!isEnabled || !currentSegment) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="ylr-subtitle-container"
      data-testid="subtitle-overlay"
    >
      <div className="ylr-subtitle-line">
        {currentSegment.words.map((word) => (
          <span
            key={word.id}
            className={`ylr-word ${hoveredWord?.id === word.id ? 'ylr-word-hovered' : ''}`}
            onMouseEnter={(e) => handleWordHover(e, word, currentSegment)}
            onMouseLeave={onWordLeave}
            onClick={() => onWordClick(word, currentSegment)}
            data-word-id={word.id}
          >
            {word.text}
          </span>
        ))}
      </div>

      {/* Translation Tooltip */}
      {hoveredWord && translation && (
        <div
          className="ylr-tooltip"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="ylr-tooltip-content">
            <div className="ylr-tooltip-word">{translation.word}</div>
            <div className="ylr-tooltip-translation">{translation.translation}</div>
            {translation.pronunciation && (
              <div className="ylr-tooltip-pronunciation">{translation.pronunciation}</div>
            )}
            <div className="ylr-tooltip-hint">Click to save</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Subtitle Overlay Manager
// ============================================

export class SubtitleOverlayManager {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  private segments: SubtitleSegment[] = [];
  private currentTime = 0;
  private translation: TranslationResponse | null = null;
  private hoveredWord: SubtitleWord | null = null;
  private isEnabled = true;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  
  // Callbacks
  private onTranslationRequest: ((word: SubtitleWord, segment: SubtitleSegment) => void) | null = null;
  private onWordSave: ((word: SubtitleWord, segment: SubtitleSegment) => void) | null = null;

  /**
   * Initialize the overlay by creating and attaching the container
   */
  initialize(): boolean {
    // Find the video player container
    const playerContainer = document.querySelector('#movie_player');
    if (!playerContainer) {
      console.error('YouTube player container not found');
      return false;
    }

    // Check if already initialized
    if (this.container && document.body.contains(this.container)) {
      return true;
    }

    // Create the overlay container
    this.container = document.createElement('div');
    this.container.id = 'ylr-overlay-root';
    this.container.className = 'ylr-overlay-root';
    playerContainer.appendChild(this.container);

    // Create React root
    this.root = createRoot(this.container);

    // Find video element and start time sync
    this.videoElement = document.querySelector('video');
    if (this.videoElement) {
      this.startTimeSync();
    }

    // Render initial state
    this.render();

    console.log('Subtitle overlay initialized');
    return true;
  }

  /**
   * Set subtitle segments
   */
  setSubtitles(segments: SubtitleSegment[]): void {
    this.segments = segments;
    this.render();
  }

  /**
   * Set translation callback
   */
  setOnTranslationRequest(callback: (word: SubtitleWord, segment: SubtitleSegment) => void): void {
    this.onTranslationRequest = callback;
  }

  /**
   * Set save word callback
   */
  setOnWordSave(callback: (word: SubtitleWord, segment: SubtitleSegment) => void): void {
    this.onWordSave = callback;
  }

  /**
   * Update the displayed translation
   */
  setTranslation(translation: TranslationResponse | null): void {
    this.translation = translation;
    this.render();
  }

  /**
   * Toggle overlay visibility
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.render();
  }

  /**
   * Start synchronizing with video time
   */
  private startTimeSync(): void {
    const syncTime = () => {
      if (this.videoElement) {
        const newTime = this.videoElement.currentTime;
        if (Math.abs(newTime - this.currentTime) > 0.1) {
          this.currentTime = newTime;
          this.render();
        }
      }
      this.animationFrameId = requestAnimationFrame(syncTime);
    };
    syncTime();
  }

  /**
   * Handle word hover
   */
  private handleWordHover = (word: SubtitleWord, segment: SubtitleSegment): void => {
    this.hoveredWord = word;
    this.render();
    
    if (this.onTranslationRequest) {
      this.onTranslationRequest(word, segment);
    }
  };

  /**
   * Handle word leave
   */
  private handleWordLeave = (): void => {
    this.hoveredWord = null;
    this.translation = null;
    this.render();
  };

  /**
   * Handle word click (save)
   */
  private handleWordClick = (word: SubtitleWord, segment: SubtitleSegment): void => {
    if (this.onWordSave) {
      this.onWordSave(word, segment);
    }
  };

  /**
   * Render the React component
   */
  private render(): void {
    if (!this.root) return;

    this.root.render(
      <SubtitleOverlay
        segments={this.segments}
        currentTime={this.currentTime}
        onWordHover={this.handleWordHover}
        onWordClick={this.handleWordClick}
        onWordLeave={this.handleWordLeave}
        translation={this.translation}
        hoveredWord={this.hoveredWord}
        isEnabled={this.isEnabled}
      />
    );
  }

  /**
   * Clean up and destroy the overlay
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
    
    console.log('Subtitle overlay destroyed');
  }
}

// Export a singleton instance
export const subtitleOverlayManager = new SubtitleOverlayManager();
