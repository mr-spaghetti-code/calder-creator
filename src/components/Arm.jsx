import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'
import PivotHandle from './PivotHandle'
import { calculateTiltAngle, calculateBalanceRatio, getBalanceColor } from '../physics/balanceSolver'
import { DEFAULT_WIRE_LENGTH } from './Mobile'

export default function Arm({ node, position, parentRotation = 0, yawAngle = 0 }) {
  const groupRef = useRef()
  const meshRef = useRef()
  
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  
  const isSelected = selectedId === node.id
  
  // Calculate balance state
  const tiltAngle = useMemo(() => calculateTiltAngle(node), [node])
  const balanceRatio = useMemo(() => calculateBalanceRatio(node), [node])
  const balanceColor = useMemo(() => getBalanceColor(balanceRatio), [balanceRatio])
  
  // Total rotation including parent and own tilt
  const totalRotation = parentRotation + tiltAngle
  
  // Calculate arm endpoints
  const leftDistance = node.pivotPosition * node.length
  const rightDistance = (1 - node.pivotPosition) * node.length
  
  // Offset needed to position arm so pivot is at correct location along its length
  // When pivot is at center (0.5), offset is 0. Otherwise, arm shifts accordingly.
  const armCenterOffset = (0.5 - node.pivotPosition) * node.length
  
  // Animate arm color smoothly
  useFrame(() => {
    if (meshRef.current && meshRef.current.material) {
      const currentColor = meshRef.current.material.color
      currentColor.r = THREE.MathUtils.lerp(currentColor.r, balanceColor.r, 0.1)
      currentColor.g = THREE.MathUtils.lerp(currentColor.g, balanceColor.g, 0.1)
      currentColor.b = THREE.MathUtils.lerp(currentColor.b, balanceColor.b, 0.1)
    }
  })
  
  const handleClick = (e) => {
    e.stopPropagation()
    setSelected(node.id)
  }
  
  // The arm visual: a thin cylinder/box rotated and positioned
  // Pivot is at `position`, arm extends left and right from there
  
  // Use the arm's wireLength property (fallback for backwards compatibility)
  const wireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  
  return (
    <group ref={groupRef} position={[position.x, position.y, position.z || 0]}>
      {/* Wire connecting to parent - OUTSIDE the rotated group to stay vertical */}
      <mesh position={[0, wireLength / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, wireLength, 8]} />
        <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Yaw rotation group - rotates the entire arm around Y axis */}
      <group rotation={[0, yawAngle, 0]}>
        {/* Tilt rotation group - rotates the arm for balance */}
        <group rotation={[0, 0, totalRotation]}>
          {/* Arm rod */}
          <mesh 
            ref={meshRef}
            onClick={handleClick}
            position={[armCenterOffset, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.06, 0.06, node.length, 16]} />
            <meshStandardMaterial 
              color={new THREE.Color(balanceColor.r, balanceColor.g, balanceColor.b)}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Left endpoint marker */}
          <mesh position={[-leftDistance, 0, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.5} roughness={0.4} />
          </mesh>
          
          {/* Right endpoint marker */}
          <mesh position={[rightDistance, 0, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.5} roughness={0.4} />
          </mesh>
          
          {/* Pivot handle (draggable) */}
          <PivotHandle 
            arm={node} 
            armWorldPosition={position}
            armRotation={totalRotation}
          />
          
          {/* Selection indicator */}
          {isSelected && (
            <mesh position={[armCenterOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, node.length + 0.1, 16]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}

