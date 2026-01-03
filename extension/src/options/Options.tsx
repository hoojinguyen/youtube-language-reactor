import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { VocabularyItem, ExtensionSettings } from '@/types';
import { exportVocabularyToCSV } from '@/utils/storage';
import './options.css';

// ============================================
// Options Page Component
// ============================================

const Options: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'word'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'settings'>('vocabulary');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const vocabResponse = await chrome.runtime.sendMessage({ type: 'GET_VOCABULARY' });
      if (vocabResponse.success) {
        setVocabulary(vocabResponse.data);
      }

      const settingsResponse = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort vocabulary
  const filteredVocabulary = useMemo(() => {
    let result = [...vocabulary];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.originalWord.toLowerCase().includes(query) ||
          item.translation.toLowerCase().includes(query) ||
          item.contextSentence.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        comparison = a.originalWord.localeCompare(b.originalWord);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [vocabulary, searchQuery, sortBy, sortOrder]);

  const handleDelete = async (id: number) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_VOCABULARY',
        payload: { id },
      });
      if (response.success) {
        setVocabulary((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
    }
  };

  const handleExport = async () => {
    const csv = await exportVocabularyToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSettingChange = async (key: keyof ExtensionSettings, value: unknown) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { [key]: value },
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="options-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="options-container">
      {/* Header */}
      <header className="options-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <h1 className="logo-text">YouTube Language Reactor Lite</h1>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-btn ${activeTab === 'vocabulary' ? 'active' : ''}`}
              onClick={() => setActiveTab('vocabulary')}
            >
              Vocabulary
            </button>
            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="options-main">
        {activeTab === 'vocabulary' && (
          <>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search vocabulary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="toolbar-actions">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'word')}
                  className="sort-select"
                >
                  <option value="date">Sort by Date</option>
                  <option value="word">Sort by Word</option>
                </select>
                <button
                  className="sort-order-btn"
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <button className="export-btn" onClick={handleExport}>
                  📥 Export CSV
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <span className="stats-text">
                {filteredVocabulary.length} of {vocabulary.length} words
              </span>
            </div>

            {/* Vocabulary List */}
            {filteredVocabulary.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <h3>No vocabulary yet</h3>
                <p>Start watching YouTube videos and click on words to save them!</p>
              </div>
            ) : (
              <div className="vocabulary-list">
                {filteredVocabulary.map((item) => (
                  <div key={item.id} className="vocabulary-card">
                    <div className="card-main">
                      <div className="word-section">
                        <span className="original-word">{item.originalWord}</span>
                        <span className="arrow">→</span>
                        <span className="translation">{item.translation}</span>
                      </div>
                      <div className="context-section">
                        <span className="context-label">Context:</span>
                        <span className="context-text">{item.contextSentence}</span>
                      </div>
                    </div>
                    <div className="card-meta">
                      <span className="date">{formatDate(item.timestamp)}</span>
                      {deleteConfirm === item.id ? (
                        <div className="delete-confirm">
                          <span>Delete?</span>
                          <button
                            className="confirm-yes"
                            onClick={() => handleDelete(item.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="confirm-no"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="delete-btn"
                          onClick={() => setDeleteConfirm(item.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && settings && (
          <div className="settings-container">
            <div className="settings-section">
              <h2 className="section-title">Language Settings</h2>
              <div className="setting-item">
                <label className="setting-label">
                  I'm learning
                  <select
                    value={settings.sourceLanguage}
                    onChange={(e) => handleSettingChange('sourceLanguage', e.target.value)}
                    className="setting-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italian</option>
                    <option value="ru">Russian</option>
                  </select>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label">
                  Translate to
                  <select
                    value={settings.targetLanguage}
                    onChange={(e) => handleSettingChange('targetLanguage', e.target.value)}
                    className="setting-select"
                  >
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h2 className="section-title">Display Settings</h2>
              <div className="setting-item">
                <label className="setting-label">
                  Subtitle Font Size
                  <input
                    type="range"
                    min="14"
                    max="28"
                    value={settings.subtitleFontSize}
                    onChange={(e) =>
                      handleSettingChange('subtitleFontSize', parseInt(e.target.value))
                    }
                    className="setting-range"
                  />
                  <span className="range-value">{settings.subtitleFontSize}px</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showDualSubtitles}
                    onChange={(e) => handleSettingChange('showDualSubtitles', e.target.checked)}
                    className="setting-checkbox"
                  />
                  Show dual subtitles
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h2 className="section-title">API Settings</h2>
              <div className="setting-item">
                <label className="setting-label">
                  API Endpoint
                  <input
                    type="text"
                    value={settings.apiEndpoint}
                    onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                    className="setting-input"
                    placeholder="http://localhost:5000"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="options-footer">
        <p>YouTube Language Reactor Lite v{chrome.runtime.getManifest().version}</p>
      </footer>
    </div>
  );
};

// Mount the app
const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
