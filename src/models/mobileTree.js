// Utility functions for mobile tree operations
// All measurements use scene units:
// - 1 scene unit = 10 cm for lengths
// - 1 mass unit = 50 grams for weights

let idCounter = 0

export function generateId() {
  return `node_${++idCounter}`
}

export function resetIdCounter() {
  idCounter = 0
}

// Generate random blob points for organic shape
export function generateBlobPoints(seed = null) {
  // Use seed for reproducibility, or generate random
  const rng = seed !== null ? seededRandom(seed) : Math.random
  
  // Random number of points between 3 and 6
  const numPoints = Math.floor(rng() * 4) + 3
  const points = []
  
  for (let i = 0; i < numPoints; i++) {
    // Base angle evenly distributed
    const baseAngle = (i / numPoints) * Math.PI * 2
    // Add randomness to angle (+/- 15 degrees = 0.26 radians)
    const angle = baseAngle + (rng() - 0.5) * 0.52
    // Random radius between 0.5 and 1.0
    const radius = 0.5 + rng() * 0.5
    
    points.push({
      angle,
      radius,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })
  }
  
  return points
}

// Simple seeded random number generator
function seededRandom(seed) {
  let s = seed
  return function() {
    s = Math.sin(s) * 10000
    return s - Math.floor(s)
  }
}

export function createWeight(overrides = {}) {
  return {
    id: generateId(),
    type: 'weight',
    mass: 1,           // 50g default
    shape: 'sphere',   // 'sphere', 'cube', 'cylinder', 'disk', 'organic', etc. or 'model' for GLB models
    size: 0.3,         // 3cm diameter default (for primitive shapes)
    color: '#3b82f6',
    wireLength: 0.7,   // 7cm wire length default
    // Disk and organic shape properties:
    thickness: 0.05,   // 0.5cm thickness default for disk/organic shapes
    // Organic blob shape properties:
    // blobPoints: null,  // Array of {angle, radius, x, y} control points
    // blobSeed: null,    // Seed for regenerating the same shape
    // GLB model properties (only used when shape === 'model'):
    // modelId: null,     // ID of the GLB model (e.g., 'drago', 'earth')
    // modelScale: null,  // Scale multiplier for the model
    // massSetByUser: false, // Track if user manually set mass (vs auto-calculated)
    ...overrides
  }
}

export function createArm(overrides = {}) {
  return {
    id: generateId(),
    type: 'arm',
    length: 2,         // 20cm default
    pivotPosition: 0.5,
    wireLength: 0.7,   // 7cm wire length default
    leftChild: null,
    rightChild: null,
    ...overrides
  }
}

export function createInitialMobile() {
  resetIdCounter()
  
  const rootArm = createArm({
    length: 4,         // 40cm root arm
    pivotPosition: 0.5
  })
  
  rootArm.leftChild = createWeight({ color: '#f97316' })  // Orange
  rootArm.rightChild = createWeight({ color: '#8b5cf6' }) // Purple
  
  return rootArm
}

// Find a node by ID in the tree
export function findNode(root, id) {
  if (!root) return null
  if (root.id === id) return root
  
  if (root.type === 'arm') {
    const leftResult = findNode(root.leftChild, id)
    if (leftResult) return leftResult
    
    const rightResult = findNode(root.rightChild, id)
    if (rightResult) return rightResult
  }
  
  return null
}

// Find the parent arm of a node
export function findParent(root, id, parent = null) {
  if (!root) return null
  if (root.id === id) return parent
  
  if (root.type === 'arm') {
    const leftResult = findParent(root.leftChild, id, root)
    if (leftResult) return leftResult
    
    const rightResult = findParent(root.rightChild, id, root)
    if (rightResult) return rightResult
  }
  
  return null
}

// Deep clone the tree
export function cloneTree(node) {
  if (!node) return null
  
  if (node.type === 'weight') {
    return { ...node }
  }
  
  return {
    ...node,
    leftChild: cloneTree(node.leftChild),
    rightChild: cloneTree(node.rightChild)
  }
}

// Arm mass constants (should match balanceSolver.js)
const ARM_BASE_MASS = 0.1
const ARM_MASS_PER_LENGTH = 0.05

// Calculate arm mass based on length
export function calculateArmMass(node) {
  if (!node || node.type !== 'arm') return 0
  return ARM_BASE_MASS + node.length * ARM_MASS_PER_LENGTH
}

// Calculate total mass of a subtree (including arm mass)
export function calculateSubtreeMass(node) {
  if (!node) return 0
  
  if (node.type === 'weight') {
    return node.mass
  }
  
  if (node.type === 'arm') {
    // Include the arm's own mass plus all children
    const armMass = calculateArmMass(node)
    const childrenMass = calculateSubtreeMass(node.leftChild) + calculateSubtreeMass(node.rightChild)
    return armMass + childrenMass
  }
  
  return 0
}

// Calculate the depth of the tree
export function calculateDepth(node) {
  if (!node) return 0
  
  if (node.type === 'weight') {
    return 1
  }
  
  return 1 + Math.max(
    calculateDepth(node.leftChild),
    calculateDepth(node.rightChild)
  )
}

// Count total nodes
export function countNodes(node) {
  if (!node) return 0
  
  if (node.type === 'weight') {
    return 1
  }
  
  return 1 + countNodes(node.leftChild) + countNodes(node.rightChild)
}

// Check if we can add more depth (max 5 levels)
export function canExpandAt(root, weightId) {
  const weight = findNode(root, weightId)
  if (!weight || weight.type !== 'weight') return false
  
  // Count depth from root to this weight
  let depth = 0
  let current = root
  
  function findDepth(node, targetId, currentDepth) {
    if (!node) return -1
    if (node.id === targetId) return currentDepth
    
    if (node.type === 'arm') {
      const leftDepth = findDepth(node.leftChild, targetId, currentDepth + 1)
      if (leftDepth !== -1) return leftDepth
      
      const rightDepth = findDepth(node.rightChild, targetId, currentDepth + 1)
      if (rightDepth !== -1) return rightDepth
    }
    
    return -1
  }
  
  depth = findDepth(root, weightId, 1)
  
  // Max depth is 5, and expanding adds 1 more level
  return depth < 5
}

// Get which side of parent this node is on
export function getNodeSide(root, nodeId) {
  const parent = findParent(root, nodeId)
  if (!parent) return null
  
  if (parent.leftChild && parent.leftChild.id === nodeId) return 'left'
  if (parent.rightChild && parent.rightChild.id === nodeId) return 'right'
  
  return null
}

// Collect all arms in the tree (for build specs)
export function collectArms(node, arms = []) {
  if (!node) return arms
  
  if (node.type === 'arm') {
    arms.push(node)
    collectArms(node.leftChild, arms)
    collectArms(node.rightChild, arms)
  }
  
  return arms
}

// Collect all weights in the tree (for build specs)
export function collectWeights(node, weights = []) {
  if (!node) return weights
  
  if (node.type === 'weight') {
    weights.push(node)
  } else if (node.type === 'arm') {
    collectWeights(node.leftChild, weights)
    collectWeights(node.rightChild, weights)
  }
  
  return weights
}

// Calculate total wire length needed (sum of all wire lengths)
export function calculateTotalWireLength(node) {
  if (!node) return 0
  
  if (node.type === 'weight') {
    return node.wireLength ?? 0.7
  }
  
  if (node.type === 'arm') {
    // Arm's own wire (except root) + children's wires
    const ownWire = node.wireLength ?? 0.7
    const leftWire = calculateTotalWireLength(node.leftChild)
    const rightWire = calculateTotalWireLength(node.rightChild)
    return ownWire + leftWire + rightWire
  }
  
  return 0
}

// Create a mobile from a preset tree (assigns fresh IDs)
export function createMobileFromPreset(presetTree) {
  resetIdCounter()
  
  function assignIds(node) {
    if (!node) return null
    
    if (node.type === 'weight') {
      return {
        ...node,
        id: generateId()
      }
    }
    
    if (node.type === 'arm') {
      return {
        ...node,
        id: generateId(),
        leftChild: assignIds(node.leftChild),
        rightChild: assignIds(node.rightChild)
      }
    }
    
    return null
  }
  
  return assignIds(presetTree)
}

// Strip IDs from tree for export (IDs are regenerated on import)
export function stripIdsForExport(node) {
  if (!node) return null
  
  if (node.type === 'weight') {
    const { id, ...rest } = node
    return rest
  }
  
  if (node.type === 'arm') {
    const { id, leftChild, rightChild, ...rest } = node
    return {
      ...rest,
      leftChild: stripIdsForExport(leftChild),
      rightChild: stripIdsForExport(rightChild)
    }
  }
  
  return null
}

// Export mobile to JSON-serializable object
export function exportMobileToJSON(mobile) {
  const tree = stripIdsForExport(mobile)
  
  return {
    version: '1.0',
    createdAt: new Date().toISOString(),
    app: 'Calder Creator',
    tree
  }
}

// Import mobile from JSON object
export function importMobileFromJSON(json) {
  // Validate basic structure
  if (!json || !json.tree) {
    throw new Error('Invalid mobile format: missing tree data')
  }
  
  const { tree } = json
  
  // Validate tree structure
  if (!tree.type || (tree.type !== 'arm' && tree.type !== 'weight')) {
    throw new Error('Invalid mobile format: root must be an arm or weight')
  }
  
  // Use createMobileFromPreset to assign fresh IDs
  return createMobileFromPreset(tree)
}

// Calculate mobile dimensions (width and height in scene units)
export function calculateMobileDimensions(node) {
  if (!node) return { width: 0, height: 0 }
  
  // We need to traverse the tree and calculate actual positions
  // to get accurate dimensions
  function calculateBounds(node, x, y, bounds) {
    if (!node) return
    
    bounds.minX = Math.min(bounds.minX, x)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.maxY = Math.max(bounds.maxY, y)
    
    if (node.type === 'weight') {
      // Include weight size in bounds
      bounds.minX = Math.min(bounds.minX, x - node.size)
      bounds.maxX = Math.max(bounds.maxX, x + node.size)
      bounds.maxY = Math.max(bounds.maxY, y + node.size)
    } else if (node.type === 'arm') {
      const leftDist = node.pivotPosition * node.length
      const rightDist = (1 - node.pivotPosition) * node.length
      
      // Arm endpoints (assuming no tilt for simplicity)
      bounds.minX = Math.min(bounds.minX, x - leftDist)
      bounds.maxX = Math.max(bounds.maxX, x + rightDist)
      
      // Children hang below
      const leftWire = node.leftChild?.wireLength ?? 0.7
      const rightWire = node.rightChild?.wireLength ?? 0.7
      
      calculateBounds(node.leftChild, x - leftDist, y + leftWire, bounds)
      calculateBounds(node.rightChild, x + rightDist, y + rightWire, bounds)
    }
  }
  
  const bounds = { minX: 0, maxX: 0, maxY: 0 }
  calculateBounds(node, 0, 0, bounds)
  
  return {
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY
  }
}

