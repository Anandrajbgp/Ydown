# YouTube Downloader

## Overview
A Next.js-based web application that allows users to download YouTube videos and audio in various formats and qualities. Similar to y2mate functionality.

## Features
- YouTube video information fetching
- Multiple video quality options (1080p, 720p, 480p, 360p, etc.)
- Audio-only download options
- Modern, responsive UI with gradient design
- Real-time video preview with thumbnail
- View count and duration display

## Project Architecture

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js
- **YouTube Downloader**: @distube/ytdl-core
- **UI**: React 19 with custom CSS

### Project Structure
```
├── app/
│   ├── layout.js          # Root layout component
│   ├── page.js            # Main home page with UI
│   ├── globals.css        # Global styles
│   └── api/
│       ├── video-info/
│       │   └── route.js   # API endpoint to fetch video information
│       └── download/
│           └── route.js   # API endpoint to handle downloads
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies
└── replit.md              # This file
```

### API Endpoints

#### POST /api/video-info
Fetches YouTube video information including title, thumbnail, duration, views, and available formats.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": "10:30",
  "views": "1.5M",
  "formats": [
    {
      "itag": 22,
      "quality": "720p",
      "type": "Video (mp4)"
    }
  ]
}
```

#### POST /api/download
Downloads the requested video/audio format.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "itag": 22
}
```

**Response:** Binary file stream with appropriate headers

## Recent Changes
- **2025-11-13**: Added video+audio merging for high-quality downloads
  - Installed ffmpeg for stream merging
  - High-quality videos (1080p+) now download WITH audio
  - VP9/AV1 codecs output as WebM, H.264 outputs as MP4
  - Automatic audio stream selection and merging
  - Proper error handling for ffmpeg processes
  
- **2025-11-13**: Updated to show all formats in separate sections
  - Separated video and audio downloads into distinct sections
  - Show all available video qualities (including 1080p, 1440p, 2160p)
  - Show all available audio qualities with bitrate sorting
  - Added visual styling improvements for format sections
  
- **2025-11-13**: Initial project setup
  - Created Next.js application with App Router
  - Implemented video information fetching API
  - Implemented download functionality API
  - Built responsive UI with modern design
  - Configured dev server to run on port 5000 (0.0.0.0)

## Development
- **Dev Server**: Runs on port 5000 (configured for Replit environment)
- **Command**: `npm run dev`
- **Build**: `npm run build`

## User Preferences
- Language: Hindi/Urdu (as per user communication)
- Preferred style: Modern, gradient-based UI similar to y2mate
