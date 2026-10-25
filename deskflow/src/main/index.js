import { app, shell, BrowserWindow, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadTasks, saveTasks, addTask, toggleTask, deleteTask, getStorageInfo } from './taskStore'
import {
  loadNotes,
  saveNotes,
  createNote,
  updateNote,
  deleteNote,
  exportNoteToMarkdown
} from './noteStore'
import {
  loadNotes,
  saveNotes,
  createNote,
  updateNote,
  deleteNote,
  exportNoteToMarkdown
} from './noteStore'

let mainWindow = null

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

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.deskflow')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Task Management IPC Handlers
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

  // Native Notification IPC Handler
  ipcMain.handle('notify:show', (_, options) => {
    if (!options || typeof options !== 'object') {
      return { success: false, error: 'Invalid notification options' }
    }

    const title =
      typeof options.title === 'string' && options.title.trim().length > 0
        ? options.title.trim().slice(0, 100)
        : 'DeskFlow Focus'
    const body =
      typeof options.body === 'string' ? options.body.trim().slice(0, 300) : ''

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

  // Note Management IPC Handlers
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

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
