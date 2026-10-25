# DeskFlow

DeskFlow is a native desktop productivity app for focused work. It combines a
Pomodoro timer, locally stored tasks, and Markdown notes with macOS desktop
integrations.

## Features

- **Pomodoro timer:** 25-minute focus sessions, 5-minute short breaks, and
  15-minute long breaks after four focus sessions. Completion can trigger a
  native notification.
- **Task manager:** create, complete, and delete tasks. Tasks are stored locally
  in the application's Electron user-data directory.
- **Markdown notes:** create, edit, search, and preview notes, then export a
  note as a Markdown file using the native save dialog. Notes are stored locally
  in the application's Electron user-data directory.
- **Desktop integrations:** system tray menu, native notifications, and global
  shortcuts. On macOS the shortcuts use Command: `Cmd+Shift+D` shows DeskFlow,
  `Cmd+Shift+N` opens a quick note, and `Cmd+Shift+F` opens the focus timer.

## Technology

- Electron and electron-vite
- React with JavaScript and JSX
- Vite and CSS
- ESLint and Prettier

The Electron main process owns native operations and local file access. The
preload script exposes a narrow API through `contextBridge`; the React renderer
uses that API over IPC instead of accessing Node.js or Electron directly.
Context isolation and the renderer sandbox are enabled.

## Prerequisites

- Node.js (a current LTS release) and npm
- macOS on Apple Silicon to build and test the configured Apple Silicon DMG

## Install and run

From the project directory:

```bash
npm install
npm run dev
```

## Build and checks

Build the production application files:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

To preview the built application, run `npm start` after building.

## Package a macOS DMG

Build the production files and package for Apple Silicon:

```bash
npm run pack:mac
```

The script invokes electron-builder with the `mac` and `arm64` targets. The
configuration creates a DMG and an unpacked app directory under `dist/`; the
DMG is named `DeskFlow-<version>-mac-arm64.dmg` (currently
`DeskFlow-1.0.0-mac-arm64.dmg`).

Local packaging is configured with notarization disabled. Configure signing
and notarization as needed for public distribution. The generic publish URL in
`electron-builder.yml` is a placeholder and must be replaced before publishing
update artifacts.
