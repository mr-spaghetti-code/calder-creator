import React, { useState, useEffect } from 'react'
import useMobileStore from '../store/mobileStore'
import { canExpandAt, generateBlobPoints } from '../models/mobileTree'
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
import { MODEL_LIST, isModelShape } from '../config/models'

// Thickness range for disk and organic shapes (in scene units, 1 unit = 10cm)
const THICKNESS_RANGE = {
  min: 0.02,  // 2mm
  max: 0.2,   // 2cm
  step: 0.01
}

const COLOR_SWATCHES = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
  '#f5f5f4', // white
]

export default function WeightPanel({ weight }) {
  const mobile = useMobileStore((state) => state.mobile)
  const updateWeight = useMobileStore((state) => state.updateWeight)
  const deleteNode = useMobileStore((state) => state.deleteNode)
  const expandWeight = useMobileStore((state) => state.expandWeight)
  const clearSelection = useMobileStore((state) => state.clearSelection)
  
  // Subscribe to unit system changes
  const [unitSystem, setUnitSystem] = useState(getUnitSystem())
  useEffect(() => {
    return subscribeToUnitSystem(setUnitSystem)
  }, [])
  
  const canExpand = canExpandAt(mobile, weight.id)
  
  const handleMassChange = (e) => {
    updateWeight(weight.id, { mass: parseFloat(e.target.value) || METRIC_RANGES.weightMass.min })
  }
  
  const handleSizeChange = (e) => {
    updateWeight(weight.id, { size: parseFloat(e.target.value) || METRIC_RANGES.weightSize.min })
  }
  
  const handleWireLengthChange = (e) => {
    updateWeight(weight.id, { wireLength: parseFloat(e.target.value) || METRIC_RANGES.wireLength.min })
  }
  
  const handleShapeChange = (shape) => {
    // Clear model-related properties when switching to primitive shape
    const updates = { shape, modelId: null, modelScale: null }
    
    // Generate blob points when switching to organic shape
    if (shape === 'organic' && !weight.blobPoints) {
      const seed = Date.now()
      updates.blobPoints = generateBlobPoints(seed)
      updates.blobSeed = seed
    }
    
    updateWeight(weight.id, updates)
  }
  
  const handleThicknessChange = (e) => {
    updateWeight(weight.id, { thickness: parseFloat(e.target.value) || THICKNESS_RANGE.min })
  }
  
  const handleRegenerateBlobPoints = () => {
    const seed = Date.now()
    updateWeight(weight.id, { 
      blobPoints: generateBlobPoints(seed),
      blobSeed: seed
    })
  }
  
  const handleModelSelect = (modelId) => {
    const model = MODEL_LIST.find(m => m.id === modelId)
    updateWeight(weight.id, { 
      shape: 'model', 
      modelId,
      modelScale: model?.defaultScale ?? 0.3 
    })
  }
  
  const handleModelScaleChange = (e) => {
    updateWeight(weight.id, { modelScale: parseFloat(e.target.value) || 0.3 })
  }
  
  const handleColorChange = (color) => {
    updateWeight(weight.id, { color })
  }
  
  const isModel = isModelShape(weight.shape)
  
  const handleDelete = () => {
    deleteNode(weight.id)
    clearSelection()
  }
  
  const handleExpand = () => {
    if (canExpand) {
      expandWeight(weight.id)
    }
  }
  
  // Get unit labels
  const lengthUnit = getLengthUnit()
  const massUnit = getMassUnit()
  
  // Get values in current unit system
  const massDisplay = getMass(weight.mass)
  const sizeDisplay = getLength(weight.size)
  const wireLengthDisplay = getLength(weight.wireLength ?? 0.7)
  
  // Get range displays
  const weightMassRange = getRangeDisplay('weightMass')
  const weightSizeRange = getRangeDisplay('weightSize')
  const wireLengthRange = getRangeDisplay('wireLength')
  
  return (
    <>
      <div className="panel-header">
        <div className="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </div>
        <h2>Weight</h2>
      </div>
      
      <div className="panel-section">
        <span className="panel-section-title">Properties</span>
        
        <div className="control-group">
          <label className="control-label">
            Mass
            <span className="control-value metric-value">{massDisplay.toFixed(unitSystem === 'imperial' ? 1 : 0)}<span className="unit">{massUnit}</span></span>
          </label>
          <input 
            type="range" 
            min={METRIC_RANGES.weightMass.min}
            max={METRIC_RANGES.weightMass.max}
            step={METRIC_RANGES.weightMass.step}
            value={weight.mass}
            onChange={handleMassChange}
          />
          <div className="range-labels">
            <span>{weightMassRange.min}{weightMassRange.unit}</span>
            <span>{weightMassRange.max}{weightMassRange.unit}</span>
          </div>
        </div>
        
        {!isModel && (
          <div className="control-group">
            <label className="control-label">
              Size (diameter)
              <span className="control-value metric-value">{sizeDisplay.toFixed(1)}<span className="unit">{lengthUnit}</span></span>
            </label>
            <input 
              type="range" 
              min={METRIC_RANGES.weightSize.min}
              max={METRIC_RANGES.weightSize.max}
              step={METRIC_RANGES.weightSize.step}
              value={weight.size}
              onChange={handleSizeChange}
            />
            <div className="range-labels">
              <span>{weightSizeRange.min}{weightSizeRange.unit}</span>
              <span>{weightSizeRange.max}{weightSizeRange.unit}</span>
            </div>
          </div>
        )}
        
        {isModel && (
          <div className="control-group">
            <label className="control-label">
              Model Scale
              <span className="control-value metric-value">{((weight.modelScale ?? 0.3) * 100).toFixed(0)}<span className="unit">%</span></span>
            </label>
            <input 
              type="range" 
              min={0.05}
              max={1.0}
              step={0.01}
              value={weight.modelScale ?? 0.3}
              onChange={handleModelScaleChange}
            />
            <div className="range-labels">
              <span>5%</span>
              <span>100%</span>
            </div>
          </div>
        )}
        
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
            value={weight.wireLength ?? 0.7}
            onChange={handleWireLengthChange}
          />
          <div className="range-labels">
            <span>{wireLengthRange.min}{wireLengthRange.unit}</span>
            <span>{wireLengthRange.max}{wireLengthRange.unit}</span>
          </div>
          <div className="help-text" style={{ marginTop: '8px', fontSize: '11px' }}>
            Distance from arm endpoint to this weight
          </div>
        </div>
      </div>
      
      <div className="panel-section">
        <span className="panel-section-title">Shape</span>
        
        <div className="shape-selector">
          <button 
            className={`shape-btn ${weight.shape === 'sphere' ? 'active' : ''}`}
            onClick={() => handleShapeChange('sphere')}
            title="Sphere"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'cube' ? 'active' : ''}`}
            onClick={() => handleShapeChange('cube')}
            title="Cube"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="1" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'cylinder' ? 'active' : ''}`}
            onClick={() => handleShapeChange('cylinder')}
            title="Cylinder"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="6" rx="6" ry="3" />
              <ellipse cx="12" cy="18" rx="6" ry="3" />
              <line x1="6" y1="6" x2="6" y2="18" />
              <line x1="18" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'cone' ? 'active' : ''}`}
            onClick={() => handleShapeChange('cone')}
            title="Cone"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,4 4,20 20,20" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'torus' ? 'active' : ''}`}
            onClick={() => handleShapeChange('torus')}
            title="Torus (Donut)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="12" rx="9" ry="5" />
              <ellipse cx="12" cy="12" rx="4" ry="2" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'octahedron' ? 'active' : ''}`}
            onClick={() => handleShapeChange('octahedron')}
            title="Octahedron (Diamond)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,2 22,12 12,22 2,12" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'tetrahedron' ? 'active' : ''}`}
            onClick={() => handleShapeChange('tetrahedron')}
            title="Tetrahedron (Pyramid)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,3 3,20 21,20" />
              <line x1="12" y1="3" x2="12" y2="20" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'disk' ? 'active' : ''}`}
            onClick={() => handleShapeChange('disk')}
            title="Disk (Flat Circle)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="12" rx="9" ry="3" />
            </svg>
          </button>
          
          <button 
            className={`shape-btn ${weight.shape === 'organic' ? 'active' : ''}`}
            onClick={() => handleShapeChange('organic')}
            title="Organic (Calder-style blob)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4 Q18 6 20 12 Q18 18 12 20 Q6 18 4 12 Q6 6 12 4" />
            </svg>
          </button>
        </div>
        
        {/* Thickness control for flat shapes */}
        {(weight.shape === 'disk' || weight.shape === 'organic') && (
          <div className="control-group" style={{ marginTop: '12px' }}>
            <label className="control-label">
              Thickness
              <span className="control-value metric-value">{(getLength(weight.thickness ?? 0.05)).toFixed(1)}<span className="unit">{lengthUnit}</span></span>
            </label>
            <input 
              type="range" 
              min={THICKNESS_RANGE.min}
              max={THICKNESS_RANGE.max}
              step={THICKNESS_RANGE.step}
              value={weight.thickness ?? 0.05}
              onChange={handleThicknessChange}
            />
            <div className="range-labels">
              <span>{(getLength(THICKNESS_RANGE.min)).toFixed(1)}{lengthUnit}</span>
              <span>{(getLength(THICKNESS_RANGE.max)).toFixed(1)}{lengthUnit}</span>
            </div>
          </div>
        )}
        
        {/* Regenerate button for organic shape */}
        {weight.shape === 'organic' && (
          <button 
            className="btn btn-secondary"
            onClick={handleRegenerateBlobPoints}
            style={{ width: '100%', marginTop: '12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9" />
              <path d="M21 3v9h-9" />
            </svg>
            Regenerate Shape
          </button>
        )}
      </div>
      
      <div className="panel-section">
        <span className="panel-section-title">3D Models</span>
        
        <div className="model-selector">
          {MODEL_LIST.map((model) => (
            <button
              key={model.id}
              className={`model-btn ${isModel && weight.modelId === model.id ? 'active' : ''}`}
              onClick={() => handleModelSelect(model.id)}
              title={model.description}
            >
              <span className="model-icon">{model.icon}</span>
              <span className="model-name">{model.name}</span>
            </button>
          ))}
        </div>
        
        {isModel && (
          <div className="help-text" style={{ marginTop: '8px', fontSize: '11px' }}>
            Mass is auto-calculated from model volume
          </div>
        )}
      </div>
      
      {!isModel && (
        <div className="panel-section">
          <span className="panel-section-title">Color</span>
        
        <div className="color-swatches">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              className={`color-swatch ${weight.color === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
        
        <div className="control-group" style={{ marginTop: '12px' }}>
          <label className="control-label">Custom Color</label>
          <input 
            type="color" 
            value={weight.color}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>
        </div>
      )}
      
      <div className="panel-section">
        <span className="panel-section-title">Actions</span>
        
        <button 
          className="btn btn-primary"
          onClick={handleExpand}
          disabled={!canExpand}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {canExpand ? 'Expand to Arm' : 'Max Depth Reached'}
        </button>
        
        <button 
          className="btn btn-danger"
          onClick={handleDelete}
          style={{ width: '100%' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete Weight
        </button>
      </div>
    </>
  )
}
