import React, { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'
import { findNode, collectArms, collectWeights } from '../models/mobileTree'

// Calculate swing envelope points for an element
function calculateSwingEnvelope(node, pivotPosition, maxSwingAngle = Math.PI / 6) {
  const points = []
  const segments = 32
  
  if (node.type === 'arm') {
    const leftDist = node.pivotPosition * node.length
    const rightDist = (1 - node.pivotPosition) * node.length
    const wireLength = node.wireLength ?? 0.7
    
    // Left endpoint swing arc
    for (let i = 0; i <= segments; i++) {
      const angle = -maxSwingAngle + (2 * maxSwingAngle * i / segments)
      points.push(new THREE.Vector3(
        -leftDist * Math.cos(angle),
        wireLength - leftDist * Math.sin(angle),
        0
      ))
    }
    
    // Right endpoint swing arc (separate arc)
    const rightPoints = []
    for (let i = 0; i <= segments; i++) {
      const angle = -maxSwingAngle + (2 * maxSwingAngle * i / segments)
      rightPoints.push(new THREE.Vector3(
        rightDist * Math.cos(angle),
        wireLength + rightDist * Math.sin(angle),
        0
      ))
    }
    
    return { left: points, right: rightPoints }
  }
  
  if (node.type === 'weight') {
    const wireLength = node.wireLength ?? 0.7
    const radius = node.size
    
    // Weight swings in an arc
    for (let i = 0; i <= segments; i++) {
      const angle = -maxSwingAngle + (2 * maxSwingAngle * i / segments)
      points.push(new THREE.Vector3(
        wireLength * Math.sin(angle),
        wireLength * (1 - Math.cos(angle)) - radius,
        0
      ))
    }
    
    return { arc: points }
  }
  
  return null
}

// Swing envelope visualization for a single node
function SwingEnvelopeViz({ node, position }) {
  const envelopes = useMemo(() => calculateSwingEnvelope(node), [node])
  
  if (!envelopes) return null
  
  const color = "#22c55e"
  const opacity = 0.3
  
  if (node.type === 'arm') {
    return (
      <group position={[position.x, position.y, position.z || 0]}>
        {envelopes.left && (
          <Line
            points={envelopes.left}
            color={color}
            lineWidth={2}
            transparent
            opacity={opacity}
          />
        )}
        {envelopes.right && (
          <Line
            points={envelopes.right}
            color={color}
            lineWidth={2}
            transparent
            opacity={opacity}
          />
        )}
      </group>
    )
  }
  
  if (node.type === 'weight' && envelopes.arc) {
    return (
      <group position={[position.x, position.y, position.z || 0]}>
        <Line
          points={envelopes.arc}
          color={color}
          lineWidth={2}
          transparent
          opacity={opacity}
        />
      </group>
    )
  }
  
  return null
}

// Collision warning indicator
function CollisionWarning({ collision, mobile }) {
  const node1 = findNode(mobile, collision.id1)
  const node2 = findNode(mobile, collision.id2)
  
  if (!node1 || !node2) return null
  
  // Flash effect
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      const intensity = (Math.sin(state.clock.elapsedTime * 10) + 1) / 2
      meshRef.current.material.opacity = 0.3 + intensity * 0.4
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 3, 0]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
    </mesh>
  )
}

// Main collision system component
export default function CollisionSystem() {
  const mobile = useMobileStore((state) => state.mobile)
  const collisionsDetected = useMobileStore((state) => state.collisionsDetected)
  const showSwingEnvelope = useMobileStore((state) => state.showSwingEnvelope)
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  
  // Collect all nodes for envelope visualization
  const allNodes = useMemo(() => {
    if (!mobile) return []
    const arms = collectArms(mobile)
    const weights = collectWeights(mobile)
    return [...arms, ...weights]
  }, [mobile])
  
  // Clear old collisions periodically
  const clearCollisions = useMobileStore((state) => state.clearCollisions)
  useEffect(() => {
    const interval = setInterval(() => {
      // Clear collisions older than 2 seconds
      clearCollisions()
    }, 2000)
    return () => clearInterval(interval)
  }, [clearCollisions])
  
  // Recent collision indicator
  const hasRecentCollision = collisionsDetected.length > 0
  
  return (
    <group>
      {/* Collision warnings */}
      {hasRecentCollision && collisionsDetected.slice(-3).map((collision, i) => (
        <CollisionWarning 
          key={`${collision.id1}-${collision.id2}-${collision.time}`}
          collision={collision}
          mobile={mobile}
        />
      ))}
      
      {/* Swing envelope visualization - only in physics mode */}
      {showSwingEnvelope && physicsEnabled && (
        <group>
          {/* Simplified visualization - just show warning areas */}
          <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2, 4, 32]} />
            <meshBasicMaterial 
              color="#22c55e" 
              transparent 
              opacity={0.1} 
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

// Hook to check if a position would collide with the envelope
export function useCollisionCheck() {
  const mobile = useMobileStore((state) => state.mobile)
  
  return useMemo(() => {
    // Simple bounding sphere collision check
    const checkCollision = (pos1, radius1, pos2, radius2) => {
      const dx = pos1.x - pos2.x
      const dy = pos1.y - pos2.y
      const dz = pos1.z - pos2.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      return dist < (radius1 + radius2)
    }
    
    return checkCollision
  }, [mobile])
}

