const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const { exec, execSync } = require('child_process')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Admin password (production'da env var yoki encrypted config dan o'qish kerak)
const ADMIN_PASSWORD = process.env.DAGZO_ADMIN_PASSWORD || 'dagzo2024'

let mainWindow = null
let lessonWindow = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false, // local fayllar uchun
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // F11 — fullscreen toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })
}

// Darslik oynasini ochish
function openLessonWindow(lessonPath, config) {
  if (lessonWindow) {
    lessonWindow.close()
  }

  lessonWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: config.fullscreen !== false,
    kiosk: config.kiosk === true,
    frame: false,
    backgroundColor: '#0a0a0f',
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  const indexPath = path.join(lessonPath, config.start || 'index.html')
  lessonWindow.loadFile(indexPath)

  lessonWindow.on('closed', () => {
    lessonWindow = null
  })

  return true
}

// Darsliklarni /opt/dagzo/apps/ dan o'qish
function getLessons() {
  const appsDir = isDev
    ? path.join(__dirname, '../../lesson-template/sample-apps')
    : '/opt/dagzo/apps'

  const lessons = []

  if (!fs.existsSync(appsDir)) {
    return lessons
  }

  const entries = fs.readdirSync(appsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const lessonPath = path.join(appsDir, entry.name)
    const configPath = path.join(lessonPath, 'config.json')

    if (!fs.existsSync(configPath)) continue

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      lessons.push({
        id: entry.name,
        path: lessonPath,
        ...config,
      })
    } catch (e) {
      console.error(`config.json o'qishda xato: ${lessonPath}`, e)
    }
  }

  return lessons
}

// IPC handlers
ipcMain.handle('get-lessons', async () => {
  return getLessons()
})

ipcMain.handle('open-lesson', async (event, lessonId) => {
  const appsDir = isDev
    ? path.join(__dirname, '../../lesson-template/sample-apps')
    : '/opt/dagzo/apps'

  const lessonPath = path.join(appsDir, lessonId)
  const configPath = path.join(lessonPath, 'config.json')

  if (!fs.existsSync(configPath)) {
    return { success: false, error: 'Darslik topilmadi' }
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    openLessonWindow(lessonPath, config)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('close-lesson', async () => {
  if (lessonWindow) {
    lessonWindow.close()
    return { success: true }
  }
  return { success: false }
})

ipcMain.handle('verify-admin-password', async (event, password) => {
  return { valid: password === ADMIN_PASSWORD }
})

ipcMain.handle('admin-exit', async (event, password) => {
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: "Noto'g'ri parol" }
  }

  // Kiosk/fullscreen rejimdan chiqish
  if (mainWindow) {
    mainWindow.setKiosk(false)
    mainWindow.setFullScreen(false)
  }
  return { success: true }
})

ipcMain.handle('toggle-fullscreen', async () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
    return { fullscreen: mainWindow.isFullScreen() }
  }
  return { fullscreen: false }
})

ipcMain.handle('quit-app', async () => {
  app.quit()
})

// .exe faylni Wine orqali ochish
ipcMain.handle('open-exe', async (event, filePath) => {
  return new Promise((resolve) => {
    exec(`wine "${filePath}"`, (error) => {
      if (error) {
        resolve({
          success: false,
          error: "Bu Windows dasturi Dagzo OS'da to'liq ishlamasligi mumkin.",
        })
      } else {
        resolve({ success: true })
      }
    })
  })
})

ipcMain.handle('open-file', async (event, filePath) => {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.exe') {
    return ipcMain.emit('open-exe', null, filePath)
  } else if (['.pdf', '.mp4', '.webm', '.avi', '.mkv'].includes(ext)) {
    shell.openPath(filePath)
    return { success: true }
  } else {
    shell.openPath(filePath)
    return { success: true }
  }
})

ipcMain.handle('get-system-info', async () => {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    osName: 'Dagzo OS',
  }
})

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Crash himoya
process.on('uncaughtException', (error) => {
  console.error('Electron xato:', error)
})
