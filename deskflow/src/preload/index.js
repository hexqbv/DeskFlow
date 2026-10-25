import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  versions: process.versions,
  isDev: process.env.NODE_ENV === 'development',
  ping: () => ipcRenderer.send('ping'),
  getTasks: () => ipcRenderer.invoke('tasks:get'),
  addTask: (title) => ipcRenderer.invoke('tasks:add', title),
  toggleTask: (id) => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  getStorageInfo: () => ipcRenderer.invoke('tasks:getStorageInfo'),
  showNotification: (options) => ipcRenderer.invoke('notify:show', options),
  // Notes APIs
  getNotes: () => ipcRenderer.invoke('notes:get'),
  createNote: (data) => ipcRenderer.invoke('notes:create', data),
  updateNote: (data) => ipcRenderer.invoke('notes:update', data),
  deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
  saveNotes: (notes) => ipcRenderer.invoke('notes:save', notes),
  exportNote: (note) => ipcRenderer.invoke('notes:export', note)
})
