# Product Requirements Document (PRD): YouTube Language Reactor Lite

**Goal:** To create a minimal viable product (MVP) browser extension that enhances YouTube video viewing for language learning by providing hover-to-translate functionality and a local vocabulary management system.

## 1. Project Goal and Scope

The primary goal is to build a self-contained, single-user browser extension focused on **YouTube** that facilitates language acquisition through interactive subtitles. The project will prioritize a local-first deployment model using **Docker** for ease of setup and portability.

### 1.1. Out of Scope (For MVP)
*   Support for other streaming platforms (e.g., Netflix, Hulu).
*   Advanced features like PhrasePump, AI Tutor (Aria), or Spaced Repetition System (SRS).
*   Cloud-based user synchronization or multi-user support.
*   Advanced natural language processing (NLP) features like word-form recognition.

## 2. Target User and Value Proposition

**Target User:** An individual language learner who uses YouTube as a primary source of immersion content and requires a tool to quickly look up and save new vocabulary without interrupting their viewing flow.

**Value Proposition:** "Seamlessly look up and save new vocabulary directly from YouTube subtitles with a self-hosted, privacy-focused browser extension."

## 3. Functional Requirements

### 3.1. Core Extension Functionality
| ID | Requirement | Description |
| :--- | :--- | :--- |
| **FR-01** | **YouTube Detection** | The extension must automatically activate only when a user is on a YouTube video watch page (`youtube.com/watch?v=...`). |
| **FR-02** | **Subtitle Extraction** | The extension must reliably extract the full, timed transcript (subtitles) for the currently playing YouTube video. |
| **FR-03** | **Custom Subtitle Overlay** | The extension must inject a custom, dual-subtitle-like overlay into the video player area, displaying the extracted subtitles. This overlay must be easily toggleable. |
| **FR-04** | **Subtitle Synchronization** | The custom subtitle overlay must synchronize precisely with the video's playback time, highlighting the current line of dialogue. |
| **FR-05** | **Hover-to-Translate** | When the user hovers their mouse over any word in the custom subtitle overlay, a small, non-intrusive tooltip must appear, showing the translation of that single word into the user's base language. |
| **FR-06** | **Vocabulary Saving** | The user must be able to click on a word in the subtitle overlay (or a button in the hover tooltip) to save it to their personal vocabulary list. |

### 3.2. Vocabulary Management Functionality
| ID | Requirement | Description |
| :--- | :--- | :--- |
| **FR-07** | **Management Page Access** | The extension must provide a dedicated "Management Page" (e.g., via the browser action popup or an options page) where the user can view their saved vocabulary. |
| **FR-08** | **Vocabulary List Display** | The Management Page must display a list of all saved words, including the original word, its translation, and the context sentence from which it was saved. |
| **FR-09** | **Vocabulary Deletion** | The user must be able to delete saved words from the Management Page. |

## 4. Technical Requirements and Architecture

The architecture will consist of two main components: the **Browser Extension (Frontend)** and the **Local API Server (Backend)**, both designed for local, single-user operation.

### 4.1. Browser Extension (Frontend)
*   **Standard:** Must be built using **Manifest V3 (MV3)** standards.
*   **Technology:** JavaScript/TypeScript, HTML, CSS (React/Vue/Svelte is optional but recommended for the UI complexity).
*   **Components:**
    *   **Content Script:** Injected into YouTube to handle subtitle extraction, DOM manipulation, and UI overlay.
    *   **Service Worker:** Handles communication between the Content Script and the Local API Server.
    *   **Management Page:** A simple HTML/JS page for the vocabulary list.

### 4.2. Local API Server (Backend)
*   **Purpose:** To provide two core services: **Translation** and **Vocabulary Storage**.
*   **Technology:** Python (Flask/FastAPI) or Node.js (Express) is recommended for simplicity and ease of Dockerization.
*   **Services:**
    *   **Translation Endpoint:** Accepts a word and returns its translation. This service will use a self-hosted translation library (e.g., a wrapper around a free/open-source translation service or a local translation model).
    *   **Vocabulary Endpoint:** Standard REST endpoints (`GET`, `POST`, `DELETE`) for managing the vocabulary list.
*   **Database:** A simple, file-based database like **SQLite** or a JSON file store is sufficient for single-user local storage.

## 5. Deployment and Infrastructure

The entire application must be deployable as a self-contained unit.

| ID | Requirement | Description |
| :--- | :--- | :--- |
| **INF-01** | **Dockerization** | The Local API Server must be packaged into a Docker image. A `docker-compose.yml` file must be provided to start the API server and its database (if applicable) with a single command. |
| **INF-02** | **Local Communication** | The Browser Extension must be configured to communicate with the Local API Server via a fixed, local address (e.g., `http://localhost:5000`). |
| **INF-03** | **Portability** | The entire project structure should be designed so that the user can clone the repository, run `docker-compose up`, and load the extension into their browser with minimal configuration. |

## 6. Data Model (Local API Server)

The database will contain a single primary table/collection for the user's vocabulary.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (Primary Key) | Unique identifier for the saved word. |
| `original_word` | String | The word saved by the user (e.g., "ephemeral"). |
| `translation` | String | The translated meaning of the word. |
| `context_sentence` | String | The full subtitle line from which the word was saved. |
| `video_id` | String | The YouTube video ID where the word was found. |
| `timestamp` | Datetime | The date and time the word was saved. |

## 7. Next Steps

The next phase of development should focus on:
1.  **Proof of Concept (PoC):** Building the Content Script to successfully extract and display YouTube subtitles.
2.  **API Development:** Creating the minimal Local API Server with the Translation and Vocabulary endpoints.
3.  **Integration:** Connecting the extension's hover and save actions to the local API.
4.  **Docker Setup:** Finalizing the `Dockerfile` and `docker-compose.yml` for easy deployment.
