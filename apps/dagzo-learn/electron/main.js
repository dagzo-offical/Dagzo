const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { exec, fork, spawn, spawnSync } = require('child_process')
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
  ? path.join(PROJECT_ROOT, 'lesson-template/app')
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

// ── Wine helper — detached spawn, timeout yo'q, shell injection yo'q ────────
function openWithWine(filePath) {
  const which = spawnSync('which', ['wine'], { encoding: 'utf8' })
  if (which.status !== 0) {
    return Promise.resolve({
      success: false,
      error: "Wine o'rnatilmagan. .exe fayllarni ochish uchun Wine kerak.",
    })
  }

  // detached + unref: .exe mustaqil jarayon sifatida ishlaydi, Electron uni kutmaydi
  const child = spawn('wine', [filePath], { detached: true, stdio: 'ignore' })
  child.unref()
  return Promise.resolve({ success: true })
}

// ── Main window — maximized, not kiosk by default ───────────────────────────
function createMainWindow() {
  const iconPath = path.join(BRANDING_DIR, 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,
    kiosk: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
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

// ── Lesson window — frame: true (system X button), maximized by default ──────
function openLessonWindow(lessonPath, config) {
  if (lessonWindow) lessonWindow.close()

  lessonWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: config.fullscreen === true,
    kiosk: config.kiosk === true,
    frame: true,
    backgroundColor: '#0a0a0f',
    parent: mainWindow,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  lessonWindow.once('ready-to-show', () => {
    if (!config.fullscreen) lessonWindow.maximize()
    lessonWindow.show()
  })

  lessonWindow.loadFile(path.join(lessonPath, config.start || 'index.html'))
  lessonWindow.on('closed', () => { lessonWindow = null })
}

// ── Python lesson — run.py ni spawn qilib, portni kutib, webview ochish ──────
let pythonProcess = null

async function openPythonLesson(lessonPath, config) {
  if (pythonProcess) { pythonProcess.kill('SIGTERM'); pythonProcess = null }
  if (lessonWindow) { lessonWindow.close() }

  const port = config.port || 8000
  const entry = config.entry || 'run.py'
  const runPy = path.join(lessonPath, entry)

  if (!fs.existsSync(runPy)) return { success: false, error: `${entry} topilmadi` }

  pythonProcess = spawn('python3', [runPy], {
    cwd: lessonPath,
    stdio: 'ignore',
    detached: false,
  })

  pythonProcess.on('exit', () => { pythonProcess = null })

  // Portni kut (max 15s)
  const url = config.url || `http://127.0.0.1:${port}`
  let ready = false
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      const http = require('http')
      await new Promise((res, rej) => {
        const req = http.get(url, () => { res(); req.destroy() })
        req.on('error', rej)
        req.setTimeout(400, () => { req.destroy(); rej() })
      })
      ready = true
      break
    } catch {}
  }

  if (!ready) console.warn('[python] server tayyor bo\'lmadi — baribir ochilmoqda:', url)

  lessonWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: config.fullscreen === true,
    kiosk: false,
    frame: true,
    backgroundColor: '#0a0a0f',
    parent: mainWindow,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  lessonWindow.once('ready-to-show', () => {
    lessonWindow.maximize()
    lessonWindow.show()
  })

  lessonWindow.loadURL(url)
  lessonWindow.on('closed', () => {
    lessonWindow = null
    if (pythonProcess) { pythonProcess.kill('SIGTERM'); pythonProcess = null }
  })

  return { success: true }
}

// ── Darsliklarni o'qish — config.json yoki run.py ni taniydi ─────────────────
function getLessons() {
  if (!fs.existsSync(APPS_DIR)) return []

  return fs.readdirSync(APPS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .reduce((acc, entry) => {
      const lessonDir = path.join(APPS_DIR, entry.name)
      const configPath = path.join(lessonDir, 'config.json')
      const runPyPath  = path.join(lessonDir, 'run.py')

      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          acc.push({ id: entry.name, path: lessonDir, ...config })
        } catch (e) {
          console.error('config.json xato:', configPath, e.message)
        }
      } else if (fs.existsSync(runPyPath)) {
        // run.py bor, config.json yo'q — minimal config yaratiladi
        acc.push({
          id: entry.name,
          path: lessonDir,
          name: entry.name,
          publisher: 'Dagzo',
          version: '1.0.0',
          type: 'python',
          entry: 'run.py',
          fullscreen: false,
        })
      }
      return acc
    }, [])
}

// ── IPC handlers ─────────────────────────────────────────────────────────
ipcMain.handle('get-lessons', async () => getLessons())

ipcMain.handle('open-lesson', async (event, lessonId) => {
  const lessonPath = path.join(APPS_DIR, lessonId)
  const configPath = path.join(lessonPath, 'config.json')
  const runPyPath  = path.join(lessonPath, 'run.py')

  let config = {}
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')) }
    catch (e) { return { success: false, error: `config.json xato: ${e.message}` } }
  } else if (fs.existsSync(runPyPath)) {
    config = { type: 'python', entry: 'run.py', fullscreen: false }
  } else {
    return { success: false, error: 'Darslik topilmadi (config.json yoki run.py yo\'q)' }
  }

  if (config.type === 'python') return openPythonLesson(lessonPath, config)
  openLessonWindow(lessonPath, config)
  return { success: true }
})

ipcMain.handle('close-lesson', async () => {
  if (lessonWindow) { lessonWindow.close(); return { success: true } }
  return { success: false }
})

ipcMain.handle('verify-admin-password', async (event, password) => ({
  valid: password === ADMIN_PASSWORD,
}))

ipcMain.handle('admin-exit', async () => {
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

// ── Darslik o'rnatish — papka yoki zip ni /opt/dagzo/apps/ ga ko'chirish ─────
ipcMain.handle('install-lesson', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Darslik papkasini tanlang',
    properties: ['openDirectory'],
    buttonLabel: "O'rnatish",
  })

  if (result.canceled || !result.filePaths.length) return { success: false, canceled: true }

  const srcPath = result.filePaths[0]
  const hasRunPy     = fs.existsSync(path.join(srcPath, 'run.py'))
  const hasConfigJson = fs.existsSync(path.join(srcPath, 'config.json'))
  const hasIndexHtml  = fs.existsSync(path.join(srcPath, 'index.html'))

  if (!hasRunPy && !hasConfigJson && !hasIndexHtml) {
    return { success: false, error: 'Darslik topilmadi: run.py, config.json yoki index.html bo\'lishi kerak' }
  }

  let lessonName = path.basename(srcPath)
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')

  if (hasConfigJson) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(srcPath, 'config.json'), 'utf8'))
      if (cfg.name) lessonName = cfg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    } catch {}
  }

  const destPath = path.join(APPS_DIR, lessonName)
  try {
    fs.mkdirSync(destPath, { recursive: true })
    fs.cpSync(srcPath, destPath, { recursive: true })

    if (!hasConfigJson && hasRunPy) {
      fs.writeFileSync(path.join(destPath, 'config.json'), JSON.stringify({
        name: lessonName, publisher: 'Dagzo', version: '1.0.0',
        type: 'python', entry: 'run.py', fullscreen: false,
      }, null, 2))
    }
    return { success: true, name: lessonName, path: destPath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

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
