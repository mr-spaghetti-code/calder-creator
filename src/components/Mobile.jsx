import React, { useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import useMobileStore from '../store/mobileStore'
import Arm from './Arm'
import Weight from './Weight'
import { calculateTiltAngle } from '../physics/balanceSolver'

// Rotation speed in radians per second (negative = clockwise when viewed from above)
const ROTATION_SPEED = -1.5

// Default wire length for backwards compatibility
export const DEFAULT_WIRE_LENGTH = 0.7

// Lazy load physics mobile to avoid loading Rapier when not needed
const PhysicsMobile = React.lazy(() => import('../physics/PhysicsMobile'))

// Recursively render the mobile tree
function MobileNode({ node, position, parentRotation = 0, parentYaw = 0, armYawAngles }) {
  if (!node) return null
  
  if (node.type === 'weight') {
    return <Weight node={node} position={position} />
  }
  
  if (node.type === 'arm') {
    // Calculate this arm's tilt
    const tiltAngle = calculateTiltAngle(node)
    const totalRotation = parentRotation + tiltAngle
    
    // Get this arm's yaw angle (used for 3D mode and rotation animation)
    const armYaw = armYawAngles[node.id] || 0
    const totalYaw = parentYaw + armYaw  // Accumulated yaw to pass to children
    
    // Calculate child positions
    const leftDistance = node.pivotPosition * node.length
    const rightDistance = (1 - node.pivotPosition) * node.length
    
    const cosTilt = Math.cos(totalRotation)
    const sinTilt = Math.sin(totalRotation)
    // Use only THIS arm's yaw for endpoint calculations
    // (parent yaw is already baked into `position`)
    const cosYaw = Math.cos(armYaw)
    const sinYaw = Math.sin(armYaw)
    
    // In flat mode (yaw=0): left end is at (-leftDistance * cosTilt, -sinTilt * leftDistance, 0)
    // In 3D mode: the horizontal component (cosTilt) is rotated by yaw around Y axis
    // Y-axis rotation formula: (x, y, z) -> (x*cos(yaw) + z*sin(yaw), y, -x*sin(yaw) + z*cos(yaw))
    // With z=0: x' = x*cos(yaw), z' = -x*sin(yaw)
    
    // Left end position (relative to pivot, then add pivot position)
    const leftLocalX = -leftDistance * cosTilt
    const leftLocalY = -leftDistance * sinTilt
    const leftEndPos = {
      x: position.x + leftLocalX * cosYaw,
      y: position.y + leftLocalY,
      z: position.z - leftLocalX * sinYaw  // Note: -x*sin(yaw) from rotation formula
    }
    
    // Right end position
    const rightLocalX = rightDistance * cosTilt
    const rightLocalY = rightDistance * sinTilt
    const rightEndPos = {
      x: position.x + rightLocalX * cosYaw,
      y: position.y + rightLocalY,
      z: position.z - rightLocalX * sinYaw  // Note: -x*sin(yaw) from rotation formula
    }
    
    // Use each child's individual wire length for positioning
    const leftWireLength = node.leftChild?.wireLength ?? DEFAULT_WIRE_LENGTH
    const rightWireLength = node.rightChild?.wireLength ?? DEFAULT_WIRE_LENGTH
    
    const leftChildPos = {
      x: leftEndPos.x,
      y: leftEndPos.y - leftWireLength,
      z: leftEndPos.z
    }
    
    const rightChildPos = {
      x: rightEndPos.x,
      y: rightEndPos.y - rightWireLength,
      z: rightEndPos.z
    }
    
    return (
      <>
        <Arm 
          node={node} 
          position={position} 
          parentRotation={parentRotation}
          yawAngle={armYaw}
        />
        <MobileNode 
          node={node.leftChild} 
          position={leftChildPos}
          parentRotation={totalRotation}
          parentYaw={totalYaw}
          armYawAngles={armYawAngles}
        />
        <MobileNode 
          node={node.rightChild} 
          position={rightChildPos}
          parentRotation={totalRotation}
          parentYaw={totalYaw}
          armYawAngles={armYawAngles}
        />
      </>
    )
  }
  
  return null
}

// Suspension point Y coordinate (must match SuspensionPoint component)
const SUSPENSION_Y = 5

// Analytical mode mobile (original implementation)
function AnalyticalMobile() {
  const mobile = useMobileStore((state) => state.mobile)
  const armYawAngles = useMobileStore((state) => state.armYawAngles)
  const rotatingArmId = useMobileStore((state) => state.rotatingArmId)
  const updateArmYawAngle = useMobileStore((state) => state.updateArmYawAngle)
  
  // Animation loop for rotation
  useFrame((_, delta) => {
    if (rotatingArmId) {
      // Update the yaw angle of the rotating arm
      // delta is in seconds, ROTATION_SPEED is radians/second
      updateArmYawAngle(rotatingArmId, ROTATION_SPEED * delta)
    }
  })
  
  // Start position: below the suspension point, accounting for root arm's wire length
  // The wire extends UP from the arm to the suspension point
  const rootWireLength = mobile?.wireLength ?? DEFAULT_WIRE_LENGTH
  const startPosition = useMemo(() => ({ 
    x: 0, 
    y: SUSPENSION_Y - rootWireLength, 
    z: 0 
  }), [rootWireLength])
  
  return (
    <group>
      <MobileNode 
        node={mobile} 
        position={startPosition}
        parentRotation={0}
        parentYaw={0}
        armYawAngles={armYawAngles}
      />
    </group>
  )
}

export default function Mobile() {
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  
  // When physics is enabled, render the physics-based mobile
  // Otherwise, use the analytical (static equilibrium) version
  if (physicsEnabled) {
    return (
      <Suspense fallback={<AnalyticalMobile />}>
        <PhysicsMobile />
      </Suspense>
    )
  }
  
  return <AnalyticalMobile />
}

