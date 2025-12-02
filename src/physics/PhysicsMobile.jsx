import React, { useRef, useEffect, useMemo, useState } from 'react'
import { RigidBody, BallCollider, CuboidCollider, useSphericalJoint } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useMobileStore from '../store/mobileStore'
import { calculateTiltAngle } from './balanceSolver'
import { getModelById, isModelShape } from '../config/models'
import { analyzeGLTFScene, computeAttachmentOffset } from '../utils/glbAnalyzer'

// Default wire length (matching Mobile.jsx)
const DEFAULT_WIRE_LENGTH = 0.7

// Arm mass constants - MUST match balanceSolver.js and mobileTree.js
const ARM_BASE_MASS = 0.1
const ARM_MASS_PER_LENGTH = 0.05

// Calculate world positions for the entire mobile tree using analytical solver
function calculateWorldPositions(node, startY = 5) {
  const positions = {}
  
  function traverse(node, parentPos, parentRotation = 0) {
    if (!node) return
    
    const wireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
    
    if (node.type === 'arm') {
      const tiltAngle = calculateTiltAngle(node)
      const totalRotation = parentRotation + tiltAngle
      
      // Arm position is below parent by wireLength
      const armPos = {
        x: parentPos.x,
        y: parentPos.y - wireLength,
        z: parentPos.z || 0
      }
      
      positions[node.id] = { ...armPos, rotation: totalRotation }
      
      // Calculate child positions
      const leftDist = node.pivotPosition * node.length
      const rightDist = (1 - node.pivotPosition) * node.length
      
      const cosAngle = Math.cos(totalRotation)
      const sinAngle = Math.sin(totalRotation)
      
      const leftEndPos = {
        x: armPos.x - leftDist * cosAngle,
        y: armPos.y - leftDist * sinAngle,
        z: armPos.z
      }
      
      const rightEndPos = {
        x: armPos.x + rightDist * cosAngle,
        y: armPos.y + rightDist * sinAngle,
        z: armPos.z
      }
      
      if (node.leftChild) {
        traverse(node.leftChild, leftEndPos, totalRotation)
      }
      if (node.rightChild) {
        traverse(node.rightChild, rightEndPos, totalRotation)
      }
    } else if (node.type === 'weight') {
      // Weight position is below parent by wireLength
      positions[node.id] = {
        x: parentPos.x,
        y: parentPos.y - wireLength,
        z: parentPos.z || 0
      }
    }
  }
  
  const startPos = { x: 0, y: startY, z: 0 }
  traverse(node, startPos)
  
  return positions
}

// Physics-enabled arm component with stable joint setup
function PhysicsArm({ node, parentBodyRef, parentAnchorLocal, worldPositions, onCollision }) {
  const bodyRef = useRef()
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  const damping = useMobileStore((state) => state.damping)
  const registerPhysicsRef = useMobileStore((state) => state.registerPhysicsRef)
  const unregisterPhysicsRef = useMobileStore((state) => state.unregisterPhysicsRef)
  
  const isSelected = selectedId === node.id
  const worldPos = worldPositions[node.id] || { x: 0, y: 0, z: 0, rotation: 0 }
  const wireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  
  // Register physics ref
  useEffect(() => {
    if (bodyRef.current) {
      registerPhysicsRef(node.id, bodyRef)
    }
    return () => unregisterPhysicsRef(node.id)
  }, [node.id, registerPhysicsRef, unregisterPhysicsRef])
  
  // Spherical joint connecting this arm to its parent
  // Parent anchor is where the wire attaches on the parent
  // Child anchor is at the TOP of the wire (wireLength above the arm pivot)
  useSphericalJoint(parentBodyRef, bodyRef, [
    parentAnchorLocal,
    [0, wireLength, 0] // Top of wire, which connects to parent
  ])
  
  // Calculate arm geometry
  const leftDistance = node.pivotPosition * node.length
  const rightDistance = (1 - node.pivotPosition) * node.length
  const armCenterOffset = (0.5 - node.pivotPosition) * node.length
  
  // Calculate damping values from 0-1 slider
  // Real mobiles have very low air resistance - use realistic values
  // Linear: 0.05-1.5, Angular: 0.1-2.0 for fluid, natural motion
  const linearDamping = 0.05 + damping * 1.45
  const angularDamping = 0.1 + damping * 1.9
  
  // Arm mass - must match analytical solver exactly
  const armMass = ARM_BASE_MASS + node.length * ARM_MASS_PER_LENGTH
  
  const handleClick = (e) => {
    e.stopPropagation()
    setSelected(node.id)
  }
  
  return (
    <>
      <RigidBody
        ref={bodyRef}
        position={[worldPos.x, worldPos.y, worldPos.z]}
        rotation={[0, 0, worldPos.rotation || 0]}
        type="dynamic"
        colliders={false}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        canSleep={false}
        onCollisionEnter={(e) => onCollision && onCollision(node.id, e.other.rigidBodyObject?.userData?.nodeId)}
      >
        {/* Arm collider - offset from pivot to geometric center */}
        {/* Mass is assigned to collider for proper center of mass calculation */}
        <CuboidCollider 
          args={[node.length / 2, 0.06, 0.06]} 
          position={[armCenterOffset, 0, 0]}
          mass={armMass}
        />
        
        {/* Wire visual - extends upward from pivot */}
        <mesh position={[0, wireLength / 2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, wireLength, 8]} />
          <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Arm rod visual */}
        <mesh 
          onClick={handleClick}
          position={[armCenterOffset, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
          userData={{ nodeId: node.id }}
        >
          <cylinderGeometry args={[0.06, 0.06, node.length, 16]} />
          <meshStandardMaterial 
            color={isSelected ? "#3b82f6" : "#22c55e"}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        
        {/* Endpoint markers */}
        <mesh position={[-leftDistance, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[rightDistance, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.5} roughness={0.4} />
        </mesh>
        
        {/* Selection indicator */}
        {isSelected && (
          <mesh position={[armCenterOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, node.length + 0.1, 16]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
          </mesh>
        )}
      </RigidBody>
      
      {/* Render children */}
      {node.leftChild && (
        <PhysicsNode 
          node={node.leftChild}
          parentBodyRef={bodyRef}
          parentAnchorLocal={[-leftDistance, 0, 0]}
          worldPositions={worldPositions}
          onCollision={onCollision}
        />
      )}
      {node.rightChild && (
        <PhysicsNode 
          node={node.rightChild}
          parentBodyRef={bodyRef}
          parentAnchorLocal={[rightDistance, 0, 0]}
          worldPositions={worldPositions}
          onCollision={onCollision}
        />
      )}
    </>
  )
}

// Physics-enabled GLB weight component
function PhysicsGLBWeight({ node, parentBodyRef, parentAnchorLocal, worldPositions, onCollision }) {
  const bodyRef = useRef()
  const modelRef = useRef()
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  const expandWeight = useMobileStore((state) => state.expandWeight)
  const damping = useMobileStore((state) => state.damping)
  const registerPhysicsRef = useMobileStore((state) => state.registerPhysicsRef)
  const unregisterPhysicsRef = useMobileStore((state) => state.unregisterPhysicsRef)
  
  const isSelected = selectedId === node.id
  const wireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  const worldPos = worldPositions[node.id] || { x: 0, y: 0, z: 0 }
  
  // Get model config
  const modelConfig = getModelById(node.modelId)
  const modelPath = modelConfig?.path || '/assets/earth.glb'
  const baseScale = modelConfig?.baseScale ?? 1
  const userScale = node.modelScale ?? modelConfig?.defaultScale ?? 0.3
  const modelScale = baseScale * userScale
  
  // Load the GLB model
  const { scene } = useGLTF(modelPath)
  
  // State for computed geometry data
  const [geometryData, setGeometryData] = useState(null)
  
  // Analyze geometry on load
  useEffect(() => {
    if (scene) {
      const clonedScene = scene.clone(true)
      clonedScene.updateMatrixWorld(true)
      const analysis = analyzeGLTFScene(clonedScene)
      setGeometryData(analysis)
    }
  }, [scene, modelScale])
  
  // Register physics ref
  useEffect(() => {
    if (bodyRef.current) {
      registerPhysicsRef(node.id, bodyRef)
    }
    return () => unregisterPhysicsRef(node.id)
  }, [node.id, registerPhysicsRef, unregisterPhysicsRef])
  
  // Joint to parent arm
  useSphericalJoint(parentBodyRef, bodyRef, [
    parentAnchorLocal,
    [0, wireLength, 0]
  ])
  
  const linearDamping = 0.05 + damping * 1.45
  const angularDamping = 0.1 + damping * 1.9
  const weightMass = node.mass
  
  const handleClick = (e) => {
    e.stopPropagation()
    setSelected(node.id)
  }
  
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    expandWeight(node.id)
  }
  
  // Calculate model offset for attachment point
  const modelOffset = useMemo(() => {
    if (!geometryData) return new THREE.Vector3(0, 0, 0)
    return computeAttachmentOffset(geometryData.attachmentPoint)
  }, [geometryData])
  
  // Calculate collider position at actual center of mass (after offset and scale)
  const colliderPosition = useMemo(() => {
    if (!geometryData) return [0, 0, 0]
    // CoM after offset, then scaled
    const comX = (geometryData.centerOfGravity.x + modelOffset.x) * modelScale
    const comY = (geometryData.centerOfGravity.y + modelOffset.y) * modelScale
    const comZ = (geometryData.centerOfGravity.z + modelOffset.z) * modelScale
    return [comX, comY, comZ]
  }, [geometryData, modelOffset, modelScale])
  
  // Clone and prepare the model
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        if (!child.material.emissive) {
          child.material.emissive = new THREE.Color(0x3b82f6)
        } else {
          child.material.emissive = new THREE.Color(0x3b82f6)
        }
        child.material.emissiveIntensity = 0
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene, modelScale])
  
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
  
  // Calculate bounding box dimensions for collider (half-extents)
  const colliderArgs = useMemo(() => {
    if (!geometryData?.boundingBox) {
      // Default small box until geometry loads
      const defaultSize = modelScale * 0.25
      return [defaultSize, defaultSize, defaultSize]
    }
    const size = new THREE.Vector3()
    geometryData.boundingBox.getSize(size)
    // Half-extents for CuboidCollider, scaled
    return [
      (size.x / 2) * modelScale,
      (size.y / 2) * modelScale,
      (size.z / 2) * modelScale
    ]
  }, [geometryData, modelScale])
  
  // Bounding radius for selection ring (use max dimension)
  const boundingRadius = useMemo(() => {
    if (!geometryData?.boundingBox) return modelScale * 0.5
    const size = new THREE.Vector3()
    geometryData.boundingBox.getSize(size)
    return (Math.max(size.x, size.z) / 2) * modelScale
  }, [geometryData, modelScale])
  
  // Selection ring Y position
  const selectionRingY = useMemo(() => {
    if (!geometryData) return 0
    return (geometryData.centerOfGravity.y + modelOffset.y) * modelScale
  }, [geometryData, modelOffset, modelScale])
  
  return (
    <RigidBody
      ref={bodyRef}
      position={[worldPos.x, worldPos.y, worldPos.z]}
      type="dynamic"
      colliders={false}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      canSleep={false}
      onCollisionEnter={(e) => onCollision && onCollision(node.id, e.other.rigidBodyObject?.userData?.nodeId)}
    >
      {/* Cuboid collider at actual center of mass for proper physics */}
      <CuboidCollider 
        args={colliderArgs} 
        mass={weightMass} 
        position={colliderPosition}
      />
      
      {/* Wire visual */}
      <mesh position={[0, wireLength / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, wireLength, 8]} />
        <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* GLB Model */}
      <group
        ref={modelRef}
        scale={modelScale}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        userData={{ nodeId: node.id }}
      >
        <group position={[modelOffset.x, modelOffset.y, modelOffset.z]}>
          <primitive object={clonedScene} />
        </group>
      </group>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh 
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, selectionRingY, 0]}
        >
          <torusGeometry args={[boundingRadius + 0.1, 0.03, 8, 32]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </RigidBody>
  )
}

// Physics-enabled weight component (primitive shapes)
function PhysicsPrimitiveWeight({ node, parentBodyRef, parentAnchorLocal, worldPositions, onCollision }) {
  const bodyRef = useRef()
  const selectedId = useMobileStore((state) => state.selectedId)
  const setSelected = useMobileStore((state) => state.setSelected)
  const expandWeight = useMobileStore((state) => state.expandWeight)
  const damping = useMobileStore((state) => state.damping)
  const registerPhysicsRef = useMobileStore((state) => state.registerPhysicsRef)
  const unregisterPhysicsRef = useMobileStore((state) => state.unregisterPhysicsRef)
  
  const isSelected = selectedId === node.id
  const wireLength = node.wireLength ?? DEFAULT_WIRE_LENGTH
  const worldPos = worldPositions[node.id] || { x: 0, y: 0, z: 0 }
  
  // Register physics ref
  useEffect(() => {
    if (bodyRef.current) {
      registerPhysicsRef(node.id, bodyRef)
    }
    return () => unregisterPhysicsRef(node.id)
  }, [node.id, registerPhysicsRef, unregisterPhysicsRef])
  
  // Joint to parent arm - anchor at top of weight (where wire connects)
  useSphericalJoint(parentBodyRef, bodyRef, [
    parentAnchorLocal,
    [0, wireLength, 0] // Top of wire
  ])
  
  // Real mobiles have very low air resistance - use realistic values
  // Linear: 0.05-1.5, Angular: 0.1-2.0 for fluid, natural motion
  const linearDamping = 0.05 + damping * 1.45
  const angularDamping = 0.1 + damping * 1.9
  
  // Weight mass - must match analytical solver exactly
  const weightMass = node.mass
  
  const handleClick = (e) => {
    e.stopPropagation()
    setSelected(node.id)
  }
  
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    expandWeight(node.id)
  }
  
  // Determine collider based on shape - mass assigned for proper physics
  const renderCollider = () => {
    switch (node.shape) {
      case 'cube':
        return <CuboidCollider args={[node.size * 0.8, node.size * 0.8, node.size * 0.8]} mass={weightMass} />
      case 'cylinder':
        return <CuboidCollider args={[node.size * 0.6, node.size, node.size * 0.6]} mass={weightMass} />
      default:
        return <BallCollider args={[node.size]} mass={weightMass} />
    }
  }
  
  const color = new THREE.Color(node.color)
  
  return (
    <RigidBody
      ref={bodyRef}
      position={[worldPos.x, worldPos.y, worldPos.z]}
      type="dynamic"
      colliders={false}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      canSleep={false}
      onCollisionEnter={(e) => onCollision && onCollision(node.id, e.other.rigidBodyObject?.userData?.nodeId)}
    >
      {renderCollider()}
      
      {/* Wire visual */}
      <mesh position={[0, wireLength / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, wireLength, 8]} />
        <meshStandardMaterial color="#71717a" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Weight shape */}
      <mesh 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        castShadow
        receiveShadow
        userData={{ nodeId: node.id }}
      >
        {node.shape === 'cube' ? (
          <boxGeometry args={[node.size * 1.6, node.size * 1.6, node.size * 1.6]} />
        ) : node.shape === 'cylinder' ? (
          <cylinderGeometry args={[node.size * 0.6, node.size * 0.6, node.size * 2, 16]} />
        ) : (
          <sphereGeometry args={[node.size, 24, 24]} />
        )}
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.3 : 0}
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
    </RigidBody>
  )
}

// Physics-enabled weight component - delegates to GLB or primitive
function PhysicsWeight({ node, parentBodyRef, parentAnchorLocal, worldPositions, onCollision }) {
  // Check if this is a GLB model weight
  if (isModelShape(node.shape)) {
    return (
      <PhysicsGLBWeight
        node={node}
        parentBodyRef={parentBodyRef}
        parentAnchorLocal={parentAnchorLocal}
        worldPositions={worldPositions}
        onCollision={onCollision}
      />
    )
  }
  
  // Otherwise render primitive shape
  return (
    <PhysicsPrimitiveWeight
      node={node}
      parentBodyRef={parentBodyRef}
      parentAnchorLocal={parentAnchorLocal}
      worldPositions={worldPositions}
      onCollision={onCollision}
    />
  )
}

// Dispatcher for arm vs weight
function PhysicsNode({ node, parentBodyRef, parentAnchorLocal, worldPositions, onCollision }) {
  if (!node) return null
  
  if (node.type === 'arm') {
    return (
      <PhysicsArm 
        node={node}
        parentBodyRef={parentBodyRef}
        parentAnchorLocal={parentAnchorLocal}
        worldPositions={worldPositions}
        onCollision={onCollision}
      />
    )
  }
  
  if (node.type === 'weight') {
    return (
      <PhysicsWeight 
        node={node}
        parentBodyRef={parentBodyRef}
        parentAnchorLocal={parentAnchorLocal}
        worldPositions={worldPositions}
        onCollision={onCollision}
      />
    )
  }
  
  return null
}

// Root physics mobile with fixed anchor point
export default function PhysicsMobile() {
  const mobile = useMobileStore((state) => state.mobile)
  const addCollision = useMobileStore((state) => state.addCollision)
  
  // Fixed anchor point (suspension)
  const anchorRef = useRef()
  
  // Calculate initial world positions for all nodes
  const worldPositions = useMemo(() => {
    if (!mobile) return {}
    return calculateWorldPositions(mobile, 5)
  }, [mobile])
  
  const handleCollision = (id1, id2) => {
    if (id1 && id2) {
      addCollision({ id1, id2, time: Date.now() })
    }
  }
  
  // Suspension point Y position
  const suspensionY = 5
  
  if (!mobile) return null
  
  return (
    <group>
      {/* Fixed anchor point at suspension */}
      <RigidBody 
        ref={anchorRef} 
        type="fixed" 
        position={[0, suspensionY, 0]}
        colliders={false}
      >
        <BallCollider args={[0.05]} sensor />
      </RigidBody>
      
      {/* Root node */}
      <PhysicsNode 
        node={mobile}
        parentBodyRef={anchorRef}
        parentAnchorLocal={[0, 0, 0]}
        worldPositions={worldPositions}
        onCollision={handleCollision}
      />
    </group>
  )
}
