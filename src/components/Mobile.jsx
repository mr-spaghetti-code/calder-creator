import React, { useMemo } from 'react'
import useMobileStore from '../store/mobileStore'
import Arm from './Arm'
import Weight from './Weight'
import { calculateTiltAngle } from '../physics/balanceSolver'

// Default wire length for backwards compatibility
export const DEFAULT_WIRE_LENGTH = 0.7

// Recursively render the mobile tree
function MobileNode({ node, position, parentRotation = 0 }) {
  if (!node) return null
  
  if (node.type === 'weight') {
    return <Weight node={node} position={position} />
  }
  
  if (node.type === 'arm') {
    // Calculate this arm's tilt
    const tiltAngle = calculateTiltAngle(node)
    const totalRotation = parentRotation + tiltAngle
    
    // Calculate child positions
    const leftDistance = node.pivotPosition * node.length
    const rightDistance = (1 - node.pivotPosition) * node.length
    
    const cosAngle = Math.cos(totalRotation)
    const sinAngle = Math.sin(totalRotation)
    
    // Left end position
    const leftEndPos = {
      x: position.x - leftDistance * cosAngle,
      y: position.y - leftDistance * sinAngle
    }
    
    // Right end position
    const rightEndPos = {
      x: position.x + rightDistance * cosAngle,
      y: position.y + rightDistance * sinAngle
    }
    
    // Use each child's individual wire length for positioning
    const leftWireLength = node.leftChild?.wireLength ?? DEFAULT_WIRE_LENGTH
    const rightWireLength = node.rightChild?.wireLength ?? DEFAULT_WIRE_LENGTH
    
    const leftChildPos = {
      x: leftEndPos.x,
      y: leftEndPos.y - leftWireLength
    }
    
    const rightChildPos = {
      x: rightEndPos.x,
      y: rightEndPos.y - rightWireLength
    }
    
    return (
      <>
        <Arm 
          node={node} 
          position={position} 
          parentRotation={parentRotation}
        />
        <MobileNode 
          node={node.leftChild} 
          position={leftChildPos}
          parentRotation={totalRotation}
        />
        <MobileNode 
          node={node.rightChild} 
          position={rightChildPos}
          parentRotation={totalRotation}
        />
      </>
    )
  }
  
  return null
}

export default function Mobile() {
  const mobile = useMobileStore((state) => state.mobile)
  
  // Start position: below the suspension point
  const startPosition = useMemo(() => ({ x: 0, y: 4.3 }), [])
  
  return (
    <group>
      <MobileNode 
        node={mobile} 
        position={startPosition}
        parentRotation={0}
      />
    </group>
  )
}

