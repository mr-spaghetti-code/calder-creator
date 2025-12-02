/**
 * Preset mobile configurations for users to start from
 * Each preset is auto-balanced and showcases different design possibilities
 */

// Note: Preset trees don't have IDs - they're generated fresh when loaded
// Mass unit: 1 = 50g, lengths in scene units (1 = 10cm)

export const MOBILE_PRESETS = {
  simple: {
    id: 'simple',
    name: 'Simple Start',
    icon: '⚖️',
    description: 'Basic two-weight mobile',
    tree: {
      type: 'arm',
      length: 4,
      pivotPosition: 0.5,
      wireLength: 0.7,
      leftChild: {
        type: 'weight',
        mass: 1,
        shape: 'sphere',
        size: 0.3,
        color: '#f97316',
        wireLength: 0.7
      },
      rightChild: {
        type: 'weight',
        mass: 1,
        shape: 'sphere',
        size: 0.3,
        color: '#8b5cf6',
        wireLength: 0.7
      }
    }
  },
  
  calderPastels: {
    id: 'calderPastels',
    name: 'Calder Pastels',
    icon: '🎨',
    description: 'Organic blobs in soft pastel harmony',
    tree: {
      type: 'arm',
      length: 7,
      pivotPosition: 0.45,
      wireLength: 0.5,
      leftChild: {
        type: 'arm',
        length: 5,
        pivotPosition: 0.5,
        wireLength: 1.8,
        leftChild: {
          type: 'arm',
          length: 4,
          pivotPosition: 0.55,
          wireLength: 1.6,
          leftChild: {
            type: 'arm',
            length: 3,
            pivotPosition: 0.5,
            wireLength: 1.4,
            leftChild: {
              type: 'weight',
              mass: 0.8,
              shape: 'organic',
              size: 0.35,
              thickness: 0.06,
              color: '#FFB5BA',
              wireLength: 1.2
            },
            rightChild: {
              type: 'weight',
              mass: 0.8,
              shape: 'organic',
              size: 0.32,
              thickness: 0.05,
              color: '#B4D7E8',
              wireLength: 1.4
            }
          },
          rightChild: {
            type: 'weight',
            mass: 1.2,
            shape: 'organic',
            size: 0.4,
            thickness: 0.07,
            color: '#C1E1C1',
            wireLength: 1.0
          }
        },
        rightChild: {
          type: 'arm',
          length: 3.5,
          pivotPosition: 0.45,
          wireLength: 1.5,
          leftChild: {
            type: 'weight',
            mass: 1.5,
            shape: 'organic',
            size: 0.45,
            thickness: 0.08,
            color: '#E6E6FA',
            wireLength: 1.0
          },
          rightChild: {
            type: 'weight',
            mass: 1.0,
            shape: 'organic',
            size: 0.38,
            thickness: 0.06,
            color: '#FFDAB9',
            wireLength: 1.2
          }
        }
      },
      rightChild: {
        type: 'arm',
        length: 4.5,
        pivotPosition: 0.5,
        wireLength: 1.6,
        leftChild: {
          type: 'arm',
          length: 3.5,
          pivotPosition: 0.55,
          wireLength: 1.5,
          leftChild: {
            type: 'arm',
            length: 2.8,
            pivotPosition: 0.5,
            wireLength: 1.3,
            leftChild: {
              type: 'weight',
              mass: 0.7,
              shape: 'organic',
              size: 0.3,
              thickness: 0.05,
              color: '#DDA0DD',
              wireLength: 1.3
            },
            rightChild: {
              type: 'weight',
              mass: 0.7,
              shape: 'organic',
              size: 0.28,
              thickness: 0.05,
              color: '#87CEEB',
              wireLength: 1.5
            }
          },
          rightChild: {
            type: 'weight',
            mass: 1.3,
            shape: 'organic',
            size: 0.42,
            thickness: 0.07,
            color: '#F0E68C',
            wireLength: 0.9
          }
        },
        rightChild: {
          type: 'weight',
          mass: 2.0,
          shape: 'organic',
          size: 0.5,
          thickness: 0.09,
          color: '#98D8C8',
          wireLength: 0.8
        }
      }
    }
  },
  
  cosmicDance: {
    id: 'cosmicDance',
    name: 'Cosmic Dance',
    icon: '🪐',
    description: 'Planets in orbital harmony',
    tree: {
      type: 'arm',
      length: 5,
      pivotPosition: 0.6,
      wireLength: 0.5,
      leftChild: {
        type: 'arm',
        length: 3,
        pivotPosition: 0.45,
        wireLength: 1.0,
        leftChild: {
          type: 'weight',
          mass: 1.5,
          shape: 'model',
          modelId: 'earth',
          modelScale: 0.35,
          size: 0.4,
          color: '#3b82f6',
          wireLength: 1.2
        },
        rightChild: {
          type: 'weight',
          mass: 1.2,
          shape: 'sphere',
          size: 0.25,
          color: '#fbbf24',
          wireLength: 0.8
        }
      },
      rightChild: {
        type: 'arm',
        length: 3.5,
        pivotPosition: 0.55,
        wireLength: 0.8,
        leftChild: {
          type: 'weight',
          mass: 2,
          shape: 'model',
          modelId: 'jupiter',
          modelScale: 0.4,
          size: 0.5,
          color: '#f97316',
          wireLength: 0.6
        },
        rightChild: {
          type: 'weight',
          mass: 0.8,
          shape: 'cylinder',
          size: 0.2,
          color: '#94a3b8',
          wireLength: 1.4
        }
      }
    }
  },
  
  rainbowCascade: {
    id: 'rainbowCascade',
    name: 'Rainbow Cascade',
    icon: '🌈',
    description: 'Colorful spheres cascading down',
    tree: {
      type: 'arm',
      length: 5.5,
      pivotPosition: 0.35,
      wireLength: 0.4,
      leftChild: {
        type: 'weight',
        mass: 3,
        shape: 'sphere',
        size: 0.45,
        color: '#ef4444',
        wireLength: 0.5
      },
      rightChild: {
        type: 'arm',
        length: 4,
        pivotPosition: 0.4,
        wireLength: 0.9,
        leftChild: {
          type: 'weight',
          mass: 1.5,
          shape: 'sphere',
          size: 0.35,
          color: '#f97316',
          wireLength: 0.7
        },
        rightChild: {
          type: 'arm',
          length: 3,
          pivotPosition: 0.45,
          wireLength: 1.1,
          leftChild: {
            type: 'weight',
            mass: 0.8,
            shape: 'sphere',
            size: 0.28,
            color: '#eab308',
            wireLength: 0.6
          },
          rightChild: {
            type: 'arm',
            length: 2.5,
            pivotPosition: 0.5,
            wireLength: 0.8,
            leftChild: {
              type: 'weight',
              mass: 0.5,
              shape: 'sphere',
              size: 0.22,
              color: '#22c55e',
              wireLength: 1.0
            },
            rightChild: {
              type: 'weight',
              mass: 0.5,
              shape: 'sphere',
              size: 0.22,
              color: '#3b82f6',
              wireLength: 1.0
            }
          }
        }
      }
    }
  },
  
  skyScene: {
    id: 'skyScene',
    name: 'Sky Scene',
    icon: '☁️',
    description: 'Sun, clouds and airplane floating in harmony',
    tree: {
      type: 'arm',
      length: 6,
      pivotPosition: 0.3,
      wireLength: 0.5,
      leftChild: {
        type: 'weight',
        mass: 3,
        shape: 'model',
        modelId: 'sun',
        modelScale: 0.06,
        size: 0.45,
        color: '#fbbf24',
        wireLength: 0.5
      },
      rightChild: {
        type: 'arm',
        length: 5,
        pivotPosition: 0.45,
        wireLength: 0.9,
        leftChild: {
          type: 'arm',
          length: 4,
          pivotPosition: 0.5,
          wireLength: 1.0,
          leftChild: {
            type: 'arm',
            length: 3.5,
            pivotPosition: 0.55,
            wireLength: 1.1,
            leftChild: {
              type: 'arm',
              length: 3,
              pivotPosition: 0.5,
              wireLength: 1.0,
              leftChild: {
                type: 'weight',
                mass: 0.6,
                shape: 'model',
                modelId: 'cloud_1',
                modelScale: 0.35,
                size: 0.3,
                color: '#f0f9ff',
                wireLength: 1.4
              },
              rightChild: {
                type: 'weight',
                mass: 0.6,
                shape: 'model',
                modelId: 'cloud_1',
                modelScale: 0.3,
                size: 0.28,
                color: '#e0f2fe',
                wireLength: 1.6
              }
            },
            rightChild: {
              type: 'weight',
              mass: 0.8,
              shape: 'model',
              modelId: 'cloud_1',
              modelScale: 0.4,
              size: 0.32,
              color: '#f0f9ff',
              wireLength: 1.2
            }
          },
          rightChild: {
            type: 'weight',
            mass: 1.0,
            shape: 'model',
            modelId: 'cloud_1',
            modelScale: 0.45,
            size: 0.35,
            color: '#e0f2fe',
            wireLength: 1.0
          }
        },
        rightChild: {
          type: 'weight',
          mass: 1.5,
          shape: 'model',
          modelId: 'airplane',
          modelScale: 0.5,
          size: 0.4,
          color: '#94a3b8',
          wireLength: 0.8
        }
      }
    }
  },
  
  heavyLight: {
    id: 'heavyLight',
    name: 'Yin & Yang',
    icon: '☯️',
    description: 'Contrasting masses in perfect balance',
    tree: {
      type: 'arm',
      length: 5,
      pivotPosition: 0.2,
      wireLength: 0.5,
      leftChild: {
        type: 'weight',
        mass: 4,
        shape: 'sphere',
        size: 0.5,
        color: '#1e1e2e',
        wireLength: 0.4
      },
      rightChild: {
        type: 'arm',
        length: 4,
        pivotPosition: 0.75,
        wireLength: 1.0,
        leftChild: {
          type: 'arm',
          length: 2.5,
          pivotPosition: 0.6,
          wireLength: 0.8,
          leftChild: {
            type: 'weight',
            mass: 0.6,
            shape: 'sphere',
            size: 0.22,
            color: '#f5f5f7',
            wireLength: 1.2
          },
          rightChild: {
            type: 'weight',
            mass: 0.4,
            shape: 'sphere',
            size: 0.18,
            color: '#e2e8f0',
            wireLength: 1.4
          }
        },
        rightChild: {
          type: 'weight',
          mass: 0.3,
          shape: 'sphere',
          size: 0.15,
          color: '#cbd5e1',
          wireLength: 1.6
        }
      }
    }
  }
}

// Array version for UI iteration
export const PRESET_LIST = Object.values(MOBILE_PRESETS)

// Get preset by ID  
export function getPresetById(presetId) {
  return MOBILE_PRESETS[presetId] || null
}
