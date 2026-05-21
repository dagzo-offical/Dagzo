const express = require('express')
const cors = require('cors')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:5173', 'app://./index.html'],
}))
app.use(express.json())

// nmcli mavjudligini tekshirish
async function checkNmcli() {
  try {
    await execAsync('which nmcli')
    return true
  } catch {
    return false
  }
}

// Wi-Fi tarmoqlar ro'yxati
app.get('/api/wifi/list', async (req, res) => {
  try {
    const hasNmcli = await checkNmcli()
    if (!hasNmcli) {
      return res.json({
        success: false,
        error: 'NetworkManager o\'rnatilmagan',
        networks: [],
      })
    }

    // nmcli orqali tarmoqlarni skanerlash
    await execAsync('nmcli dev wifi rescan 2>/dev/null || true')

    const { stdout } = await execAsync(
      'nmcli -f SSID,SIGNAL,SECURITY,IN-USE dev wifi list 2>/dev/null'
    )

    const lines = stdout.trim().split('\n').slice(1) // header o'tkazib
    const networks = []

    for (const line of lines) {
      if (!line.trim()) continue

      // nmcli ustunlarni parse qilish
      const parts = line.trim().split(/\s{2,}/)
      if (parts.length < 2) continue

      const inUse = line.startsWith('*')
      const cleanLine = inUse ? line.substring(1).trim() : line.trim()
      const cols = cleanLine.split(/\s{2,}/)

      const ssid = cols[0]?.trim()
      const signal = parseInt(cols[1]) || 0
      const security = cols[2]?.trim() || '--'

      if (ssid && ssid !== '--') {
        networks.push({
          ssid,
          signal,
          security: security !== '--' ? security : 'Open',
          secured: security !== '--',
          connected: inUse,
        })
      }
    }

    // Takrorlanuvchilarni olib tashlash (eng kuchli signal)
    const unique = []
    const seen = new Set()
    for (const net of networks) {
      if (!seen.has(net.ssid)) {
        seen.add(net.ssid)
        unique.push(net)
      }
    }

    unique.sort((a, b) => b.signal - a.signal)

    res.json({ success: true, networks: unique })
  } catch (error) {
    res.json({
      success: false,
      error: `Wi-Fi ro'yxatini olishda xato: ${error.message}`,
      networks: [],
    })
  }
})

// Tarmoqqa ulanish
app.post('/api/wifi/connect', async (req, res) => {
  const { ssid, password } = req.body

  if (!ssid) {
    return res.json({ success: false, error: 'SSID kiritilmagan' })
  }

  try {
    const hasNmcli = await checkNmcli()
    if (!hasNmcli) {
      return res.json({ success: false, error: 'NetworkManager o\'rnatilmagan' })
    }

    let command
    if (password) {
      // Xavfsiz: SSID va parolni argument sifatida berish
      command = `nmcli dev wifi connect "${ssid.replace(/"/g, '\\"')}" password "${password.replace(/"/g, '\\"')}"`
    } else {
      command = `nmcli dev wifi connect "${ssid.replace(/"/g, '\\"')}"`
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 })

    if (stdout.includes('successfully activated')) {
      res.json({ success: true, message: `${ssid} ga muvaffaqiyatli ulandi` })
    } else {
      res.json({
        success: false,
        error: stderr || 'Ulanishda xato yuz berdi',
      })
    }
  } catch (error) {
    let errorMessage = 'Ulanishda xato yuz berdi'

    if (error.message.includes('Secrets were required')) {
      errorMessage = 'Parol noto\'g\'ri yoki tarmoq parol talab qiladi'
    } else if (error.message.includes('No network with SSID')) {
      errorMessage = 'Tarmoq topilmadi'
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Ulanish vaqti tugadi (timeout)'
    }

    res.json({ success: false, error: errorMessage })
  }
})

// Ulanish holati
app.get('/api/wifi/status', async (req, res) => {
  try {
    const hasNmcli = await checkNmcli()
    if (!hasNmcli) {
      return res.json({
        success: false,
        connected: false,
        error: 'NetworkManager o\'rnatilmagan',
      })
    }

    const { stdout } = await execAsync('nmcli -f NAME,TYPE,STATE dev status')
    const lines = stdout.trim().split('\n').slice(1)

    let wifiConnection = null
    for (const line of lines) {
      if (line.includes('wifi') && line.includes('connected')) {
        const parts = line.trim().split(/\s{2,}/)
        wifiConnection = { name: parts[0]?.trim(), state: 'connected' }
        break
      }
    }

    if (wifiConnection) {
      // IP manzilini olish
      try {
        const { stdout: ipOut } = await execAsync(
          `nmcli -f IP4.ADDRESS con show "${wifiConnection.name}"`
        )
        const ipMatch = ipOut.match(/\d+\.\d+\.\d+\.\d+/)
        wifiConnection.ip = ipMatch ? ipMatch[0] : null
      } catch {}

      res.json({ success: true, connected: true, connection: wifiConnection })
    } else {
      res.json({ success: true, connected: false, connection: null })
    }
  } catch (error) {
    res.json({
      success: false,
      connected: false,
      error: error.message,
    })
  }
})

// Tarmoqdan uzilish
app.post('/api/wifi/disconnect', async (req, res) => {
  try {
    await execAsync('nmcli dev disconnect wlan0 2>/dev/null || nmcli networking off && nmcli networking on')
    res.json({ success: true, message: 'Tarmoqdan uzildi' })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Dagzo Wi-Fi API ishga tushdi: http://127.0.0.1:${PORT}`)
})

module.exports = app
