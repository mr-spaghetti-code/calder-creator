import React, { useState, useRef, useEffect } from 'react'
import useMobileStore from '../store/mobileStore'

export default function PhysicsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  const isPaused = useMobileStore((state) => state.isPaused)
  const timeScale = useMobileStore((state) => state.timeScale)
  const damping = useMobileStore((state) => state.damping)
  const windIntensity = useMobileStore((state) => state.windIntensity)
  const windMode = useMobileStore((state) => state.windMode)
  const collisionsDetected = useMobileStore((state) => state.collisionsDetected)
  
  const togglePhysics = useMobileStore((state) => state.togglePhysics)
  const togglePause = useMobileStore((state) => state.togglePause)
  const setTimeScale = useMobileStore((state) => state.setTimeScale)
  const setDamping = useMobileStore((state) => state.setDamping)
  const setWindIntensity = useMobileStore((state) => state.setWindIntensity)
  const setWindMode = useMobileStore((state) => state.setWindMode)
  const resetToEquilibrium = useMobileStore((state) => state.resetToEquilibrium)
  
  const hasCollisions = collisionsDetected.length > 0
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="physics-dropdown" ref={dropdownRef}>
      <button 
        className={`physics-toggle-btn ${physicsEnabled ? 'active' : ''} ${hasCollisions ? 'warning' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Physics simulation settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {physicsEnabled ? (
            <>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </>
          ) : (
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          )}
        </svg>
        <span>{physicsEnabled ? 'Physics ON' : 'Physics OFF'}</span>
        <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points={isOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </button>
      
      {isOpen && (
        <div className="physics-dropdown-content">
          {/* Physics Toggle */}
          <div className="dropdown-section">
            <button 
              className={`dropdown-toggle-btn ${physicsEnabled ? 'enabled' : ''}`}
              onClick={togglePhysics}
            >
              {physicsEnabled ? 'Disable Physics' : 'Enable Physics'}
            </button>
          </div>
          
          {physicsEnabled && (
            <>
              {/* Time Controls */}
              <div className="dropdown-section">
                <div className="section-label">Time Controls</div>
                <div className="time-controls-row">
                  <button 
                    className={`icon-btn ${isPaused ? 'paused' : 'playing'}`}
                    onClick={togglePause}
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    )}
                  </button>
                  
                  <button 
                    className="icon-btn reset"
                    onClick={resetToEquilibrium}
                    title="Reset to equilibrium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                  
                  <div className="speed-slider">
                    <span className="slider-label">Speed</span>
                    <input 
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={timeScale}
                      onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{timeScale.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
              
              {/* Damping */}
              <div className="dropdown-section">
                <div className="section-label">
                  <span>Air Resistance</span>
                  <span className="value">{Math.round(damping * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={damping}
                  onChange={(e) => setDamping(parseFloat(e.target.value))}
                />
              </div>
              
              {/* Wind */}
              <div className="dropdown-section">
                <div className="section-label">
                  <span>Wind</span>
                  <span className="value">{Math.round(windIntensity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={windIntensity}
                  onChange={(e) => setWindIntensity(parseFloat(e.target.value))}
                />
                
                {windIntensity > 0 && (
                  <div className="wind-mode-btns">
                    <button 
                      className={windMode === 'uniform' ? 'active' : ''}
                      onClick={() => setWindMode('uniform')}
                    >
                      Steady
                    </button>
                    <button 
                      className={windMode === 'turbulent' ? 'active' : ''}
                      onClick={() => setWindMode('turbulent')}
                    >
                      Turbulent
                    </button>
                  </div>
                )}
              </div>
              
              {/* Collision Warning */}
              {hasCollisions && (
                <div className="dropdown-section collision-alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Collision detected!</span>
                </div>
              )}
              
              {/* Tip */}
              <div className="dropdown-tip">
                Drag elements to push them
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

