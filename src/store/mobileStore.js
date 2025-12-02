import { create } from 'zustand'
import { 
  createInitialMobile, 
  createArm, 
  createWeight, 
  findNode, 
  findParent, 
  cloneTree,
  calculateSubtreeMass,
  calculateDepth,
  countNodes,
  canExpandAt,
  getNodeSide,
  createMobileFromPreset,
  exportMobileToJSON,
  importMobileFromJSON,
  collectArms
} from '../models/mobileTree'
import { getPresetById } from '../config/presets'
import { METRIC_RANGES } from '../config/units'

// Generate random yaw angles for all arms in the tree
function generateYawAngles(node) {
  const arms = collectArms(node)
  const angles = {}
  arms.forEach(arm => {
    // Random angle between -PI/2 and PI/2 (±90 degrees)
    // Use arm ID hash for some determinism within a session
    const hash = arm.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seededRandom = Math.sin(hash * 9999) * 10000
    const random = seededRandom - Math.floor(seededRandom)
    angles[arm.id] = (random - 0.5) * Math.PI
  })
  return angles
}

const useMobileStore = create((set, get) => ({
  // State
  mobile: createInitialMobile(),
  selectedId: null,
  isAnimating: false,
  orbitControlsEnabled: true,
  viewMode: 'flat', // 'flat' | '3d'
  armYawAngles: {}, // Map of arm ID to yaw angle (radians)
  rotatingArmId: null, // ID of arm currently being rotated (null = no rotation)
  
  // Physics state
  physicsEnabled: false, // Toggle between analytical and physics mode
  isPaused: false, // Pause physics simulation
  timeScale: 1.0, // Time scale for physics (0.1 to 1.0)
  damping: 0.2, // Air resistance / damping (0 to 1, maps to actual damping values) - low default for realistic motion
  windIntensity: 0, // Wind strength (0 to 1)
  windMode: 'uniform', // 'uniform' | 'turbulent'
  windDirection: [1, 0, 0.3], // Wind direction vector (normalized)
  
  // Collision state
  collisionsDetected: [], // Array of collision pairs
  showSwingEnvelope: false, // Toggle for swing envelope visualization
  
  // Physics body refs registry (for applying forces)
  physicsRefs: {}, // Map of node ID to RigidBody ref
  
  // Computed getters
  getSelectedNode: () => {
    const { mobile, selectedId } = get()
    if (!selectedId) return null
    return findNode(mobile, selectedId)
  },
  
  getStats: () => {
    const { mobile } = get()
    return {
      totalMass: calculateSubtreeMass(mobile),
      depth: calculateDepth(mobile),
      nodeCount: countNodes(mobile)
    }
  },
  
  // Actions
  setSelected: (id) => set({ selectedId: id }),
  
  clearSelection: () => set({ selectedId: null }),
  
  toggleOrbitControls: () => set((state) => ({ 
    orbitControlsEnabled: !state.orbitControlsEnabled 
  })),
  
  setOrbitControlsEnabled: (enabled) => set({ orbitControlsEnabled: enabled }),
  
  toggleViewMode: () => set((state) => {
    const newMode = state.viewMode === 'flat' ? '3d' : 'flat'
    // Generate new random yaw angles when switching to 3D mode
    const newAngles = newMode === '3d' ? generateYawAngles(state.mobile) : {}
    return { viewMode: newMode, armYawAngles: newAngles }
  }),
  
  getYawAngle: (armId) => {
    const { viewMode, armYawAngles } = get()
    if (viewMode === 'flat') return 0
    return armYawAngles[armId] || 0
  },
  
  expandWeight: (weightId) => set((state) => {
    if (!canExpandAt(state.mobile, weightId)) return state
    
    const newMobile = cloneTree(state.mobile)
    const parent = findParent(newMobile, weightId)
    
    if (!parent) return state
    
    const side = getNodeSide(newMobile, weightId)
    if (!side) return state
    
    const oldWeight = findNode(newMobile, weightId)
    if (!oldWeight || oldWeight.type !== 'weight') return state
    
    // Create new arm with two weights
    // Inherit the wireLength from the old weight for the new arm
    const newArm = createArm({
      length: 2,
      pivotPosition: 0.5,
      wireLength: oldWeight.wireLength ?? 0.7
    })
    
    // Inherit color from expanded weight for one child
    newArm.leftChild = createWeight({ color: oldWeight.color })
    newArm.rightChild = createWeight({ color: '#22c55e' }) // Green for new weight
    
    // Replace weight with arm
    if (side === 'left') {
      parent.leftChild = newArm
    } else {
      parent.rightChild = newArm
    }
    
    // Regenerate yaw angles if in 3D mode
    const newAngles = state.viewMode === '3d' ? generateYawAngles(newMobile) : state.armYawAngles
    
    return { mobile: newMobile, selectedId: null, armYawAngles: newAngles }
  }),
  
  deleteNode: (nodeId) => set((state) => {
    const { mobile } = state
    
    // Cannot delete root
    if (mobile.id === nodeId) return state
    
    const newMobile = cloneTree(mobile)
    const parent = findParent(newMobile, nodeId)
    
    if (!parent) return state
    
    const side = getNodeSide(newMobile, nodeId)
    if (!side) return state
    
    // Replace with a default weight
    const newWeight = createWeight()
    
    if (side === 'left') {
      parent.leftChild = newWeight
    } else {
      parent.rightChild = newWeight
    }
    
    return { mobile: newMobile, selectedId: null }
  }),
  
  updateWeight: (weightId, updates) => set((state) => {
    const newMobile = cloneTree(state.mobile)
    const weight = findNode(newMobile, weightId)
    
    if (!weight || weight.type !== 'weight') return state
    
    // Clamp wire length to metric range (2-30cm)
    if (updates.wireLength !== undefined) {
      updates.wireLength = Math.max(METRIC_RANGES.wireLength.min, Math.min(METRIC_RANGES.wireLength.max, updates.wireLength))
    }
    
    // Clamp mass to metric range (5-500g)
    if (updates.mass !== undefined) {
      updates.mass = Math.max(METRIC_RANGES.weightMass.min, Math.min(METRIC_RANGES.weightMass.max, updates.mass))
    }
    
    // Clamp size to metric range (1-10cm)
    if (updates.size !== undefined) {
      updates.size = Math.max(METRIC_RANGES.weightSize.min, Math.min(METRIC_RANGES.weightSize.max, updates.size))
    }
    
    // Clamp thickness for disk/organic shapes (2mm - 2cm)
    if (updates.thickness !== undefined) {
      updates.thickness = Math.max(0.02, Math.min(0.2, updates.thickness))
    }
    
    Object.assign(weight, updates)
    
    return { mobile: newMobile }
  }),
  
  updateArm: (armId, updates) => set((state) => {
    const newMobile = cloneTree(state.mobile)
    const arm = findNode(newMobile, armId)
    
    if (!arm || arm.type !== 'arm') return state
    
    // Clamp pivot position
    if (updates.pivotPosition !== undefined) {
      updates.pivotPosition = Math.max(0.1, Math.min(0.9, updates.pivotPosition))
    }
    
    // Clamp length to metric range (10-100cm)
    if (updates.length !== undefined) {
      updates.length = Math.max(METRIC_RANGES.armLength.min, Math.min(METRIC_RANGES.armLength.max, updates.length))
    }
    
    // Clamp wire length to metric range (2-30cm)
    if (updates.wireLength !== undefined) {
      updates.wireLength = Math.max(METRIC_RANGES.wireLength.min, Math.min(METRIC_RANGES.wireLength.max, updates.wireLength))
    }
    
    Object.assign(arm, updates)
    
    return { mobile: newMobile }
  }),
  
  // Rotation animation actions
  startRotation: (armId) => set({ rotatingArmId: armId }),
  
  stopRotation: () => set({ rotatingArmId: null }),
  
  // Update yaw angle for an arm (used by animation loop)
  updateArmYawAngle: (armId, delta) => set((state) => ({
    armYawAngles: {
      ...state.armYawAngles,
      [armId]: (state.armYawAngles[armId] || 0) + delta
    }
  })),
  
  // Physics actions
  togglePhysics: () => set((state) => ({ 
    physicsEnabled: !state.physicsEnabled,
    isPaused: false 
  })),
  
  setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled, isPaused: false }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  setPaused: (paused) => set({ isPaused: paused }),
  
  setTimeScale: (scale) => set({ timeScale: Math.max(0.1, Math.min(1.0, scale)) }),
  
  setDamping: (damping) => set({ damping: Math.max(0, Math.min(1, damping)) }),
  
  setWindIntensity: (intensity) => set({ windIntensity: Math.max(0, Math.min(1, intensity)) }),
  
  setWindMode: (mode) => set({ windMode: mode }),
  
  setWindDirection: (direction) => {
    // Normalize the direction vector
    const len = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2)
    if (len > 0) {
      set({ windDirection: [direction[0]/len, direction[1]/len, direction[2]/len] })
    }
  },
  
  // Collision tracking
  addCollision: (pair) => set((state) => ({
    collisionsDetected: [...state.collisionsDetected, pair]
  })),
  
  clearCollisions: () => set({ collisionsDetected: [] }),
  
  toggleSwingEnvelope: () => set((state) => ({ 
    showSwingEnvelope: !state.showSwingEnvelope 
  })),
  
  // Physics refs registry
  registerPhysicsRef: (nodeId, ref) => set((state) => ({
    physicsRefs: { ...state.physicsRefs, [nodeId]: ref }
  })),
  
  unregisterPhysicsRef: (nodeId) => set((state) => {
    const newRefs = { ...state.physicsRefs }
    delete newRefs[nodeId]
    return { physicsRefs: newRefs }
  }),
  
  // Get physics ref for a node
  getPhysicsRef: (nodeId) => get().physicsRefs[nodeId],
  
  // Reset physics to equilibrium
  resetToEquilibrium: () => {
    const state = get()
    // Clear velocities by temporarily pausing and then resetting positions
    // The actual position reset will be handled by components reading from analytical solver
    set({ 
      isPaused: true,
      collisionsDetected: []
    })
    // After a brief pause, components should reset their physics bodies
    setTimeout(() => {
      set({ isPaused: false })
    }, 100)
  },
  
  autoBalance: () => {
    const state = get()
    const newMobile = cloneTree(state.mobile)
    
    // Arm mass constants (must match balanceSolver.js and mobileTree.js)
    const ARM_BASE_MASS = 0.1
    const ARM_MASS_PER_LENGTH = 0.05
    
    // Collect all target pivot positions
    const targetPivots = new Map()
    
    function calculateOptimalPivots(node) {
      if (!node || node.type !== 'arm') return
      
      // Process children first (bottom-up)
      calculateOptimalPivots(node.leftChild)
      calculateOptimalPivots(node.rightChild)
      
      const leftMass = calculateSubtreeMass(node.leftChild)
      const rightMass = calculateSubtreeMass(node.rightChild)
      const armMass = ARM_BASE_MASS + node.length * ARM_MASS_PER_LENGTH
      const totalMass = leftMass + rightMass + armMass
      
      if (totalMass > 0) {
        // For balance with arm mass, the optimal pivot is:
        // pivot = (rightMass + armMass/2) / (leftMass + rightMass + armMass)
        // 
        // This accounts for the arm's own mass being distributed along its length.
        // When armMass=0, this reduces to rightMass/(leftMass+rightMass)
        let optimalPivot = (rightMass + armMass / 2) / totalMass
        
        // Clamp to reasonable range
        optimalPivot = Math.max(0.1, Math.min(0.9, optimalPivot))
        
        targetPivots.set(node.id, optimalPivot)
      }
    }
    
    calculateOptimalPivots(newMobile)
    
    // Start animation
    set({ isAnimating: true })
    
    const startTime = Date.now()
    const duration = 500 // ms
    
    // Store initial positions
    const initialPivots = new Map()
    function storeInitialPivots(node) {
      if (!node) return
      if (node.type === 'arm') {
        initialPivots.set(node.id, node.pivotPosition)
        storeInitialPivots(node.leftChild)
        storeInitialPivots(node.rightChild)
      }
    }
    storeInitialPivots(state.mobile)
    
    // Animation loop
    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / duration)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const animatedMobile = cloneTree(state.mobile)
      
      function applyAnimatedPivots(node) {
        if (!node || node.type !== 'arm') return
        
        const initial = initialPivots.get(node.id) ?? 0.5
        const target = targetPivots.get(node.id) ?? initial
        
        node.pivotPosition = initial + (target - initial) * eased
        
        applyAnimatedPivots(node.leftChild)
        applyAnimatedPivots(node.rightChild)
      }
      
      applyAnimatedPivots(animatedMobile)
      
      set({ mobile: animatedMobile })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        set({ isAnimating: false })
      }
    }
    
    requestAnimationFrame(animate)
  },
  
  resetMobile: () => set({
    mobile: createInitialMobile(),
    selectedId: null,
    isAnimating: false,
    viewMode: 'flat',
    armYawAngles: {},
    rotatingArmId: null,
    // Reset physics state
    physicsEnabled: false,
    isPaused: false,
    timeScale: 1.0,
    damping: 0.2,
    windIntensity: 0,
    windMode: 'uniform',
    collisionsDetected: [],
    showSwingEnvelope: false,
    physicsRefs: {}
  }),
  
  loadPreset: (presetId) => {
    const preset = getPresetById(presetId)
    if (!preset) return
    
    const newMobile = createMobileFromPreset(preset.tree)
    const { viewMode } = get()
    const newAngles = viewMode === '3d' ? generateYawAngles(newMobile) : {}
    
    set({
      mobile: newMobile,
      selectedId: null,
      isAnimating: false,
      armYawAngles: newAngles,
      rotatingArmId: null
    })
    
    // Auto-balance after loading
    setTimeout(() => {
      useMobileStore.getState().autoBalance()
    }, 100)
  },
  
  exportMobileJSON: () => {
    const { mobile } = get()
    const data = exportMobileToJSON(mobile)
    
    // Create and download file
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `calder-mobile-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  importMobileJSON: (json) => {
    try {
      const newMobile = importMobileFromJSON(json)
      const { viewMode } = get()
      const newAngles = viewMode === '3d' ? generateYawAngles(newMobile) : {}
      
      set({
        mobile: newMobile,
        selectedId: null,
        isAnimating: false,
        armYawAngles: newAngles,
        rotatingArmId: null
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}))

export default useMobileStore

