import { calculateSubtreeMass } from '../models/mobileTree'

// Maximum tilt angle in radians (~30 degrees)
const MAX_TILT = Math.PI / 6

// Calculate the tilt angle for an arm based on torque imbalance
export function calculateTiltAngle(arm) {
  if (!arm || arm.type !== 'arm') return 0
  
  const leftMass = calculateSubtreeMass(arm.leftChild)
  const rightMass = calculateSubtreeMass(arm.rightChild)
  
  // Distance from pivot to each end
  const leftDistance = arm.pivotPosition * arm.length
  const rightDistance = (1 - arm.pivotPosition) * arm.length
  
  // Torque = mass × distance
  const leftTorque = leftMass * leftDistance
  const rightTorque = rightMass * rightDistance
  
  // Net torque (positive = tilts left down, negative = tilts right down)
  const netTorque = leftTorque - rightTorque
  
  // Total torque capacity for normalization
  const totalTorque = leftTorque + rightTorque
  
  if (totalTorque === 0) return 0
  
  // Normalized imbalance (-1 to 1)
  const imbalance = netTorque / totalTorque
  
  // Convert to tilt angle (capped)
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, imbalance * MAX_TILT * 2))
}

// Calculate balance ratio (0 = very unbalanced, 1 = perfectly balanced)
export function calculateBalanceRatio(arm) {
  if (!arm || arm.type !== 'arm') return 1
  
  const leftMass = calculateSubtreeMass(arm.leftChild)
  const rightMass = calculateSubtreeMass(arm.rightChild)
  
  const leftDistance = arm.pivotPosition * arm.length
  const rightDistance = (1 - arm.pivotPosition) * arm.length
  
  const leftTorque = leftMass * leftDistance
  const rightTorque = rightMass * rightDistance
  
  const totalTorque = leftTorque + rightTorque
  
  if (totalTorque === 0) return 1
  
  const imbalance = Math.abs(leftTorque - rightTorque) / totalTorque
  
  return 1 - imbalance
}

// Get color based on balance (green -> yellow -> red)
export function getBalanceColor(balanceRatio) {
  // Colors: green (#22c55e) -> yellow (#eab308) -> red (#ef4444)
  
  if (balanceRatio > 0.9) {
    // Near perfect balance - green
    return { r: 0.133, g: 0.773, b: 0.369 } // #22c55e
  } else if (balanceRatio > 0.5) {
    // Moderate imbalance - lerp green to yellow
    const t = (balanceRatio - 0.5) / 0.4
    return {
      r: lerp(0.918, 0.133, t),
      g: lerp(0.702, 0.773, t),
      b: lerp(0.031, 0.369, t)
    }
  } else {
    // Severe imbalance - lerp yellow to red
    const t = balanceRatio / 0.5
    return {
      r: lerp(0.937, 0.918, t),
      g: lerp(0.267, 0.702, t),
      b: lerp(0.267, 0.031, t)
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Recursively solve the mobile and return computed states
export function solveMobile(node, parentAngle = 0, parentPosition = { x: 0, y: 0 }) {
  if (!node) return []
  
  const results = []
  
  if (node.type === 'weight') {
    results.push({
      id: node.id,
      type: 'weight',
      position: parentPosition,
      rotation: 0
    })
  } else if (node.type === 'arm') {
    const tiltAngle = calculateTiltAngle(node)
    const totalAngle = parentAngle + tiltAngle
    const balanceRatio = calculateBalanceRatio(node)
    const balanceColor = getBalanceColor(balanceRatio)
    
    // Pivot is at parentPosition
    // Left end is at pivot - leftDistance
    // Right end is at pivot + rightDistance
    const leftDistance = node.pivotPosition * node.length
    const rightDistance = (1 - node.pivotPosition) * node.length
    
    // Calculate end positions based on rotation
    const cosAngle = Math.cos(totalAngle)
    const sinAngle = Math.sin(totalAngle)
    
    const leftEndPos = {
      x: parentPosition.x - leftDistance * cosAngle,
      y: parentPosition.y - leftDistance * sinAngle
    }
    
    const rightEndPos = {
      x: parentPosition.x + rightDistance * cosAngle,
      y: parentPosition.y + rightDistance * sinAngle
    }
    
    results.push({
      id: node.id,
      type: 'arm',
      position: parentPosition,
      rotation: totalAngle,
      tiltAngle,
      balanceRatio,
      balanceColor,
      leftEnd: leftEndPos,
      rightEnd: rightEndPos,
      length: node.length,
      pivotPosition: node.pivotPosition
    })
    
    // Recurse to children
    // Children hang below the arm ends based on their individual wire lengths
    const leftWireLength = node.leftChild?.wireLength ?? 0.7
    const rightWireLength = node.rightChild?.wireLength ?? 0.7
    
    const leftChildPos = {
      x: leftEndPos.x,
      y: leftEndPos.y - leftWireLength
    }
    
    const rightChildPos = {
      x: rightEndPos.x,
      y: rightEndPos.y - rightWireLength
    }
    
    results.push(...solveMobile(node.leftChild, totalAngle, leftChildPos))
    results.push(...solveMobile(node.rightChild, totalAngle, rightChildPos))
  }
  
  return results
}

