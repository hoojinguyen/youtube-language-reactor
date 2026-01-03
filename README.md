# YouTube Language Reactor Lite

<p align="center">
  <img src="extension/public/images/icon-128.png" alt="YouTube Language Reactor Lite" width="128" height="128">
</p>

<h3 align="center">Learn languages effectively by watching YouTube videos</h3>

<p align="center">
  A powerful browser extension that enhances YouTube video watching for language learning with interactive subtitles, hover-to-translate, and vocabulary management.
</p>

---

## ✨ Features

- 📺 **YouTube Integration** - Automatically activates on YouTube video pages
- 📝 **Subtitle Extraction** - Extracts and displays subtitles with precise synchronization
- 🔤 **Hover-to-Translate** - Hover over any word to see its translation instantly
- 💾 **Vocabulary Saving** - Click to save words with context for later review
- 📚 **Vocabulary Management** - Search, filter, and export your saved vocabulary
- 🌙 **Beautiful Dark Theme** - Premium, modern UI with glassmorphism design
- 🐳 **Self-Hosted** - Privacy-focused local deployment with Docker

## 🚀 Quick Start

### Prerequisites

- Google Chrome or Chromium-based browser
- Docker and Docker Compose (for the backend API)
- Node.js 18+ (for building the extension)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/youtube-language-reactor-lite.git
cd youtube-language-reactor-lite
```

### Step 2: Start the Backend API

```bash
# Start the API server with Docker
docker-compose up -d

# Verify it's running
curl http://localhost:5000/api/health
```

The API will be available at `http://localhost:5000` with docs at `http://localhost:5000/docs`.

### Step 3: Build the Extension

```bash
# Navigate to the extension directory
cd extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Step 4: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist` directory
5. The extension should now appear in your extensions list!

### Step 5: Start Learning! 🎉

1. Open any YouTube video with subtitles
2. Hover over words to see translations
3. Click on words to save them to your vocabulary
4. Click the extension icon to view your stats and vocabulary

## 📁 Project Structure

```
youtube-language-reactor-lite/
├── extension/                 # Chrome extension
│   ├── src/
│   │   ├── content/          # Content scripts for YouTube
│   │   ├── background/       # Service worker
│   │   ├── popup/            # Popup UI
│   │   ├── options/          # Options/vocabulary page
│   │   ├── components/       # Shared React components
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   ├── manifest.json         # Extension manifest (MV3)
│   ├── vite.config.ts        # Vite configuration
│   └── package.json
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── routes/           # API routes
│   │   ├── models/           # Pydantic models
│   │   ├── main.py           # FastAPI app
│   │   └── database.py       # SQLite setup
│   ├── requirements.txt
│   └── Dockerfile
├── docs/                      # Documentation
├── docker-compose.yml         # Docker Compose config
└── README.md
```

## 🛠️ Development

### Extension Development

```bash
cd extension

# Install dependencies
npm install

# Start development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m app.main
```

## 🔧 Configuration

### Extension Settings

Access settings via the extension's options page:

- **Source Language**: The language you're learning (default: English)
- **Target Language**: Your native language for translations (default: Vietnamese)
- **Subtitle Font Size**: Adjust subtitle display size
- **API Endpoint**: Backend server URL (default: http://localhost:5000)

### Backend Configuration

Environment variables:
- `PORT`: API server port (default: 5000)
- `DATABASE_PATH`: SQLite database path (default: ./data/vocabulary.db)

## 📝 API Documentation

When the backend is running, visit `http://localhost:5000/docs` for interactive API documentation.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/translate` | Translate a word |
| GET | `/api/vocabulary` | Get all vocabulary |
| POST | `/api/vocabulary` | Save a word |
| DELETE | `/api/vocabulary/{id}` | Delete a word |

## 🎨 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Subtitle Overlay
![Subtitle Overlay](docs/screenshots/subtitle-overlay.png)

### Popup
![Popup](docs/screenshots/popup.png)

### Vocabulary Management
![Vocabulary](docs/screenshots/vocabulary.png)

</details>

## 🗺️ Roadmap

- [x] Basic subtitle extraction and display
- [x] Hover-to-translate functionality
- [x] Vocabulary saving and management
- [x] Docker deployment
- [ ] Integration with real translation APIs (Google/DeepL)
- [ ] Dual subtitle display (original + translation)
- [ ] Spaced Repetition System (SRS) for vocabulary review
- [ ] Anki export
- [ ] Support for more video platforms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Language Reactor](https://www.languagereactor.com/)
- Built with [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), and [FastAPI](https://fastapi.tiangolo.com/)

---

<p align="center">
  Made with ❤️ for language learners everywhere
</p>
