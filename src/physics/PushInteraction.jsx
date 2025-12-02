import React, { useRef, useCallback, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'

// Impulse multiplier for push force
const IMPULSE_MULTIPLIER = 0.8

export default function PushInteraction({ children }) {
  const { camera, gl, scene } = useThree()
  const physicsRefs = useMobileStore((state) => state.physicsRefs)
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  const isPaused = useMobileStore((state) => state.isPaused)
  const orbitControlsEnabled = useMobileStore((state) => state.orbitControlsEnabled)
  const setOrbitControlsEnabled = useMobileStore((state) => state.setOrbitControlsEnabled)
  
  const isDragging = useRef(false)
  const draggedBody = useRef(null)
  const lastMousePos = useRef(new THREE.Vector2())
  const currentMousePos = useRef(new THREE.Vector2())
  const raycaster = useRef(new THREE.Raycaster())
  const previousOrbitState = useRef(true) // Store previous orbit controls state
  const [isInteracting, setIsInteracting] = useState(false)
  
  // Find the physics body for a clicked mesh
  const findPhysicsBody = useCallback((intersectedObject) => {
    // Walk up the parent chain to find userData with nodeId
    let current = intersectedObject
    while (current) {
      if (current.userData?.nodeId) {
        const nodeId = current.userData.nodeId
        const ref = physicsRefs[nodeId]
        if (ref?.current) {
          // Return the RigidBody API directly
          return ref.current
        }
      }
      current = current.parent
    }
    return null
  }, [physicsRefs])
  
  const handlePointerDown = useCallback((event) => {
    if (!physicsEnabled || isPaused) return
    
    // Get normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    lastMousePos.current.set(x, y)
    currentMousePos.current.set(x, y)
    
    // Raycast to find intersected objects
    raycaster.current.setFromCamera(lastMousePos.current, camera)
    const intersects = raycaster.current.intersectObjects(scene.children, true)
    
    for (const intersect of intersects) {
      const body = findPhysicsBody(intersect.object)
      if (body) {
        isDragging.current = true
        draggedBody.current = body
        setIsInteracting(true)
        // Save current orbit state and disable during drag
        previousOrbitState.current = orbitControlsEnabled
        setOrbitControlsEnabled(false)
        event.stopPropagation()
        break
      }
    }
  }, [physicsEnabled, isPaused, camera, gl, scene, findPhysicsBody, setOrbitControlsEnabled, orbitControlsEnabled])
  
  const handlePointerMove = useCallback((event) => {
    if (!isDragging.current || !draggedBody.current) return
    
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    currentMousePos.current.set(x, y)
  }, [gl])
  
  const handlePointerUp = useCallback(() => {
    if (isDragging.current && draggedBody.current) {
      // Calculate impulse from drag velocity
      const deltaX = currentMousePos.current.x - lastMousePos.current.x
      const deltaY = currentMousePos.current.y - lastMousePos.current.y
      
      // Convert to world-space impulse (simplified)
      const impulse = {
        x: deltaX * IMPULSE_MULTIPLIER * 50,
        y: deltaY * IMPULSE_MULTIPLIER * 30,
        z: (deltaX * 0.3) * IMPULSE_MULTIPLIER * 30
      }
      
      // Apply impulse to the dragged body
      // @react-three/rapier RigidBody ref has applyImpulse directly
      try {
        draggedBody.current.applyImpulse(impulse, true)
      } catch (e) {
        console.warn('Could not apply impulse:', e)
      }
    }
    
    isDragging.current = false
    draggedBody.current = null
    setIsInteracting(false)
    // Restore previous orbit controls state
    setOrbitControlsEnabled(previousOrbitState.current)
  }, [setOrbitControlsEnabled])
  
  // Apply continuous force while dragging
  useFrame(() => {
    if (!isDragging.current || !draggedBody.current) return
    
    const deltaX = currentMousePos.current.x - lastMousePos.current.x
    const deltaY = currentMousePos.current.y - lastMousePos.current.y
    
    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
      // Apply gentle continuous force while dragging
      const force = {
        x: deltaX * IMPULSE_MULTIPLIER * 8,
        y: deltaY * IMPULSE_MULTIPLIER * 5,
        z: deltaX * IMPULSE_MULTIPLIER * 4
      }
      
      try {
        draggedBody.current.applyForce(force, true)
      } catch (e) {
        // Body might not support applyForce
      }
      
      // Update last position gradually
      lastMousePos.current.lerp(currentMousePos.current, 0.1)
    }
  })
  
  // Add event listeners to the canvas
  React.useEffect(() => {
    const canvas = gl.domElement
    
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
    }
  }, [gl, handlePointerDown, handlePointerMove, handlePointerUp])
  
  return <>{children}</>
}

// Hook for applying impulse to a specific node
export function useApplyImpulse() {
  const physicsRefs = useMobileStore((state) => state.physicsRefs)
  
  return useCallback((nodeId, impulse) => {
    const ref = physicsRefs[nodeId]
    if (ref?.current) {
      try {
        ref.current.applyImpulse(impulse, true)
      } catch (e) {
        console.warn('Could not apply impulse:', e)
      }
    }
  }, [physicsRefs])
}

// Hook for applying force to a specific node
export function useApplyForce() {
  const physicsRefs = useMobileStore((state) => state.physicsRefs)
  
  return useCallback((nodeId, force) => {
    const ref = physicsRefs[nodeId]
    if (ref?.current) {
      try {
        ref.current.applyForce(force, true)
      } catch (e) {
        console.warn('Could not apply force:', e)
      }
    }
  }, [physicsRefs])
}

