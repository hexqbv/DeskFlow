import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  versions: process.versions,
  isDev: process.env.NODE_ENV === 'development',
  ping: () => ipcRenderer.send('ping'),

  // -------- Tasks --------
  getTasks: () => ipcRenderer.invoke('tasks:get'),
  addTask: (title) => ipcRenderer.invoke('tasks:add', title),
  toggleTask: (id) => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  getStorageInfo: () => ipcRenderer.invoke('tasks:getStorageInfo'),

  // -------- Notifications --------
  showNotification: (options) => ipcRenderer.invoke('notify:show', options),

  // -------- Notes --------
  getNotes: () => ipcRenderer.invoke('notes:get'),
  createNote: (data) => ipcRenderer.invoke('notes:create', data),
  updateNote: (data) => ipcRenderer.invoke('notes:update', data),
  deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
  saveNotes: (notes) => ipcRenderer.invoke('notes:save', notes),
  exportNote: (note) => ipcRenderer.invoke('notes:export', note),

  // -------- M5: App-level --------
  quitApp: () => ipcRenderer.invoke('app:quit'),
  isWindowVisible: () => ipcRenderer.invoke('app:isWindowVisible'),

  // Push messages from main → renderer (one-way)
  // Register a callback to be called when the main process asks the renderer
  // to open the quick-note overlay.
  onOpenQuickNote: (callback) => {
    ipcRenderer.on('open-quick-note', callback)
  },
  removeOpenQuickNoteListener: () => {
    ipcRenderer.removeAllListeners('open-quick-note')
  },

  // Register a callback for tab-navigation messages from main.
  onNavigateToTab: (callback) => {
    ipcRenderer.on('navigate-to-tab', (_, tab) => callback(tab))
  },
  removeNavigateToTabListener: () => {
    ipcRenderer.removeAllListeners('navigate-to-tab')
  }
})
