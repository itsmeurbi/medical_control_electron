# Medical Control

A specialized desktop application for pain management physicians to manage patient records, clinical assessments, and treatment tracking. Built with Electron + Vite + React + TypeScript for a fast, offline-first desktop workflow tailored to pain specialists.

## Features

Designed specifically for pain management specialists, the application includes:

- **Patient Management**: Complete CRUD operations for patient records
- **Pain Assessment**: Comprehensive pain evaluation tools including:
  - Pain type, location, and evolution tracking
  - EVA (Visual Analog Scale) and EVERA pain scales
  - Pain irradiations and duration
  - Pain triggers (increases/decreases with specific activities)
  - Previous treatment history
- **Medical History Tracking**:
  - Personal information and demographics
  - Medical background and surgical history
  - Chronic conditions and degenerative diseases
  - Allergies and anticoagulants tracking (critical for pain procedures)
- **Physical Examination**: Detailed physical exploration focused on pain assessment:
  - Vital signs (blood pressure, heart rate, respiratory rate, SPO2)
  - Head, neck, spine, chest, abdomen, and extremities examination
  - Blood type and Rh factor (important for interventional procedures)
  - Weight and height tracking
- **Laboratory & Imaging**: Diagnostic studies relevant to pain management:
  - Laboratory results tracking
  - Imaging studies (X-ray, CT, MRI, Ultrasound, Doppler, EMG)
  - Cabinet studies and interconsultations
- **Interventional Procedures**:
  - Interventionism treatment tracking
  - Procedure documentation
- **Treatment Management**:
  - Treatment history with pagination
  - Procedure and medication tracking
  - Date-based treatment records
- **Search & Export**:
  - Real-time patient search
  - Advanced search with multiple criteria
  - Data export to CSV/ZIP format (via native File menu)

## Tech Stack

- **Renderer**: Vite + React 19 + TypeScript + Tailwind CSS
- **Routing**: React Router (HashRouter for Electron)
- **Desktop**: Electron 30
- **Database**: SQLite with Prisma ORM
- **Build**: electron-builder

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development mode:
```bash
npm run dev
```

This will:
- Start the Vite dev server
- Launch the Electron app window

## Available Scripts

### Development
- `npm run dev` - Start Vite and Electron in development mode

### Building
- `npm run build` - Typecheck, build renderer, and package Electron
- `npm run build:mac` - Build for macOS (both x64 and arm64)

### Quality
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database

## Project Structure

```
├── electron/           # Electron main/preload/menu
│   ├── main.ts         # Main Electron process
│   ├── preload.ts      # Preload script for IPC
│   └── menu.ts         # Native menu configuration
├── src/                # Vite renderer (React)
│   ├── pages/          # React pages (routing targets)
│   ├── utils/          # Renderer helpers (IPC fetch bridge)
│   └── main.tsx        # React entry
├── components/         # React components
├── lib/                # Shared utilities
├── prisma/             # Prisma schema
├── public/             # Static assets
├── scripts/            # Build/db scripts
└── pages/              # Legacy Next.js pages (if still present)
```

## Routing Notes (Electron)

Electron apps should use **HashRouter** (not BrowserRouter).
This ensures routes work correctly when the renderer is loaded via `file://` in production.

## IPC API (Renderer to Main)

Renderer-side `fetch('/api/...')` is intercepted and routed through Electron IPC.
This provides a familiar fetch-based API without running an HTTP server.

Example:
```ts
await fetch('/api/patients/search?text=juan')
```

## Export Notes

Exports are triggered via the native **File -> Export Data** menu or UI action.
The export flow uses IPC and creates a blob URL in the renderer for download.

## Database

The app uses SQLite stored under Electron's user data directory, for example:
`<userData>/database/medical_control.db`.
The database is automatically created and initialized on first run using Prisma migrations.

## Native Menu

The application includes a native macOS menu with:
- **File** -> **Export Data** (Cmd+E) - Exports patient and consultation data to CSV/ZIP
- Standard macOS app menu items
