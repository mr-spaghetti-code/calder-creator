/**
 * Registry of available GLB models for use as weights
 * Each model has metadata for display and default scaling
 */

export const AVAILABLE_MODELS = {
  earth: {
    id: 'earth',
    path: '/assets/earth.glb',
    name: 'Earth',
    icon: '🌍',
    defaultScale: 0.3,
    description: 'Low-poly Earth globe'
  },
  house: {
    id: 'house',
    path: '/assets/house.glb',
    name: 'House',
    icon: '🏠',
    defaultScale: 0.8,
    description: 'Low-poly house model'
  },
  jupiter: {
    id: 'jupiter',
    path: '/assets/jupiter.glb',
    name: 'Jupiter',
    icon: '🪐',
    defaultScale: 0.35,
    description: 'Low-poly Jupiter planet'
  }
}

// Array version for iteration in UI
export const MODEL_LIST = Object.values(AVAILABLE_MODELS)

// Get model by ID
export function getModelById(modelId) {
  return AVAILABLE_MODELS[modelId] || null
}

// Check if a shape value represents a model
export function isModelShape(shape) {
  return shape === 'model'
}

