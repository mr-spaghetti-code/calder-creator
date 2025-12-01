import React, { useState, useMemo, useEffect } from 'react'
import useMobileStore from '../store/mobileStore'
import { 
  collectArms, 
  collectWeights, 
  calculateTotalWireLength,
  calculateSubtreeMass,
  calculateMobileDimensions
} from '../models/mobileTree'
import { 
  getLength, 
  getMass, 
  getLengthUnit, 
  getMassUnit,
  getUnitSystem,
  subscribeToUnitSystem
} from '../config/units'
import { PRESET_LIST } from '../config/presets'
import BuildSpecsPanel from './BuildSpecsPanel'

export default function EmptyPanel() {
  const mobile = useMobileStore((state) => state.mobile)
  const stats = useMobileStore((state) => state.getStats())
  const autoBalance = useMobileStore((state) => state.autoBalance)
  const resetMobile = useMobileStore((state) => state.resetMobile)
  const loadPreset = useMobileStore((state) => state.loadPreset)
  const isAnimating = useMobileStore((state) => state.isAnimating)
  
  const [showBuildSpecs, setShowBuildSpecs] = useState(false)
  
  // Subscribe to unit system changes
  const [unitSystem, setUnitSystem] = useState(getUnitSystem())
  useEffect(() => {
    return subscribeToUnitSystem(setUnitSystem)
  }, [])
  
  // Get unit labels
  const lengthUnit = getLengthUnit()
  const massUnit = getMassUnit()
  
  // Calculate stats in current unit system
  const displayStats = useMemo(() => {
    const dimensions = calculateMobileDimensions(mobile)
    const totalWire = calculateTotalWireLength(mobile)
    const arms = collectArms(mobile)
    const weights = collectWeights(mobile)
    
    return {
      width: getLength(dimensions.width),
      height: getLength(dimensions.height),
      totalMass: getMass(stats.totalMass),
      totalWire: getLength(totalWire) * 1.2, // Include 20% extra
      armCount: arms.length,
      weightCount: weights.length
    }
  }, [mobile, stats.totalMass, unitSystem])
  
  if (showBuildSpecs) {
    return <BuildSpecsPanel onClose={() => setShowBuildSpecs(false)} />
  }
  
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="3" r="1.5" />
          <line x1="12" y1="4.5" x2="12" y2="8" />
          <line x1="4" y1="8" x2="20" y2="8" />
          <circle cx="4" cy="8" r="0.5" fill="currentColor" />
          <circle cx="20" cy="8" r="0.5" fill="currentColor" />
          <line x1="4" y1="8" x2="4" y2="12" />
          <line x1="20" y1="8" x2="20" y2="12" />
          <circle cx="4" cy="14" r="2" />
          <circle cx="20" cy="14" r="2" />
        </svg>
      </div>
      
      <h3>Calder Mobile Studio</h3>
      <p>Click a weight to select it, or double-click to expand it into an arm with two new weights.</p>
      
      {/* Dimensions */}
      <div className="dimension-display">
        <div className="dimension-row">
          <span className="dimension-label">Size</span>
          <span className="dimension-value">
            {displayStats.width.toFixed(unitSystem === 'imperial' ? 1 : 0)} × {displayStats.height.toFixed(unitSystem === 'imperial' ? 1 : 0)} {lengthUnit}
          </span>
        </div>
        <div className="dimension-row">
          <span className="dimension-label">Total Weight</span>
          <span className="dimension-value">{displayStats.totalMass.toFixed(unitSystem === 'imperial' ? 1 : 0)}{massUnit}</span>
        </div>
        <div className="dimension-row">
          <span className="dimension-label">Wire Needed</span>
          <span className="dimension-value">~{displayStats.totalWire.toFixed(unitSystem === 'imperial' ? 1 : 0)} {lengthUnit}</span>
        </div>
      </div>
      
      <div className="stats" style={{ marginTop: '16px', width: '100%' }}>
        <div className="stat">
          <span className="stat-label">Arms</span>
          <span className="stat-value">{displayStats.armCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Weights</span>
          <span className="stat-value">{displayStats.weightCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Depth</span>
          <span className="stat-value">{stats.depth}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Max Depth</span>
          <span className="stat-value">5</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn btn-auto-balance" 
          onClick={autoBalance}
          disabled={isAnimating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
          </svg>
          {isAnimating ? 'Balancing...' : 'Auto-Balance'}
        </button>
        
        <button 
          className="btn btn-build-specs" 
          onClick={() => setShowBuildSpecs(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Build Specifications
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={resetMobile}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset Mobile
        </button>
      </div>
      
      {/* Preset Selector */}
      <div className="preset-section">
        <div className="preset-header">
          <span className="preset-title">Start from Template</span>
        </div>
        <div className="preset-grid">
          {PRESET_LIST.map((preset) => (
            <button
              key={preset.id}
              className="preset-btn"
              onClick={() => loadPreset(preset.id)}
              disabled={isAnimating}
              title={preset.description}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="help-text" style={{ marginTop: '20px' }}>
        <strong>Controls:</strong><br />
        • Left-drag: Orbit camera<br />
        • Scroll: Zoom<br />
        • Right-drag: Pan<br />
        • Click: Select element<br />
        • Double-click weight: Expand to arm<br />
        • Drag yellow ring: Adjust pivot
      </div>
    </div>
  )
}
