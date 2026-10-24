# DeskFlow

DeskFlow is a native desktop productivity app built on the existing Electron,
React, and electron-vite starter. This milestone documents the architecture and
implementation plan; the Pomodoro timer, task manager, notes editor, and native
productivity features are not implemented yet.

The starter entry points are currently JavaScript/JSX. The first planned
foundation step moves app code to TypeScript/TSX before feature work begins.

## Architecture

- **Main process** (`src/main`): owns the application lifecycle and native
  capabilities. It creates the window, handles operating-system integrations,
  and is the only process that should perform privileged operations.
- **Preload** (`src/preload`): exposes a small, explicit API to the renderer via
  `contextBridge`. The starter exposes only runtime versions and its demo ping
  action. Add typed, narrowly scoped IPC methods here as features are built;
  do not expose unrestricted Electron or Node APIs.
- **Renderer** (`src/renderer`): the React user interface. It should request
  native operations through the preload API and keep presentation separate
  from persistence and operating-system access.

The main window explicitly keeps Node integration off and enables both context
isolation and the renderer sandbox. Keep these boundaries in place as DeskFlow
grows.

## Implementation plan

1. **TypeScript foundation:** migrate the existing starter entry points to
   TypeScript/TSX and add beginner-friendly shared types without replacing
   electron-vite or adding unnecessary dependencies.
2. **Persistent tasks:** build the local task manager and its storage boundary.
3. **Pomodoro timer:** add focus and break sessions, with clear timer state and
   notifications through the native boundary.
4. **Markdown notes:** add editing plus native open/save operations exposed
   through narrow preload methods.
5. **Desktop integration:** add a system tray and global shortcuts through the
   main process, and complete notification behavior.

Keep each feature small, typed, and testable; renderer code must not access
filesystem or other privileged APIs directly.

## Run the existing starter

Run these commands from the project directory:

```bash
npm install
npm run dev
```

`npm run dev` starts electron-vite in development mode and opens the desktop
window. To build the current app without packaging it, run:

```bash
npm run build
```

To launch the built app in preview mode, run `npm start` after building. For
platform-specific distributables, use `npm run build:mac`, `npm run build:win`,
or `npm run build:linux`.
