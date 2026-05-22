const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { exec, fork } = require('child_process')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Fix #2: __dirname = .../apps/dagzo-learn/electron/ → ../../../ = project root
const PROJECT_ROOT = isDev
  ? path.join(__dirname, '../../..')
  : null

const BRANDING_DIR = isDev
  ? path.join(PROJECT_ROOT, 'assets/branding')
  : '/opt/dagzo/branding'

const APPS_DIR = isDev
  ? path.join(PROJECT_ROOT, 'lesson-template/sample-apps')
  : '/opt/dagzo/apps'

const ADMIN_PASSWORD = process.env.DAGZO_ADMIN_PASSWORD || 'dagzo2024'

let mainWindow = null
let lessonWindow = null
let backendProcess = null  // Fix #3

// ── Wi-Fi backend path resolution ───────────────────────────────────────────
// fork() asar-ichidagi faylni ishga tushira olmaydi, shuning uchun
// asarUnpack orqali chiqarilgan app.asar.unpacked birinchi tekshiriladi.
function resolveBackendPath() {
  if (isDev) return path.join(__dirname, '../backend/server.js')

  const candidates = [
    path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js'),
    path.join(process.resourcesPath, 'app', 'backend', 'server.js'),
    path.join(__dirname, '../backend', 'server.js'),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log('[backend] path topildi:', p)
      return p
    }
  }

  console.warn('[backend] server.js hech bir pathda topilmadi:', candidates)
  return null
}

// ── Wi-Fi backend auto-start ─────────────────────────────────────────────────
function startBackend() {
  const backendPath = resolveBackendPath()

  if (!backendPath) {
    console.warn('[backend] server.js topilmadi — Wi-Fi API ishga tushmaydi')
    return
  }

  backendProcess = fork(backendPath, [], {
    env: { ...process.env, PORT: '3001' },
    silent: true,
  })

  backendProcess.stdout?.on('data', (d) => console.log('[backend]', d.toString().trim()))
  backendProcess.stderr?.on('data', (d) => console.error('[backend]', d.toString().trim()))
  backendProcess.on('exit', (code) => {
    console.log(`[backend] jarayon tugadi (kod: ${code})`)
    backendProcess = null
  })

  console.log('[backend] Wi-Fi API ishga tushdi (pid:', backendProcess.pid, ')')
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM')
    backendProcess = null
    console.log('[backend] Wi-Fi API to\'xtatildi')
  }
}

// ── Fix #4: Wine helper — open-exe va open-file uchun umumiy funksiya ───────
async function openWithWine(filePath) {
  return new Promise((resolve) => {
    const safe = filePath.replace(/"/g, '\\"')
    exec(`wine "${safe}"`, { timeout: 5000 }, (error) => {
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
}

// ── Main window ─────────────────────────────────────────────────────────────
function createMainWindow() {
  const iconPath = path.join(BRANDING_DIR, 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })
}

// ── Lesson window ─────────────────────────────────────────────────────────
function openLessonWindow(lessonPath, config) {
  if (lessonWindow) lessonWindow.close()

  lessonWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: config.fullscreen !== false,
    kiosk: config.kiosk === true,
    frame: false,
    backgroundColor: '#0a0a0f',
    parent: mainWindow,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  lessonWindow.loadFile(path.join(lessonPath, config.start || 'index.html'))
  lessonWindow.on('closed', () => { lessonWindow = null })
}

// ── Darsliklarni o'qish ───────────────────────────────────────────────────
function getLessons() {
  if (!fs.existsSync(APPS_DIR)) return []

  return fs.readdirSync(APPS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .reduce((acc, entry) => {
      const configPath = path.join(APPS_DIR, entry.name, 'config.json')
      if (!fs.existsSync(configPath)) return acc
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        acc.push({ id: entry.name, path: path.join(APPS_DIR, entry.name), ...config })
      } catch (e) {
        console.error('config.json xato:', configPath, e.message)
      }
      return acc
    }, [])
}

// ── IPC handlers ─────────────────────────────────────────────────────────
ipcMain.handle('get-lessons', async () => getLessons())

ipcMain.handle('open-lesson', async (event, lessonId) => {
  const lessonPath = path.join(APPS_DIR, lessonId)
  const configPath = path.join(lessonPath, 'config.json')
  if (!fs.existsSync(configPath)) return { success: false, error: 'Darslik topilmadi' }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    openLessonWindow(lessonPath, config)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('close-lesson', async () => {
  if (lessonWindow) { lessonWindow.close(); return { success: true } }
  return { success: false }
})

ipcMain.handle('verify-admin-password', async (event, password) => ({
  valid: password === ADMIN_PASSWORD,
}))

ipcMain.handle('admin-exit', async (event, password) => {
  if (password !== ADMIN_PASSWORD) return { success: false, error: "Noto'g'ri parol" }
  mainWindow?.setKiosk(false)
  mainWindow?.setFullScreen(false)
  return { success: true }
})

ipcMain.handle('toggle-fullscreen', async () => {
  if (!mainWindow) return { fullscreen: false }
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
  return { fullscreen: mainWindow.isFullScreen() }
})

ipcMain.handle('quit-app', async () => app.quit())

// Fix #4: .exe — shared openWithWine funksiyasidan foydalanish
ipcMain.handle('open-exe', async (event, filePath) => openWithWine(filePath))

ipcMain.handle('open-file', async (event, filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.exe') return openWithWine(filePath)   // Fix #4: ipcMain.emit yo'q
  shell.openPath(filePath)
  return { success: true }
})

ipcMain.handle('get-branding-dir', async () => BRANDING_DIR)

ipcMain.handle('set-wallpaper', async (event, wallpaperId) => {
  const wallpaperPath = path.join(BRANDING_DIR, 'wallpapers', `wallpaper-${wallpaperId}.png`)
  if (!fs.existsSync(wallpaperPath)) {
    return { success: false, error: `Wallpaper topilmadi: wallpaper-${wallpaperId}.png` }
  }

  return new Promise((resolve) => {
    const monitors = [0, 1, 2]
    let done = 0
    monitors.forEach((m) => {
      exec(
        `xfconf-query -c xfce4-desktop \
         -p "/backdrop/screen0/monitor${m}/workspace0/last-image" \
         -s "${wallpaperPath.replace(/"/g, '\\"')}" 2>/dev/null`,
        () => { if (++done === monitors.length) {
          exec('xfdesktop --reload 2>/dev/null || true', () => {
            resolve({ success: true, path: wallpaperPath })
          })
        }}
      )
    })
  })
})

ipcMain.handle('get-system-info', async () => ({
  appVersion: app.getVersion(),
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node,
  platform: process.platform,
  arch: process.arch,
  osName: 'Dagzo OS',
}))

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend()       // Fix #3: backend avtomatik ishga tushadi
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', () => stopBackend())   // Fix #3: app yopilganda backend ham yopiladi

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (error) => {
  console.error('[main] uncaught exception:', error)
})
