import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Books from './pages/Books'
import Videos from './pages/Videos'
import Tests from './pages/Tests'
import WiFi from './pages/WiFi'
import Settings from './pages/Settings'
import AdminExitModal from './components/AdminExitModal'

export default function App() {
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(true)

  useEffect(() => {
    // Electron fullscreen holatini sinxronlashtirish
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        setIsFullscreen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleExit = () => {
    if (window.dagzo) {
      window.dagzo.quitApp()
    } else {
      window.close()
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        onAdminExit={() => setShowAdminModal(true)}
        onExit={handleExit}
      />
      <div className="main-content">
        <TopBar
          isFullscreen={isFullscreen}
          onToggleFullscreen={async () => {
            if (window.dagzo) {
              const result = await window.dagzo.toggleFullscreen()
              setIsFullscreen(result.fullscreen)
            }
          }}
        />
        <div className="page-content fade-in">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/books" element={<Books />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/wifi" element={<WiFi />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {showAdminModal && (
        <AdminExitModal onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  )
}
