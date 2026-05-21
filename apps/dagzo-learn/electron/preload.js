const { contextBridge, ipcRenderer } = require('electron')

// Frontend uchun xavfsiz API
contextBridge.exposeInMainWorld('dagzo', {
  // Darsliklar
  getLessons: () => ipcRenderer.invoke('get-lessons'),
  openLesson: (lessonId) => ipcRenderer.invoke('open-lesson', lessonId),
  closeLesson: () => ipcRenderer.invoke('close-lesson'),

  // Admin
  verifyAdminPassword: (password) => ipcRenderer.invoke('verify-admin-password', password),
  adminExit: (password) => ipcRenderer.invoke('admin-exit', password),

  // UI
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Fayl
  openExe: (filePath) => ipcRenderer.invoke('open-exe', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  // Tizim
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Platformni aniqlash
  isElectron: true,
  platform: process.platform,
})
