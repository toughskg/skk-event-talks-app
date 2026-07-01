# BigQuery Release Notes Hub

A premium, glassmorphic web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches, categorizes, and displays Google BigQuery Release Notes, with integrated quick-sharing capabilities on Twitter/X.

---

## 🌟 Features

*   **Real-time Feed Parsing**: Fetches the latest release notes directly from the official Google Cloud XML feed.
*   **Robust CAPTCHA Fallback**: If Google's request protection blocks programmatic access, the backend automatically switches to a local copy (`fallback_release_notes.xml`) containing May/June 2026 data.
*   **Dynamic Categorization**: Notes are automatically classified (into *Features*, *Changes*, *Deprecations*, and *Fixes*) using keyword heuristics, color-coded with neon glows.
*   **Live Filtering & Search**: Instantly search titles and content or filter by categories.
*   **Interactive Tweet Composer**:
    *   Clicking any card highlights it and pre-fills the composer panel.
    *   Live character limit tracker (280 characters limit) turns gold/red and disables submission if limits are exceeded.
    *   Integrated with Twitter/X Web Intent API to safely open pre-formatted draft tabs.
*   **Overview Stats**: Shows metrics such as total available notes and the last updated timestamp.
*   **Modern Aesthetics**: Custom styled dark-theme glassmorphism utilizing floating background gradient orbs, Outfit/Jakarta typography, and responsive grid layouts.

---

## 🛠️ Architecture

*   **Backend**: Flask (`app.py`), `xml.etree.ElementTree` parsing, `requests` HTTP fetching.
*   **Frontend**: Plain HTML5, Vanilla CSS3 (custom styling system), Vanilla JavaScript (DOM manipulations, state filtering, event handling).
*   **Assets**: Lucide Icons CDN.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure Python 3.12+ and `pip` are installed on your machine.

### 2. Install Dependencies
Install the required Python packages:
```bash
pip install flask requests
```

### 3. Run the Server
Start the development server:
```bash
python app.py
```

By default, the server runs locally at:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```text
C:/psmc/workspace/agy-cli-projects/
├── app.py                      # Flask main server & API endpoints
├── fallback_release_notes.xml  # Backup XML feed (for captchas)
├── news.txt                    # Global news raw notes (July 1, 2026)
├── summary.txt                 # Summary of global news raw notes
├── .gitignore                  # Git exclusions file
├── README.md                   # This usage documentation
├── templates/
│   └── index.html              # Main web app layout
└── static/
    ├── css/
    │   └── style.css           # Glassmorphic CSS styling
    └── js/
        └── main.js             # Staged rendering & click events
```
