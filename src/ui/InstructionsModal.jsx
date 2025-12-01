import React from 'react'

export default function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        
        <div className="modal-header">
          <div className="modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <h1>Welcome to Calder Mobile Studio</h1>
          <p className="modal-subtitle">Design and balance kinetic sculptures inspired by Alexander Calder</p>
        </div>
        
        <div className="modal-content">
          <section className="instruction-section">
            <h2>
              <span className="section-icon">🎯</span>
              Getting Started
            </h2>
            <p>Your mobile starts with a single weight hanging from a suspension point. Build complexity by expanding weights into balanced arms.</p>
          </section>
          
          <section className="instruction-section">
            <h2>
              <span className="section-icon">🖱️</span>
              Camera Controls
            </h2>
            <div className="controls-grid">
              <div className="control-item">
                <span className="control-key">Left Drag</span>
                <span className="control-desc">Orbit around</span>
              </div>
              <div className="control-item">
                <span className="control-key">Scroll</span>
                <span className="control-desc">Zoom in/out</span>
              </div>
              <div className="control-item">
                <span className="control-key">Right Drag</span>
                <span className="control-desc">Pan view</span>
              </div>
            </div>
          </section>
          
          <section className="instruction-section">
            <h2>
              <span className="section-icon">✨</span>
              Building Your Mobile
            </h2>
            <ul className="instruction-list">
              <li>
                <strong>Select</strong> — Click any weight or arm to select it and edit its properties in the side panel
              </li>
              <li>
                <strong>Expand</strong> — Double-click a weight to transform it into an arm with two new weights
              </li>
              <li>
                <strong>Adjust Pivot</strong> — Drag the yellow ring on any arm to shift the balance point
              </li>
              <li>
                <strong>Delete</strong> — Select an element and press <kbd>Delete</kbd> or <kbd>Backspace</kbd>
              </li>
            </ul>
          </section>
          
          <section className="instruction-section">
            <h2>
              <span className="section-icon">⚖️</span>
              Balancing
            </h2>
            <p>A balanced mobile hangs level. Adjust weights, sizes, and pivot positions to achieve equilibrium — or click <strong>Auto-Balance</strong> to let the simulator find the perfect pivot points for you.</p>
          </section>
          
          <section className="instruction-section">
            <h2>
              <span className="section-icon">🔧</span>
              Tools & Features
            </h2>
            <ul className="instruction-list">
              <li><strong>Camera Lock</strong> — Lock the camera to enable precise pivot dragging</li>
              <li><strong>Unit Toggle</strong> — Switch between metric (cm/g) and imperial (in/oz)</li>
              <li><strong>Build Specs</strong> — Export measurements for building a real mobile</li>
              <li><strong>Presets</strong> — Start from pre-made templates</li>
            </ul>
          </section>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary modal-dismiss" onClick={onClose}>
            Got it, let's create!
          </button>
        </div>
      </div>
    </div>
  )
}

