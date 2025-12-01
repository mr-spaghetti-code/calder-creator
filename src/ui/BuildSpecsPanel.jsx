import React, { useMemo, useState, useEffect } from 'react'
import useMobileStore from '../store/mobileStore'
import { 
  collectArms, 
  collectWeights, 
  calculateTotalWireLength,
  calculateSubtreeMass,
  calculateMobileDimensions
} from '../models/mobileTree'
import { 
  getCm, 
  getGrams, 
  getRecommendedWireGauge, 
  getRecommendedArmMaterial,
  WIRE_WEIGHT_PER_CM,
  getLength,
  getMass,
  getLengthUnit,
  getMassUnit,
  getUnitSystem,
  subscribeToUnitSystem
} from '../config/units'

export default function BuildSpecsPanel({ onClose }) {
  const mobile = useMobileStore((state) => state.mobile)
  
  // Subscribe to unit system changes
  const [unitSystem, setUnitSystem] = useState(getUnitSystem())
  useEffect(() => {
    return subscribeToUnitSystem(setUnitSystem)
  }, [])
  
  // Get unit labels
  const lengthUnit = getLengthUnit()
  const massUnit = getMassUnit()
  
  // Calculate all specifications
  const specs = useMemo(() => {
    const arms = collectArms(mobile)
    const weights = collectWeights(mobile)
    const totalWireLengthScene = calculateTotalWireLength(mobile)
    const totalMassScene = calculateSubtreeMass(mobile)
    const dimensions = calculateMobileDimensions(mobile)
    
    // Convert to metric for internal calculations (wire gauge recommendations, etc.)
    const totalWireCm = getCm(totalWireLengthScene)
    const totalWeightGrams = getGrams(totalMassScene)
    
    // Add 20% extra wire for loops and knots
    const totalWireWithExtra = totalWireCm * 1.2
    
    // Estimate wire weight
    const wireWeightGrams = totalWireWithExtra * WIRE_WEIGHT_PER_CM
    
    // Total weight including wire
    const totalWithWire = totalWeightGrams + wireWeightGrams
    
    // Get recommendations (always in metric internally)
    const wireGauge = getRecommendedWireGauge(totalWithWire)
    
    // Display values in current unit system
    const width = getLength(dimensions.width)
    const height = getLength(dimensions.height)
    const totalWireDisplay = getLength(totalWireLengthScene) * 1.2
    const totalMassDisplay = getMass(totalMassScene)
    const totalWithWireDisplay = unitSystem === 'imperial' 
      ? totalWithWire * 0.035274 
      : totalWithWire
    
    // Process arms with pivot info
    const armSpecs = arms.map((arm, index) => {
      const lengthCm = getCm(arm.length)
      const isRoot = arm.id === mobile.id
      const material = getRecommendedArmMaterial(lengthCm)
      
      return {
        id: arm.id,
        index: index + 1,
        isRoot,
        length: getLength(arm.length),
        pivotFromLeft: getLength(arm.pivotPosition * arm.length),
        pivotPercent: (arm.pivotPosition * 100).toFixed(0),
        wireLength: isRoot ? null : getLength(arm.wireLength ?? 0.7),
        material
      }
    })
    
    // Process weights
    const weightSpecs = weights.map((weight, index) => ({
      id: weight.id,
      index: index + 1,
      mass: getMass(weight.mass),
      size: getLength(weight.size),
      shape: weight.shape,
      color: weight.color,
      wireLength: getLength(weight.wireLength ?? 0.7)
    }))
    
    return {
      arms: armSpecs,
      weights: weightSpecs,
      totalWire: totalWireDisplay,
      totalMass: totalMassDisplay,
      totalWithWire: totalWithWireDisplay,
      width,
      height,
      wireGauge,
      armCount: arms.length,
      weightCount: weights.length
    }
  }, [mobile, unitSystem])
  
  // Generate exportable text
  const generateExportText = () => {
    const decimals = unitSystem === 'imperial' ? 1 : 0
    const massDecimals = unitSystem === 'imperial' ? 1 : 0
    
    let text = `MOBILE BUILD SPECIFICATIONS
${'='.repeat(50)}

OVERVIEW
--------
Total Width: ${specs.width.toFixed(1)} ${lengthUnit}
Total Height: ${specs.height.toFixed(1)} ${lengthUnit}
Number of Arms: ${specs.armCount}
Number of Weights: ${specs.weightCount}
Total Weight: ${specs.totalWithWire.toFixed(massDecimals)}${massUnit} (includes wire)

MATERIALS NEEDED
----------------
Wire: ${specs.totalWire.toFixed(decimals)} ${lengthUnit} total (includes 20% extra for knots)
      Recommended: ${specs.wireGauge.gauge} (${specs.wireGauge.diameter} diameter)

ARM CUT LIST
------------
`
    specs.arms.forEach(arm => {
      text += `Arm #${arm.index}${arm.isRoot ? ' (ROOT)' : ''}: ${arm.length.toFixed(1)} ${lengthUnit}
  - Mark pivot at ${arm.pivotFromLeft.toFixed(1)} ${lengthUnit} from left end (${arm.pivotPercent}%)
  - Suggested material: ${arm.material.material}, ${arm.material.diameter} diameter
`
      if (arm.wireLength) {
        text += `  - Suspension wire: ${arm.wireLength.toFixed(1)} ${lengthUnit}\n`
      }
      text += '\n'
    })

    text += `WEIGHT SPECIFICATIONS
---------------------
`
    specs.weights.forEach(weight => {
      text += `Weight #${weight.index}: ${weight.mass.toFixed(massDecimals)}${massUnit}
  - Shape: ${weight.shape}
  - Size: ~${weight.size.toFixed(1)} ${lengthUnit} diameter
  - Suspension wire: ${weight.wireLength.toFixed(1)} ${lengthUnit}
  - Color: ${weight.color}

`
    })

    text += `ASSEMBLY TIPS
-------------
1. Start from the bottom tier and work your way up
2. Use a small drill or awl to mark pivot points on arms
3. Balance each arm individually before connecting to upper tiers
4. Allow slight adjustment room - real materials may vary
5. Hang from ceiling hook or stand with swivel for best motion

Generated by Calder Creator
`
    return text
  }
  
  const handleExport = () => {
    const text = generateExportText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mobile-build-specs.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleCopy = () => {
    const text = generateExportText()
    navigator.clipboard.writeText(text)
  }
  
  return (
    <div className="build-specs-panel">
      <div className="panel-header">
        <div className="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2>Build Specifications</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Overview Stats */}
      <div className="panel-section">
        <span className="panel-section-title">Overall Dimensions</span>
        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-label">Width</span>
            <span className="spec-value">{specs.width.toFixed(1)}<span className="unit">{lengthUnit}</span></span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Height</span>
            <span className="spec-value">{specs.height.toFixed(1)}<span className="unit">{lengthUnit}</span></span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Total Weight</span>
            <span className="spec-value">{specs.totalWithWire.toFixed(unitSystem === 'imperial' ? 1 : 0)}<span className="unit">{massUnit}</span></span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Parts</span>
            <span className="spec-value">{specs.armCount} arms, {specs.weightCount} weights</span>
          </div>
        </div>
      </div>
      
      {/* Wire Requirements */}
      <div className="panel-section">
        <span className="panel-section-title">Wire Requirements</span>
        <div className="wire-specs">
          <div className="wire-total">
            <span className="wire-amount">{specs.totalWire.toFixed(unitSystem === 'imperial' ? 1 : 0)} {lengthUnit}</span>
            <span className="wire-note">total wire needed (includes 20% extra)</span>
          </div>
          <div className="wire-recommendation">
            <span className="rec-label">Recommended gauge:</span>
            <span className="rec-value">{specs.wireGauge.gauge} ({specs.wireGauge.diameter})</span>
          </div>
        </div>
      </div>
      
      {/* Arm Cut List */}
      <div className="panel-section">
        <span className="panel-section-title">Arm Cut List</span>
        <div className="cut-list">
          {specs.arms.map(arm => (
            <div key={arm.id} className="cut-item">
              <div className="cut-header">
                <span className="cut-number">Arm #{arm.index}</span>
                {arm.isRoot && <span className="root-badge">ROOT</span>}
                <span className="cut-length">{arm.length.toFixed(1)} {lengthUnit}</span>
              </div>
              <div className="cut-details">
                <div className="pivot-info">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Mark pivot at <strong>{arm.pivotFromLeft.toFixed(1)} {lengthUnit}</strong> from left ({arm.pivotPercent}%)</span>
                </div>
                <div className="material-info">
                  {arm.material.material}, {arm.material.diameter}
                </div>
                {arm.wireLength && (
                  <div className="wire-info">
                    Wire to parent: {arm.wireLength.toFixed(1)} {lengthUnit}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Weight List */}
      <div className="panel-section">
        <span className="panel-section-title">Weight Specifications</span>
        <div className="weight-list">
          {specs.weights.map(weight => (
            <div key={weight.id} className="weight-item">
              <div className="weight-header">
                <div className="weight-color" style={{ backgroundColor: weight.color }} />
                <span className="weight-number">Weight #{weight.index}</span>
                <span className="weight-mass">{weight.mass.toFixed(unitSystem === 'imperial' ? 1 : 0)}{massUnit}</span>
              </div>
              <div className="weight-details">
                <span className="weight-shape">{weight.shape}</span>
                <span className="weight-size">~{weight.size.toFixed(1)} {lengthUnit}</span>
                <span className="weight-wire">wire: {weight.wireLength.toFixed(1)} {lengthUnit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Construction Tips */}
      <div className="panel-section">
        <span className="panel-section-title">Construction Tips</span>
        <ul className="tips-list">
          <li>Start from the bottom tier and work upward</li>
          <li>Mark pivot points with a small drill or awl</li>
          <li>Balance each arm before connecting to upper tiers</li>
          <li>Use brass wire or fishing line for durability</li>
          <li>Hang from a swivel hook for natural rotation</li>
        </ul>
      </div>
      
      {/* Export Actions */}
      <div className="panel-section">
        <span className="panel-section-title">Export</span>
        <div className="export-buttons">
          <button className="btn btn-primary" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Specs
          </button>
          <button className="btn btn-secondary" onClick={handleCopy}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}

