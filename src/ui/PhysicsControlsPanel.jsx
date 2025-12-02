import React from 'react'
import useMobileStore from '../store/mobileStore'

export default function PhysicsControlsPanel() {
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  const isPaused = useMobileStore((state) => state.isPaused)
  const timeScale = useMobileStore((state) => state.timeScale)
  const damping = useMobileStore((state) => state.damping)
  const windIntensity = useMobileStore((state) => state.windIntensity)
  const windMode = useMobileStore((state) => state.windMode)
  const showSwingEnvelope = useMobileStore((state) => state.showSwingEnvelope)
  const collisionsDetected = useMobileStore((state) => state.collisionsDetected)
  
  const togglePhysics = useMobileStore((state) => state.togglePhysics)
  const togglePause = useMobileStore((state) => state.togglePause)
  const setTimeScale = useMobileStore((state) => state.setTimeScale)
  const setDamping = useMobileStore((state) => state.setDamping)
  const setWindIntensity = useMobileStore((state) => state.setWindIntensity)
  const setWindMode = useMobileStore((state) => state.setWindMode)
  const toggleSwingEnvelope = useMobileStore((state) => state.toggleSwingEnvelope)
  const resetToEquilibrium = useMobileStore((state) => state.resetToEquilibrium)
  
  const hasCollisions = collisionsDetected.length > 0
  
  return (
    <div className="panel-section physics-controls">
      <div className="panel-section-title">Physics Simulation</div>
      
      {/* Physics Mode Toggle */}
      <div className="physics-toggle-row">
        <button 
          className={`btn physics-mode-btn ${physicsEnabled ? 'active' : ''}`}
          onClick={togglePhysics}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </button>
      </div>
      
      {physicsEnabled && (
        <>
          {/* Time Controls */}
          <div className="time-controls">
            <div className="time-controls-row">
              <button 
                className={`btn time-btn ${isPaused ? 'paused' : 'playing'}`}
                onClick={togglePause}
                title={isPaused ? 'Resume simulation' : 'Pause simulation'}
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
                className="btn reset-btn"
                onClick={resetToEquilibrium}
                title="Reset to equilibrium position"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              
              <div className="time-scale-control">
                <label>Speed</label>
                <input 
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={timeScale}
                  onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                />
                <span className="time-scale-value">{timeScale.toFixed(1)}x</span>
              </div>
            </div>
          </div>
          
          {/* Damping Control */}
          <div className="control-group">
            <div className="control-label">
              <span>Air Resistance</span>
              <span className="control-value">{Math.round(damping * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          
          {/* Wind Controls */}
          <div className="wind-controls">
            <div className="control-label">
              <span>Wind</span>
              <span className="control-value">{Math.round(windIntensity * 100)}%</span>
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
              <div className="wind-mode-toggle">
                <button 
                  className={`wind-mode-btn ${windMode === 'uniform' ? 'active' : ''}`}
                  onClick={() => setWindMode('uniform')}
                >
                  Steady
                </button>
                <button 
                  className={`wind-mode-btn ${windMode === 'turbulent' ? 'active' : ''}`}
                  onClick={() => setWindMode('turbulent')}
                >
                  Turbulent
                </button>
              </div>
            )}
          </div>
          
          {/* Collision Warning */}
          {hasCollisions && (
            <div className="collision-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Collision detected!</span>
            </div>
          )}
          
          {/* Swing Envelope Toggle */}
          <div className="envelope-toggle">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={showSwingEnvelope}
                onChange={toggleSwingEnvelope}
              />
              <span>Show swing envelope</span>
            </label>
          </div>
          
          {/* Tips */}
          <div className="physics-tips">
            <p>Drag mobile elements to push them</p>
          </div>
        </>
      )}
    </div>
  )
}

