# 100 Tools

Building 100 AI and utility tools in public, one tool at a time.

## Project Structure

This repository is home to a collection of useful web tools. The first tool in the collection is **BeDownloader**.

### Tools List

1. **BeDownloader** (#1): A professional-grade asset extraction tool for Behance projects.
2. **Brutal Reminder** (#2): Privacy-first accountability emails that ask if you actually did the small step you committed to.
3. **ATS CV Maker** (#3): A free ATS-friendly CV builder with a keyword match check, an optional AI ATS review (paste your old CV, get a 0-100 score and section-by-section suggestions you can preview and apply to the form), and a PDF download.
4. **HumanPass** (#4): A writing style assistant that turns rough drafts into clear, natural prose using a server-side language model, plus a transparent Formulaic Style Score check.

## Tool #1: BeDownloader

BeDownloader allows you to quickly download high-resolution media from any public Behance project.

### Features
- **Original Quality**: Fetches the highest resolution available (source files).
- **ZIP Downloads**: Streamed ZIP generation for bulk downloads.
- **Stealth Extraction**: Uses advanced headers and fallback reader strategies to bypass 403 blocks.
- **Smart Proxy**: Handles CORS and file naming.

## Tool #4: HumanPass

HumanPass rewrites rough drafts in place while preserving the original meaning, facts, and structure. It exposes three rewrite modes and a transparent Formulaic Style Score check.

### Endpoints
- `POST /api/humanize` — body `{ text: string, mode?: "standard" | "aggressive" | "academic" }`. Returns the rewritten text as `text/plain`.
- `POST /api/detect` — body `{ text: string }`. Returns `{ score, label, metrics }` where `score` is 0–100 (lower means more natural-sounding prose).

### Provider configuration

`HUMANPASS_PROVIDER` selects which backend `/api/humanize` calls. Valid values are `minimax` (default), `openai`, or `anthropic`. The `MINIMAX_*` keys are read server-side only and are never exposed to the client.

```
HUMANPASS_PROVIDER=minimax
MINIMAX_API_KEY=...
MINIMAX_MODEL=MiniMax-M3
MINIMAX_BASE_URL=https://api.minimax.io/anthropic
```

## Setup

### Requirements
- Node.js 18+

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

### 1. Extract Assets
Parses a URL and returns a standardized list of media items.
**Endpoint:** `GET /api/extract?url=...`

### 2. Download Proxy
Fetches a single file to bypass CORS.
**Endpoint:** `GET /api/proxy?url=...&filename=...`

### 3. Download ZIP
Creates a ZIP archive of multiple assets.
**Endpoint:** `POST /api/download-zip`

## Compliance & Privacy
This tool is intended for personal backup and educational purposes. Always respect the copyright of creators. It does not bypass paywalls or access private content.
