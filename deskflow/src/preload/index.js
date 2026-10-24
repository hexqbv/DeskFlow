import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  versions: process.versions,
  ping: () => ipcRenderer.send('ping'),
  getTasks: () => ipcRenderer.invoke('tasks:get'),
  addTask: (title) => ipcRenderer.invoke('tasks:add', title),
  toggleTask: (id) => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  getStorageInfo: () => ipcRenderer.invoke('tasks:getStorageInfo')
})
