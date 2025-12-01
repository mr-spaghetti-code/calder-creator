import React, { useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'

export default function PivotHandle({ arm, armWorldPosition, armRotation }) {
  const handleRef = useRef()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const { camera, gl } = useThree()
  const updateArm = useMobileStore((state) => state.updateArm)
  
  const handlePointerDown = (e) => {
    e.stopPropagation()
    setIsDragging(true)
    gl.domElement.style.cursor = 'grabbing'
    
    // Capture pointer
    e.target.setPointerCapture(e.pointerId)
  }
  
  const handlePointerUp = (e) => {
    setIsDragging(false)
    gl.domElement.style.cursor = isHovered ? 'grab' : 'auto'
    e.target.releasePointerCapture(e.pointerId)
  }
  
  const handlePointerMove = (e) => {
    if (!isDragging) return
    
    e.stopPropagation()
    
    // Get mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    
    // Create ray from camera through mouse
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    
    // Create a plane at the arm's Z position, facing the camera
    const armPos = new THREE.Vector3(armWorldPosition.x, armWorldPosition.y, 0)
    const planeNormal = new THREE.Vector3(0, 0, 1)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, armPos)
    
    // Find intersection with plane
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, intersection)
    
    if (intersection) {
      // Convert world position to position along the arm
      // The arm is rotated by armRotation, so we need to account for that
      const cosAngle = Math.cos(-armRotation)
      const sinAngle = Math.sin(-armRotation)
      
      // Vector from pivot to intersection point
      const dx = intersection.x - armWorldPosition.x
      const dy = intersection.y - armWorldPosition.y
      
      // Rotate back to get position along arm axis
      const localX = dx * cosAngle - dy * sinAngle
      
      // Convert to pivot position (0-1)
      // localX ranges from -pivotPosition*length to (1-pivotPosition)*length
      // At localX = 0, pivot is at the current position
      // We need to find new pivot position based on where user drags
      
      // Simpler approach: pivot position = (localX + half_length) / length
      const halfLength = arm.length / 2
      let newPivotPosition = (localX + halfLength) / arm.length
      
      // Actually, let's reconsider. The pivot handle shows where the suspension point is.
      // When dragging, we want to move where along the arm the suspension is.
      // If we drag left, pivot decreases, if we drag right, pivot increases.
      
      // Current pivot offset from center: (pivotPosition - 0.5) * length
      // New offset from intersection: localX (already relative to arm position)
      // But arm position IS the pivot position, so localX = 0 at pivot
      
      // We want: newPivotOffset = localX -> newPivotPosition = 0.5 + localX/length
      newPivotPosition = 0.5 + localX / arm.length
      
      // Clamp to valid range
      newPivotPosition = Math.max(0.1, Math.min(0.9, newPivotPosition))
      
      updateArm(arm.id, { pivotPosition: newPivotPosition })
    }
  }
  
  // Pivot handle is now at the origin since the arm is offset to place the pivot at (0,0,0)
  return (
    <mesh
      ref={handleRef}
      position={[0, 0, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        setIsHovered(true)
        if (!isDragging) gl.domElement.style.cursor = 'grab'
      }}
      onPointerLeave={() => {
        setIsHovered(false)
        if (!isDragging) gl.domElement.style.cursor = 'auto'
      }}
    >
      <torusGeometry args={[0.15, 0.05, 8, 24]} />
      <meshStandardMaterial 
        color={isDragging ? '#f59e0b' : isHovered ? '#fbbf24' : '#fcd34d'}
        emissive={isDragging ? '#f59e0b' : isHovered ? '#fbbf24' : '#fcd34d'}
        emissiveIntensity={isDragging ? 0.5 : isHovered ? 0.3 : 0.1}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

