# YouTube Language Reactor - Proof of Concept

A Chrome extension that enhances YouTube video watching for language learning by extracting subtitles, displaying them with hover-to-translate functionality, and allowing users to save vocabulary for later review.

## 📋 Project Overview

This is a **Proof of Concept (PoC)** implementation designed to validate the core technical feasibility of building a YouTube-focused language learning extension. The PoC focuses on:

1. **Subtitle Extraction**: Reliably extracting YouTube subtitles from the video player
2. **Custom Overlay**: Displaying extracted subtitles with word-level interactivity
3. **Hover-to-Translate**: Showing translations on hover (requires local API backend)
4. **Vocabulary Management**: Saving and managing learned words locally

## 🎯 Key Features

- ✅ Automatic YouTube video detection
- ✅ Subtitle extraction from YouTube's player data
- ✅ Custom subtitle overlay with precise synchronization
- ✅ Word-level hover tooltips for translations
- ✅ Click-to-save vocabulary functionality
- ✅ Local vocabulary management page
- ✅ CSV export capability
- ✅ Extension toggle on/off

## 🏗️ Architecture

The extension consists of three main components:

### 1. Content Script (`content-script.js`)
- Injected into YouTube video pages
- Extracts subtitles from the video player's internal data
- Creates and manages the custom subtitle overlay
- Handles word-level interactions (hover, click)
- Synchronizes subtitles with video playback

### 2. Service Worker (`service-worker.js`)
- Handles background tasks
- Communicates with the local API server for translations
- Manages vocabulary storage
- Caches translations for performance

### 3. UI Components
- **Popup** (`popup.html`, `popup.js`): Quick access panel with statistics and controls
- **Options Page** (`options.html`, `options.js`): Full vocabulary management interface

## 📦 Installation and Setup

### Prerequisites
- Google Chrome or Chromium-based browser
- Python 3.7+ (for the local API server)
- Basic knowledge of Chrome extension development

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `youtube-language-reactor-poc` directory
5. The extension should now appear in your extensions list

### Step 2: Set Up the Local API Server

The extension requires a local API server for translation functionality. A basic implementation is provided below:

**Create `api_server.py`:**

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Simple translation dictionary (in production, use a real translation API)
TRANSLATIONS = {
    'hello': 'xin chào',
    'world': 'thế giới',
    'thank': 'cảm ơn',
    'you': 'bạn',
    'love': 'yêu',
    'friend': 'bạn',
    # Add more translations as needed
}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json
    word = data.get('word', '').lower()
    target_language = data.get('targetLanguage', 'en')
    
    # Simple lookup - in production, use a real translation service
    translation = TRANSLATIONS.get(word, f'[{word}]')
    
    return jsonify({
        'word': word,
        'translation': translation,
        'language': target_language
    }), 200

if __name__ == '__main__':
    print('Starting YouTube Language Reactor API Server...')
    print('Server running at http://localhost:5000')
    app.run(debug=False, host='localhost', port=5000)
```

**Install dependencies:**

```bash
pip install flask flask-cors
```

**Run the server:**

```bash
python api_server.py
```

The server will start at `http://localhost:5000`

### Step 3: Test the Extension

1. Navigate to a YouTube video with subtitles enabled
2. The extension should automatically extract and display the subtitles
3. Hover over words to see translations (if the API server is running)
4. Click on words to save them to your vocabulary
5. Click the extension icon to view your vocabulary list

## 🔍 How It Works

### Subtitle Extraction

The extension uses multiple methods to extract subtitles:

1. **Primary Method**: Accesses YouTube's internal player data (`ytInitialPlayerResponse`) to find the caption track URL
2. **Fetch and Parse**: Downloads the subtitle file (XML format) and parses it into timed segments
3. **Fallback**: If the above fails, attempts to read subtitles from the DOM (less reliable)

### Subtitle Display

- Subtitles are overlaid on the video player in a custom container
- The current subtitle line is highlighted based on video playback time
- Each word is wrapped in a `<span>` element for individual interaction

### Hover-to-Translate

- When hovering over a word, a tooltip appears
- The service worker sends a translation request to the local API
- Translations are cached in Chrome's local storage for performance

### Vocabulary Management

- Saved words are stored in Chrome's local storage (`chrome.storage.local`)
- Each entry includes: word, translation, context sentence, video ID, and timestamp
- The options page provides a searchable table view of all saved words

## 🚀 Testing Checklist

Use this checklist to verify the PoC works correctly:

- [ ] Extension loads without errors in Chrome
- [ ] Extension icon appears in the toolbar
- [ ] Navigating to a YouTube video shows custom subtitles
- [ ] Subtitles synchronize correctly with video playback
- [ ] Hovering over words shows a tooltip (with placeholder text if API is offline)
- [ ] Clicking a word saves it to vocabulary
- [ ] Popup shows the correct word count
- [ ] Options page displays all saved words
- [ ] Searching in the options page filters results correctly
- [ ] Exporting to CSV works
- [ ] Deleting words removes them from the list
- [ ] Extension toggle on/off works

## 🐛 Known Limitations

1. **YouTube Updates**: YouTube frequently updates its UI and player structure. The subtitle extraction may break with major updates.
2. **Subtitle Availability**: Not all YouTube videos have subtitles. The extension will only work on videos with available captions.
3. **Translation API**: The PoC uses a simple local API. For production, integrate with a real translation service (Google Translate, DeepL, etc.).
4. **Performance**: On videos with many subtitles, the overlay may cause minor performance impacts.
5. **Language Detection**: The extension doesn't automatically detect the video's language or the user's target language.

## 📝 Next Steps for Production

1. **Robust Subtitle Extraction**: Implement multiple fallback methods and handle edge cases
2. **Real Translation API**: Integrate with Google Translate, DeepL, or a local translation model
3. **Language Selection**: Allow users to select source and target languages
4. **Spaced Repetition**: Implement an SRS algorithm for vocabulary review
5. **Sync Across Devices**: Add cloud sync for vocabulary across devices
6. **Advanced Features**: Add PhrasePump, AI tutor, and other advanced learning tools
7. **Performance Optimization**: Profile and optimize for large subtitle files
8. **Error Handling**: Improve error messages and recovery mechanisms

## 📚 File Structure

```
youtube-language-reactor-poc/
├── manifest.json           # Extension configuration
├── content-script.js       # Main content script
├── content-script.css      # Content script styles
├── service-worker.js       # Background service worker
├── popup.html              # Popup UI
├── popup.js                # Popup logic
├── options.html            # Vocabulary management page
├── options.js              # Vocabulary management logic
├── images/                 # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md               # This file
```

## 🔧 Troubleshooting

### Subtitles not appearing
- Ensure the YouTube video has subtitles enabled
- Check the browser console (F12) for error messages
- Verify the video URL matches the pattern `youtube.com/watch?v=...`

### Translation tooltips not showing
- Ensure the local API server is running at `http://localhost:5000`
- Check the browser console for network errors
- Verify the API server is responding to requests

### Words not saving
- Check that Chrome's local storage is enabled
- Verify the service worker is running (check `chrome://extensions/` details)
- Look for errors in the background script logs

### Extension not loading
- Verify all files are in the correct directory
- Check for syntax errors in JavaScript files
- Ensure manifest.json is valid JSON

## 📖 Resources

- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Content Scripts Guide](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Service Workers Guide](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers)

## 📄 License

This is a proof of concept for educational purposes. Feel free to modify and use for your own projects.

## 🤝 Contributing

This is a PoC project. For improvements and bug fixes, please test thoroughly and document your changes.

---

**Status**: Proof of Concept ✅  
**Last Updated**: January 2026  
**Maintainer**: Manus AI
