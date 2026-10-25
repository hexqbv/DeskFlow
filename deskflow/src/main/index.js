import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Notification,
  globalShortcut,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIconPath from '../../resources/trayIcon.png?asset'
import { loadTasks, saveTasks, addTask, toggleTask, deleteTask, getStorageInfo } from './taskStore'
import {
  loadNotes,
  saveNotes,
  createNote,
  updateNote,
  deleteNote,
  exportNoteToMarkdown
} from './noteStore'

let mainWindow = null
let tray = null

// ---------------------------------------------------------------------------
// Window helpers
// ---------------------------------------------------------------------------
function showAndFocusWindow() {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
}

// ---------------------------------------------------------------------------
// System tray
// ---------------------------------------------------------------------------
function setupTray() {
  try {
    const img = nativeImage.createFromPath(trayIconPath)
    tray = new Tray(img)

    // On macOS suppress the double-click action so single click works cleanly
    if (process.platform === 'darwin') {
      tray.setIgnoreDoubleClickEvents(true)
    }

    tray.setToolTip('DeskFlow')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open DeskFlow',
        click: () => showAndFocusWindow()
      },
      {
        label: 'Open Focus Timer',
        click: () => {
          showAndFocusWindow()
          mainWindow?.webContents.send('navigate-to-tab', 'focus')
        }
      },
      {
        label: 'New Quick Note',
        click: () => {
          showAndFocusWindow()
          mainWindow?.webContents.send('open-quick-note')
        }
      },
      { type: 'separator' },
      {
        label: 'Show / Hide Window',
        click: () => {
          if (!mainWindow) return
          if (mainWindow.isVisible()) {
            mainWindow.hide()
          } else {
            showAndFocusWindow()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit DeskFlow',
        click: () => {
          app.quit()
        }
      }
    ])

    tray.setContextMenu(contextMenu)

    // Left-click on the tray icon → show/focus window
    tray.on('click', () => showAndFocusWindow())
  } catch (err) {
    console.error('[Tray] Failed to create tray icon:', err)
  }
}

// ---------------------------------------------------------------------------
// Global keyboard shortcuts
// ---------------------------------------------------------------------------
function registerGlobalShortcuts() {
  const shortcuts = [
    {
      accelerator: 'CommandOrControl+Shift+D',
      description: 'Show / Focus DeskFlow',
      handler: () => showAndFocusWindow()
    },
    {
      accelerator: 'CommandOrControl+Shift+N',
      description: 'Open Quick Note overlay',
      handler: () => {
        showAndFocusWindow()
        mainWindow?.webContents.send('open-quick-note')
      }
    },
    {
      accelerator: 'CommandOrControl+Shift+F',
      description: 'Show Focus Timer',
      handler: () => {
        showAndFocusWindow()
        mainWindow?.webContents.send('navigate-to-tab', 'focus')
      }
    }
  ]

  for (const { accelerator, description, handler } of shortcuts) {
    try {
      const ok = globalShortcut.register(accelerator, handler)
      if (ok) {
        console.log(`[Shortcuts] Registered: ${accelerator} — ${description}`)
      } else {
        console.warn(`[Shortcuts] Could not register ${accelerator} (already in use?)`)
      }
    } catch (err) {
      console.error(`[Shortcuts] Error registering ${accelerator}:`, err)
    }
  }
}

function unregisterGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll()
    console.log('[Shortcuts] All global shortcuts unregistered')
  } catch (err) {
    console.error('[Shortcuts] Failed to unregister shortcuts:', err)
  }
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Hide instead of close when the user clicks the × button, so the tray icon
  // keeps DeskFlow alive in the background.
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.deskflow')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // -------- Task Management IPC Handlers --------
  ipcMain.handle('tasks:get', async () => {
    return await loadTasks()
  })

  ipcMain.handle('tasks:add', async (_, title) => {
    return await addTask(title)
  })

  ipcMain.handle('tasks:toggle', async (_, id) => {
    return await toggleTask(id)
  })

  ipcMain.handle('tasks:delete', async (_, id) => {
    return await deleteTask(id)
  })

  ipcMain.handle('tasks:save', async (_, tasks) => {
    return await saveTasks(tasks)
  })

  ipcMain.handle('tasks:getStorageInfo', () => {
    return getStorageInfo()
  })

  // -------- Native Notification IPC Handler --------
  ipcMain.handle('notify:show', (_, options) => {
    if (!options || typeof options !== 'object') {
      return { success: false, error: 'Invalid notification options' }
    }

    const title =
      typeof options.title === 'string' && options.title.trim().length > 0
        ? options.title.trim().slice(0, 100)
        : 'DeskFlow Focus'
    const body = typeof options.body === 'string' ? options.body.trim().slice(0, 300) : ''

    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        silent: false,
        ...(process.platform === 'linux' ? { icon } : {})
      }).show()
      return { success: true }
    }
    return { success: false, reason: 'Notifications not supported on platform' }
  })

  // -------- Note Management IPC Handlers --------
  ipcMain.handle('notes:get', async () => {
    return await loadNotes()
  })

  ipcMain.handle('notes:create', async (_, data) => {
    return await createNote(data)
  })

  ipcMain.handle('notes:update', async (_, data) => {
    return await updateNote(data)
  })

  ipcMain.handle('notes:delete', async (_, id) => {
    return await deleteNote(id)
  })

  ipcMain.handle('notes:save', async (_, notes) => {
    return await saveNotes(notes)
  })

  ipcMain.handle('notes:export', async (_, note) => {
    const activeWin = BrowserWindow.getFocusedWindow() || mainWindow
    return await exportNoteToMarkdown(activeWin, note)
  })

  // -------- M5: App-level IPC Handlers --------

  // Renderer can ask main to quit (e.g. future settings panel)
  ipcMain.handle('app:quit', () => {
    app.isQuitting = true
    app.quit()
  })

  // Renderer asks main whether window is visible (used for tray toggle)
  ipcMain.handle('app:isWindowVisible', () => {
    return mainWindow ? mainWindow.isVisible() : false
  })

  // -------- Create window, tray, and shortcuts --------
  createWindow()
  setupTray()
  registerGlobalShortcuts()

  app.on('activate', function () {
    // macOS: clicking dock icon re-shows the window
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      showAndFocusWindow()
    }
  })
})

// Keep the process alive when the window is closed (tray icon still active).
// The app only truly quits when the user chooses "Quit" from the tray menu
// or calls app.quit() explicitly.
app.on('window-all-closed', () => {
  // Do not quit — tray keeps the app alive on all platforms.
  // On macOS this is the default behaviour; on Windows/Linux we must suppress it.
})

app.on('before-quit', () => {
  // Mark as quitting so the 'close' handler lets the window actually close
  app.isQuitting = true
  unregisterGlobalShortcuts()
})

app.on('will-quit', () => {
  // Ensure shortcuts are released even if before-quit wasn't fired
  unregisterGlobalShortcuts()
})

app.on('before-quit', () => {
  // Mark as quitting so the 'close' handler lets the window actually close
  app.isQuitting = true
  unregisterGlobalShortcuts()
})

app.on('will-quit', () => {
  // Ensure shortcuts are released even if before-quit wasn't fired
  unregisterGlobalShortcuts()
})
