import React, { useState, useEffect, useRef } from 'react'
import Scene from './components/Scene'
import Panel from './ui/Panel'
import InstructionsModal from './ui/InstructionsModal'
import useMobileStore from './store/mobileStore'
import { getUnitSystem, setUnitSystem, subscribeToUnitSystem } from './config/units'

const INSTRUCTIONS_SEEN_KEY = 'calder-instructions-seen'

export default function App() {
  const orbitControlsEnabled = useMobileStore((state) => state.orbitControlsEnabled)
  const toggleOrbitControls = useMobileStore((state) => state.toggleOrbitControls)
  const viewMode = useMobileStore((state) => state.viewMode)
  const toggleViewMode = useMobileStore((state) => state.toggleViewMode)
  const exportMobileJSON = useMobileStore((state) => state.exportMobileJSON)
  const importMobileJSON = useMobileStore((state) => state.importMobileJSON)
  const fileInputRef = useRef(null)
  const [unitSystem, setUnitSystemState] = useState(getUnitSystem())
  const [showInstructions, setShowInstructions] = useState(() => {
    return localStorage.getItem(INSTRUCTIONS_SEEN_KEY) !== 'true'
  })
  
  useEffect(() => {
    return subscribeToUnitSystem(setUnitSystemState)
  }, [])
  
  const handleCloseInstructions = () => {
    localStorage.setItem(INSTRUCTIONS_SEEN_KEY, 'true')
    setShowInstructions(false)
  }
  
  const handleOpenInstructions = () => {
    setShowInstructions(true)
  }
  
  const toggleUnits = () => {
    const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric'
    setUnitSystem(newSystem)
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        const result = importMobileJSON(json)
        if (!result.success) {
          alert(`Import failed: ${result.error}`)
        }
      } catch (err) {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    
    // Reset input so same file can be selected again
    event.target.value = ''
  }
  
  const isFreedom = unitSystem === 'imperial'
  
  return (
    <div className="app">
      <div className="canvas-container">
        <Scene />
        <div className="top-controls">
          <button 
            className={`orbit-toggle ${orbitControlsEnabled ? 'engaged' : 'disengaged'}`}
            onClick={toggleOrbitControls}
            title={orbitControlsEnabled ? 'Click to lock camera (for pivot editing)' : 'Click to unlock camera'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {orbitControlsEnabled ? (
                <>
                  {/* Unlocked/rotating camera icon */}
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </>
              ) : (
                <>
                  {/* Locked camera icon */}
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              )}
            </svg>
            <span>{orbitControlsEnabled ? 'Camera Free' : 'Camera Locked'}</span>
          </button>
          
          <button 
            className={`view-toggle ${viewMode === '3d' ? 'mode-3d' : 'mode-flat'}`}
            onClick={toggleViewMode}
            title={viewMode === 'flat' ? 'Switch to 3D view (randomize arm rotations)' : 'Switch to flat view (all arms aligned)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {viewMode === 'flat' ? (
                <>
                  {/* Flat/2D view icon - horizontal lines */}
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="6" y1="8" x2="18" y2="8" />
                  <line x1="6" y1="16" x2="18" y2="16" />
                </>
              ) : (
                <>
                  {/* 3D cube icon */}
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </>
              )}
            </svg>
            <span>{viewMode === 'flat' ? 'Flat View' : '3D View'}</span>
          </button>
          
          <button 
            className={`units-toggle ${isFreedom ? 'freedom' : 'metric'}`}
            onClick={toggleUnits}
            title={isFreedom ? 'Switch to Metric (cm/g)' : 'Switch to Freedom Units (in/oz)'}
          >
            <span className="units-icon">{isFreedom ? '🦅' : '📏'}</span>
            <span>{isFreedom ? 'Freedom Units' : 'Metric'}</span>
          </button>
          
          <button 
            className="help-toggle"
            onClick={handleOpenInstructions}
            title="How to use this app"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Help</span>
          </button>
          
          <div className="io-controls">
            <button 
              className="io-toggle export"
              onClick={exportMobileJSON}
              title="Export mobile as JSON"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export</span>
            </button>
            
            <button 
              className="io-toggle import"
              onClick={handleImportClick}
              title="Import mobile from JSON"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Import</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
      <Panel />
      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={handleCloseInstructions} 
      />
    </div>
  )
}

