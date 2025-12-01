import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'
import { DEFAULT_WIRE_LENGTH } from './Mobile'
import GLBWeight from './GLBWeight'
import { isModelShape } from '../config/models'
import { generateBlobPoints } from '../models/mobileTree'

// Create organic blob geometry with smooth bezier curves
function createOrganicGeometry(blobPoints, size, thickness) {
  // Use provided points or generate default
  const points = blobPoints || generateBlobPoints(Date.now())
  
  // Scale points by size
  const scaledPoints = points.map(p => ({
    x: p.x * size,
    y: p.y * size
  }))
  
  // Calculate centroid for proper center of mass
  const centroid = {
    x: scaledPoints.reduce((sum, p) => sum + p.x, 0) / scaledPoints.length,
    y: scaledPoints.reduce((sum, p) => sum + p.y, 0) / scaledPoints.length
  }
  
  // Offset points so centroid is at origin
  const centeredPoints = scaledPoints.map(p => ({
    x: p.x - centroid.x,
    y: p.y - centroid.y
  }))
  
  // Create THREE.js Shape with smooth bezier curves
  const shape = new THREE.Shape()
  const n = centeredPoints.length
  
  // Calculate midpoint between first and last point - this is our start/end point
  const firstMidX = (centeredPoints[n - 1].x + centeredPoints[0].x) / 2
  const firstMidY = (centeredPoints[n - 1].y + centeredPoints[0].y) / 2
  
  // Start at the midpoint between last and first point
  shape.moveTo(firstMidX, firstMidY)
  
  // Draw smooth curves: each point is a control point, endpoints are midpoints
  for (let i = 0; i < n; i++) {
    const controlPoint = centeredPoints[i]
    const nextPoint = centeredPoints[(i + 1) % n]
    
    // End point is midway between current control point and next point
    const endX = (controlPoint.x + nextPoint.x) / 2
    const endY = (controlPoint.y + nextPoint.y) / 2
    
    shape.quadraticCurveTo(controlPoint.x, controlPoint.y, endX, endY)
  }
  
  // No need for closePath() - the loop naturally ends where it started
  
  // Extrude the shape for thickness
  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.1,
    bevelSize: thickness * 0.1,
    bevelSegments: 2
  }
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  
  // Center the extrusion on Z axis
  geometry.translate(0, 0, -thickness / 2)
  
  // Find the topmost point for attachment (max Y in shape coordinates)
  let maxY = -Infinity
  for (const p of centeredPoints) {
    if (p.y > maxY) maxY = p.y
  }
  
  // Translate so the top edge is at Y=0 (attachment point)
  // The shape hangs down from the attachment point
  geometry.translate(0, -maxY, 0)
  
  return geometry
}

export default function Weight({ node, position }) {
  // Delegate to GLBWeight for model shapes
  if (isModelShape(node.shape)) {
    return <GLBWeight node={node} position={position} />
  }
  const meshRef = useRef()
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  const expandWeight = useMobileStore((state) => state.expandWeight)
  
  const isSelected = selectedId === node.id
  
  // Use the weight's wireLength property (fallback for backwards compatibility)
  const nodeWireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  
  // Calculate the top of the weight based on shape
  const weightTopY = useMemo(() => {
    const thickness = node.thickness ?? 0.05
    switch (node.shape) {
      case 'cube':
        return node.size * 0.8 // Half of 1.6 * size
      case 'cylinder':
        return node.size // Half of 2 * size
      case 'cone':
        return node.size // Half of 2 * size (height)
      case 'torus':
        return node.size * 0.35 // Torus tube radius
      case 'octahedron':
        return node.size // Radius
      case 'tetrahedron':
        return node.size * 0.8 // Approximate top
      case 'disk':
        return 0 // Disk hangs from top edge, attachment point is at y=0
      case 'organic':
        return 0 // Organic hangs from top edge, attachment point is at y=0
      case 'sphere':
      default:
        return node.size
    }
  }, [node.shape, node.size, node.thickness])
  
  // Wire connects from top of weight to arm endpoint (nodeWireLength above weight position)
  // The actual wire spans from weight top to the arm endpoint
  const actualWireLength = nodeWireLength - weightTopY
  const wireY = weightTopY + actualWireLength / 2
  
  // Handle click - select or expand
  const handleClick = (e) => {
    e.stopPropagation()
    if (isSelected) {
      // Already selected, don't expand on single click when selected
      return
    }
    setSelected(node.id)
  }
  
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    expandWeight(node.id)
  }
  
  // Animate selection glow
  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const targetEmissive = isSelected ? 0.3 : 0
      meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        meshRef.current.material.emissiveIntensity,
        targetEmissive,
        0.1
      )
    }
  })
  
  // Parse color
  const color = new THREE.Color(node.color)
  
  // Create organic geometry if needed (memoized)
  const organicGeometry = useMemo(() => {
    if (node.shape !== 'organic') return null
    const thickness = node.thickness ?? 0.05
    return createOrganicGeometry(node.blobPoints, node.size, thickness)
  }, [node.shape, node.size, node.thickness, node.blobPoints])
  
  // Create disk geometry (memoized) - rotated to hang vertically from edge
  const diskGeometry = useMemo(() => {
    if (node.shape !== 'disk') return null
    const thickness = node.thickness ?? 0.05
    const geometry = new THREE.CylinderGeometry(node.size, node.size, thickness, 32)
    // Rotate 90 degrees on Z axis so disk is vertical (facing camera)
    geometry.rotateZ(Math.PI / 2)
    // Translate so top edge is at y=0 (attachment point)
    geometry.translate(0, -node.size, 0)
    return geometry
  }, [node.shape, node.size, node.thickness])
  
  // Render appropriate geometry based on shape
  const renderGeometry = () => {
    const thickness = node.thickness ?? 0.05
    switch (node.shape) {
      case 'cube':
        return <boxGeometry args={[node.size * 1.6, node.size * 1.6, node.size * 1.6]} />
      case 'cylinder':
        return <cylinderGeometry args={[node.size * 0.6, node.size * 0.6, node.size * 2, 16]} />
      case 'cone':
        return <coneGeometry args={[node.size * 0.8, node.size * 2, 16]} />
      case 'torus':
        return <torusGeometry args={[node.size * 0.7, node.size * 0.35, 16, 32]} />
      case 'octahedron':
        return <octahedronGeometry args={[node.size, 0]} />
      case 'tetrahedron':
        return <tetrahedronGeometry args={[node.size * 1.2, 0]} />
      case 'disk':
        // Disk rotated to hang vertically from edge
        return diskGeometry ? <primitive object={diskGeometry} attach="geometry" /> : <sphereGeometry args={[node.size, 24, 24]} />
      case 'organic':
        // Custom organic blob shape - geometry is created above with useMemo
        return organicGeometry ? <primitive object={organicGeometry} attach="geometry" /> : <sphereGeometry args={[node.size, 24, 24]} />
      case 'sphere':
      default:
        return <sphereGeometry args={[node.size, 24, 24]} />
    }
  }
  
  return (
    <group position={[position.x, position.y, 0]}>
      {/* Wire connecting to arm - spans from top of weight to arm endpoint */}
      {actualWireLength > 0 && (
        <mesh position={[0, wireY, 0]}>
          <cylinderGeometry args={[0.02, 0.02, actualWireLength, 8]} />
          <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
        </mesh>
      )}
      
      {/* Weight shape */}
      <mesh 
        ref={meshRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        castShadow
        receiveShadow
      >
        {renderGeometry()}
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[node.size + 0.15, 0.03, 8, 32]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </group>
  )
}

