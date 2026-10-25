import { app, shell, BrowserWindow, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  loadTasks,
  saveTasks,
  addTask,
  toggleTask,
  deleteTask,
  getStorageInfo
} from './taskStore'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.deskflow')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
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
      typeof options.body === 'string'
        ? options.body.trim().slice(0, 300)
        : ''

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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

