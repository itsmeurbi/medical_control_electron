# Medical Control

A specialized desktop application for pain management physicians to manage patient records, clinical assessments, and treatment tracking. Built with Electron, Next.js, and TypeScript, this application is designed specifically for pain doctors to efficiently document patient consultations, pain assessments, physical examinations, and treatment protocols.

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

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Desktop**: Electron 40
- **Build**: electron-builder

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

### Development
- `npm run dev` - Start both Next.js and Electron in development mode
- `npm run dev:next` - Start only Next.js dev server
- `npm run dev:electron` - Start only Electron (waits for Next.js)

### Building
- `npm run build` - Build Next.js for production
- `npm run build:mac` - Build for macOS (both x64 and arm64)
- `npm run build:mac-x64` - Build for Intel Macs only (x64)
- `npm run package` - Package the app for distribution
- `npm run package:mac` - Package specifically for macOS

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database

## Project Structure

```
├── main/              # Electron main process files
│   ├── main.js        # Main Electron process
│   ├── preload.js     # Preload script for IPC
│   └── menu.js        # Native menu configuration
├── pages/             # Next.js pages (Pages Router)
│   ├── api/           # API routes
│   ├── patients/      # Patient management pages
│   └── advance-search.tsx
├── components/        # React components
│   └── patients/      # Patient-related components
├── lib/               # Shared utilities
│   ├── database.ts    # Prisma database client
│   ├── types.ts       # TypeScript type definitions
│   └── utils.ts       # Utility functions
├── prisma/            # Prisma schema
└── scripts/           # Build scripts
    ├── rebuild-native.js        # Universal binary rebuild
    └── rebuild-standalone-x64.js # x64-only rebuild
```

## Database

The app uses SQLite stored in `database/medical_control.db`. The database is automatically created and initialized on first run using Prisma migrations.

## Building for Distribution

### macOS Universal Build (Apple Silicon + Intel)
```bash
npm run build:mac
```
This creates a universal binary that works on both Apple Silicon and Intel Macs.

### macOS Intel-only Build
```bash
npm run build:mac-x64
```
Use this when you need to build specifically for Intel Macs. The build process will:
1. Rebuild native modules (better-sqlite3) for x64 architecture
2. Package the app for Intel Macs

## Native Menu

The application includes a native macOS menu with:
- **File** → **Export Data** (Cmd+E) - Exports patient and consultation data to CSV/ZIP
- Standard macOS app menu items
