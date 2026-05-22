const { contextBridge, ipcRenderer } = require('electron')

// Frontend uchun xavfsiz API
contextBridge.exposeInMainWorld('dagzo', {
  // Darsliklar
  getLessons: () => ipcRenderer.invoke('get-lessons'),
  openLesson: (lessonId) => ipcRenderer.invoke('open-lesson', lessonId),
  closeLesson: () => ipcRenderer.invoke('close-lesson'),

  // Admin (parols iz)
  verifyAdminPassword: (password) => ipcRenderer.invoke('verify-admin-password', password),
  adminExit: () => ipcRenderer.invoke('admin-exit'),

  // Darslik o'rnatish
  installLesson: () => ipcRenderer.invoke('install-lesson'),

  // UI
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Fayl
  openExe: (filePath) => ipcRenderer.invoke('open-exe', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  // Branding
  getBrandingDir: () => ipcRenderer.invoke('get-branding-dir'),
  setWallpaper: (wallpaperId) => ipcRenderer.invoke('set-wallpaper', wallpaperId),

  // Tizim
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Platformni aniqlash
  isElectron: true,
  platform: process.platform,
})
