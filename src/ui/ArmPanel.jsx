import React, { useState, useEffect } from 'react'
import useMobileStore from '../store/mobileStore'
import { calculateBalanceRatio } from '../physics/balanceSolver'
import { calculateSubtreeMass } from '../models/mobileTree'
import { 
  METRIC_RANGES, 
  getLength, 
  getMass, 
  getLengthUnit, 
  getMassUnit,
  getUnitSystem,
  subscribeToUnitSystem,
  getRangeDisplay
} from '../config/units'

export default function ArmPanel({ arm }) {
  const mobile = useMobileStore((state) => state.mobile)
  const updateArm = useMobileStore((state) => state.updateArm)
  const deleteNode = useMobileStore((state) => state.deleteNode)
  const clearSelection = useMobileStore((state) => state.clearSelection)
  
  // Subscribe to unit system changes
  const [unitSystem, setUnitSystem] = useState(getUnitSystem())
  useEffect(() => {
    return subscribeToUnitSystem(setUnitSystem)
  }, [])
  
  const isRoot = mobile.id === arm.id
  const balanceRatio = calculateBalanceRatio(arm)
  const leftMass = calculateSubtreeMass(arm.leftChild)
  const rightMass = calculateSubtreeMass(arm.rightChild)
  
  const handleLengthChange = (e) => {
    updateArm(arm.id, { length: parseFloat(e.target.value) || METRIC_RANGES.armLength.min })
  }
  
  const handleWireLengthChange = (e) => {
    updateArm(arm.id, { wireLength: parseFloat(e.target.value) || METRIC_RANGES.wireLength.min })
  }
  
  const handleDelete = () => {
    if (!isRoot) {
      deleteNode(arm.id)
      clearSelection()
    }
  }
  
  // Get unit labels
  const lengthUnit = getLengthUnit()
  const massUnit = getMassUnit()
  
  // Calculate values in current unit system
  const lengthDisplay = getLength(arm.length)
  const wireLengthDisplay = getLength(arm.wireLength ?? 0.7)
  const pivotFromLeftDisplay = getLength(arm.pivotPosition * arm.length)
  const pivotFromRightDisplay = getLength((1 - arm.pivotPosition) * arm.length)
  const leftMassDisplay = getMass(leftMass)
  const rightMassDisplay = getMass(rightMass)
  
  // Get range displays
  const armLengthRange = getRangeDisplay('armLength')
  const wireLengthRange = getRangeDisplay('wireLength')
  
  // Calculate balance percentage
  const balancePercent = Math.round(balanceRatio * 100)
  
  // Get balance status text and color
  let balanceStatus, balanceColor
  if (balancePercent >= 95) {
    balanceStatus = 'Balanced'
    balanceColor = '#22c55e'
  } else if (balancePercent >= 70) {
    balanceStatus = 'Slightly Unbalanced'
    balanceColor = '#eab308'
  } else {
    balanceStatus = 'Unbalanced'
    balanceColor = '#ef4444'
  }
  
  return (
    <>
      <div className="panel-header">
        <div className="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <h2>Arm {isRoot ? '(Root)' : ''}</h2>
      </div>
      
      <div className="panel-section">
        <span className="panel-section-title">Dimensions</span>
        
        <div className="control-group">
          <label className="control-label">
            Total Length
            <span className="control-value metric-value">{lengthDisplay.toFixed(1)}<span className="unit">{lengthUnit}</span></span>
          </label>
          <input 
            type="range" 
            min={METRIC_RANGES.armLength.min}
            max={METRIC_RANGES.armLength.max}
            step={METRIC_RANGES.armLength.step}
            value={arm.length}
            onChange={handleLengthChange}
          />
          <div className="range-labels">
            <span>{armLengthRange.min}{armLengthRange.unit}</span>
            <span>{armLengthRange.max}{armLengthRange.unit}</span>
          </div>
        </div>
        
        <div className="control-group">
          <label className="control-label">
            Pivot Position
            <span className="control-value">{(arm.pivotPosition * 100).toFixed(0)}%</span>
          </label>
          
          {/* Pivot measurement breakdown */}
          <div className="pivot-breakdown">
            <div className="pivot-side">
              <span className="pivot-label">Left side</span>
              <span className="pivot-value">{pivotFromLeftDisplay.toFixed(1)} {lengthUnit}</span>
            </div>
            <div className="pivot-marker">●</div>
            <div className="pivot-side">
              <span className="pivot-label">Right side</span>
              <span className="pivot-value">{pivotFromRightDisplay.toFixed(1)} {lengthUnit}</span>
            </div>
          </div>
          
          <div className="help-text" style={{ marginTop: '8px', fontSize: '11px' }}>
            Drag the yellow ring on the arm to adjust pivot. Mark this point when building.
          </div>
        </div>
        
        {/* Wire length control - only show for non-root arms */}
        {!isRoot && (
          <div className="control-group">
            <label className="control-label">
              Wire Length
              <span className="control-value metric-value">{wireLengthDisplay.toFixed(1)}<span className="unit">{lengthUnit}</span></span>
            </label>
            <input 
              type="range" 
              min={METRIC_RANGES.wireLength.min}
              max={METRIC_RANGES.wireLength.max}
              step={METRIC_RANGES.wireLength.step}
              value={arm.wireLength ?? 0.7}
              onChange={handleWireLengthChange}
            />
            <div className="range-labels">
              <span>{wireLengthRange.min}{wireLengthRange.unit}</span>
              <span>{wireLengthRange.max}{wireLengthRange.unit}</span>
            </div>
            <div className="help-text" style={{ marginTop: '8px', fontSize: '11px' }}>
              Distance from parent arm to this arm's pivot point
            </div>
          </div>
        )}
      </div>
      
      <div className="panel-section">
        <span className="panel-section-title">Balance Status</span>
        
        <div className="stats" style={{ marginTop: '8px' }}>
          <div className="stat">
            <span className="stat-label">Left Mass</span>
            <span className="stat-value">{leftMassDisplay.toFixed(unitSystem === 'imperial' ? 1 : 0)}<span className="stat-unit">{massUnit}</span></span>
          </div>
          <div className="stat">
            <span className="stat-label">Right Mass</span>
            <span className="stat-value">{rightMassDisplay.toFixed(unitSystem === 'imperial' ? 1 : 0)}<span className="stat-unit">{massUnit}</span></span>
          </div>
          <div className="stat">
            <span className="stat-label">Balance</span>
            <span className="stat-value" style={{ color: balanceColor }}>
              {balancePercent}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Status</span>
            <span className="stat-value" style={{ color: balanceColor, fontSize: '12px' }}>
              {balanceStatus}
            </span>
          </div>
        </div>
        
        {/* Visual balance indicator */}
        <div style={{ 
          marginTop: '16px', 
          height: '8px', 
          background: 'var(--bg-tertiary)', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${balancePercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${balanceColor}, ${balanceColor})`,
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      {!isRoot && (
        <div className="panel-section">
          <span className="panel-section-title">Actions</span>
          
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            style={{ width: '100%' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete Arm & Subtree
          </button>
          
          <div className="help-text" style={{ marginTop: '8px', fontSize: '11px' }}>
            Warning: Deleting an arm removes all weights and arms attached below it.
          </div>
        </div>
      )}
      
      {isRoot && (
        <div className="help-text" style={{ marginTop: '16px' }}>
          This is the root arm and cannot be deleted. Adjust its length or pivot to balance the mobile.
        </div>
      )}
    </>
  )
}
