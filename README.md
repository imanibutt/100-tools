# 100 Tools

Building 100 AI and utility tools in public, one tool at a time.

## Project Structure

This repository is home to a collection of useful web tools. The first tool in the collection is **BeDownloader**.

### Tools List

1. **BeDownloader** (#1): A professional-grade asset extraction tool for Behance projects.

## Tool #1: BeDownloader

BeDownloader allows you to quickly download high-resolution media from any public Behance project.

### Features
- **Original Quality**: Fetches the highest resolution available (source files).
- **ZIP Downloads**: Streamed ZIP generation for bulk downloads.
- **Stealth Extraction**: Uses advanced headers and fallback reader strategies to bypass 403 blocks.
- **Smart Proxy**: Handles CORS and file naming.

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
