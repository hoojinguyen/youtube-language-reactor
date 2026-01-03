import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionStats, ExtensionSettings } from '@/types';
import './popup.css';

// ============================================
// Popup Component
// ============================================

const Popup: React.FC = () => {
  const [stats, setStats] = useState<ExtensionStats | null>(null);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get stats
      const statsResponse = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Get settings
      const settingsResponse = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }

      // Check API status
      checkApiStatus(settingsResponse.data?.apiEndpoint || 'http://localhost:5000');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiStatus = async (endpoint: string) => {
    try {
      const response = await fetch(`${endpoint}/api/health`);
      setIsApiOnline(response.ok);
    } catch {
      setIsApiOnline(false);
    }
  };

  const handleToggle = async () => {
    if (!settings) return;
    
    const newEnabled = !settings.enabled;
    await chrome.runtime.sendMessage({
      type: 'TOGGLE_EXTENSION',
      payload: { enabled: newEnabled },
    });
    
    setSettings({ ...settings, enabled: newEnabled });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">YLR Lite</span>
          </div>
          <button
            className={`toggle-btn ${settings?.enabled ? 'active' : ''}`}
            onClick={handleToggle}
            title={settings?.enabled ? 'Disable' : 'Enable'}
          >
            <span className="toggle-slider"></span>
          </button>
        </div>
      </header>

      {/* Status */}
      <div className="status-section">
        <div className={`status-indicator ${isApiOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {isApiOnline ? 'API Connected' : 'API Offline'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalWords || 0}</div>
          <div className="stat-label">Total Words</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.todayWords || 0}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.weekWords || 0}</div>
          <div className="stat-label">This Week</div>
        </div>
      </div>

      {/* Last Saved Word */}
      {stats?.lastSaved && (
        <div className="last-saved">
          <div className="last-saved-label">Last saved:</div>
          <div className="last-saved-content">
            <span className="last-saved-word">{stats.lastSaved.originalWord}</span>
            <span className="last-saved-arrow">→</span>
            <span className="last-saved-translation">{stats.lastSaved.translation}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="actions-section">
        <button className="action-btn primary" onClick={openOptions}>
          <span className="btn-icon">📖</span>
          View Vocabulary
        </button>
      </div>

      {/* Footer */}
      <footer className="popup-footer">
        <span className="version">v{chrome.runtime.getManifest().version}</span>
        <a 
          href="#" 
          className="help-link"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://github.com/your-repo/youtube-language-reactor-lite' });
          }}
        >
          Help
        </a>
      </footer>
    </div>
  );
};

// Mount the app
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
