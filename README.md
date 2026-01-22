# Medical Control Electron App

Desktop application for medical patient management, built with Electron + Next.js + TypeScript + SQLite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

This will:
- Start the Next.js dev server on http://localhost:3000
- Launch the Electron app window

## Available Scripts

- `npm run dev` - Start both Next.js and Electron in development mode
- `npm run dev:next` - Start only Next.js dev server
- `npm run dev:electron` - Start only Electron (waits for Next.js)
- `npm run build` - Build Next.js for production
- `npm run package` - Package the app for distribution
- `npm run package:mac` - Package specifically for macOS

## Project Structure

- `main/` - Electron main process files
- `pages/` - Next.js pages (Pages Router)
- `pages/api/` - API routes
- `lib/` - Shared utilities (database, types)
- `database/` - SQLite database file (created automatically)

## Database

The app uses SQLite stored in `database/medical_control.db`. The database is automatically created and initialized on first run.

## Features

- Patient management (CRUD)
- Consultation/treatment tracking
- CSV export
- Search functionality
- Advanced search
