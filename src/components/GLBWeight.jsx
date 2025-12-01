import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'
import { getModelById } from '../config/models'
import { analyzeGLTFScene, estimateMassFromVolume, computeAttachmentOffset } from '../utils/glbAnalyzer'
import { DEFAULT_WIRE_LENGTH } from './Mobile'

export default function GLBWeight({ node, position }) {
  const groupRef = useRef()
  const modelRef = useRef()
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  const expandWeight = useMobileStore((state) => state.expandWeight)
  const updateWeight = useMobileStore((state) => state.updateWeight)
  
  const isSelected = selectedId === node.id
  
  // Get model config
  const modelConfig = getModelById(node.modelId)
  const modelPath = modelConfig?.path || '/assets/earth.glb'
  const modelScale = node.modelScale ?? modelConfig?.defaultScale ?? 0.3
  
  // Load the GLB model
  const { scene } = useGLTF(modelPath)
  
  // State for computed geometry data
  const [geometryData, setGeometryData] = useState(null)
  
  // Analyze geometry on load (unscaled - we apply scale separately)
  useEffect(() => {
    if (scene) {
      // Clone the scene for analysis to avoid modifying the original
      const clonedScene = scene.clone(true)
      clonedScene.updateMatrixWorld(true)
      
      const analysis = analyzeGLTFScene(clonedScene)
      setGeometryData(analysis)
      
      // Auto-set mass based on scaled volume if not already set by user
      if (analysis.volume > 0 && !node.massSetByUser) {
        // Volume scales with cube of scale factor
        const scaledVolume = analysis.volume * Math.pow(modelScale, 3)
        const estimatedMass = estimateMassFromVolume(scaledVolume)
        updateWeight(node.id, { mass: estimatedMass })
      }
    }
  }, [scene, modelScale, node.id, node.massSetByUser, updateWeight])
  
  // Calculate model offset so attachment point is at origin (wire connection point)
  // The offset is in LOCAL (unscaled) coordinates since it's applied before the scale transform
  const modelOffset = useMemo(() => {
    if (!geometryData) {
      return new THREE.Vector3(0, 0, 0)
    }
    // Move model so attachment point is at origin
    return computeAttachmentOffset(geometryData.attachmentPoint)
  }, [geometryData])
  
  // Wire connects from origin (0,0,0) upward to the arm
  // The wire length is simply the full wireLength since the attachment point is now at origin
  const nodeWireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  const wireY = nodeWireLength / 2
  
  // Handle click - select
  const handleClick = (e) => {
    e.stopPropagation()
    if (isSelected) return
    setSelected(node.id)
  }
  
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    expandWeight(node.id)
  }
  
  // Animate selection highlight
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          const targetEmissive = isSelected ? 0.3 : 0
          if (child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = THREE.MathUtils.lerp(
              child.material.emissiveIntensity,
              targetEmissive,
              0.1
            )
          }
        }
      })
    }
  })
  
  // Clone and prepare the model for rendering
  // Include modelScale in dependencies to ensure re-clone when scale changes
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    
    // Apply color tint if specified and set up materials for selection glow
    clone.traverse((child) => {
      if (child.isMesh) {
        // Clone the material to avoid affecting other instances
        child.material = child.material.clone()
        
        // Ensure emissive properties exist for selection glow
        if (!child.material.emissive) {
          child.material.emissive = new THREE.Color(0x3b82f6)
        } else {
          child.material.emissive = new THREE.Color(0x3b82f6)
        }
        child.material.emissiveIntensity = 0
        
        // Enable shadows
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return clone
  }, [scene, modelScale])
  
  // Calculate bounding sphere for selection ring (scaled)
  const boundingRadius = useMemo(() => {
    if (!geometryData?.boundingBox) return modelScale * 0.5
    
    const size = new THREE.Vector3()
    geometryData.boundingBox.getSize(size)
    return (Math.max(size.x, size.z) / 2 + 0.1) * modelScale
  }, [geometryData, modelScale])
  
  // Calculate center position for selection ring (scaled and offset)
  const selectionRingY = useMemo(() => {
    if (!geometryData) return 0
    // Center of gravity in scaled coordinates, adjusted by the model offset
    return (geometryData.centerOfGravity.y + modelOffset.y) * modelScale
  }, [geometryData, modelOffset, modelScale])
  
  return (
    <group ref={groupRef} position={[position.x, position.y, 0]}>
      {/* Wire connecting to arm - goes from origin upward */}
      {nodeWireLength > 0 && (
        <mesh position={[0, wireY, 0]}>
          <cylinderGeometry args={[0.02, 0.02, nodeWireLength, 8]} />
          <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
        </mesh>
      )}
      
      {/* GLB Model - offset applied in local coords, then scaled */}
      <group
        ref={modelRef}
        scale={modelScale}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <group position={[modelOffset.x, modelOffset.y, modelOffset.z]}>
          <primitive key={`${node.modelId}-${modelScale}`} object={clonedScene} />
        </group>
      </group>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh 
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, selectionRingY, 0]}
        >
          <torusGeometry args={[boundingRadius, 0.03, 8, 32]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </group>
  )
}

// Preload all models for better performance
export function preloadModels() {
  useGLTF.preload('/assets/earth.glb')
  useGLTF.preload('/assets/house.glb')
  useGLTF.preload('/assets/jupiter.glb')
}

