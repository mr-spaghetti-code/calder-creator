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
  
  autoBalance: () => {
    const state = get()
    const newMobile = cloneTree(state.mobile)
    
    // Collect all target pivot positions
    const targetPivots = new Map()
    
    function calculateOptimalPivots(node) {
      if (!node || node.type !== 'arm') return
      
      // Process children first (bottom-up)
      calculateOptimalPivots(node.leftChild)
      calculateOptimalPivots(node.rightChild)
      
      const leftMass = calculateSubtreeMass(node.leftChild)
      const rightMass = calculateSubtreeMass(node.rightChild)
      const totalMass = leftMass + rightMass
      
      if (totalMass > 0) {
        // pivot = m_right / (m_left + m_right)
        // This positions the pivot such that torques balance
        let optimalPivot = rightMass / totalMass
        
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
    armYawAngles: {}
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
      armYawAngles: newAngles
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
        armYawAngles: newAngles
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}))

export default useMobileStore

