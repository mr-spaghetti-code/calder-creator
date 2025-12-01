import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import Ground from './Ground'
import SuspensionPoint from './SuspensionPoint'
import Mobile from './Mobile'
import useMobileStore from '../store/mobileStore'

function SceneContent() {
  const clearSelection = useMobileStore((state) => state.clearSelection)
  const orbitControlsEnabled = useMobileStore((state) => state.orbitControlsEnabled)
  
  const handlePointerMissed = () => {
    clearSelection()
  }
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />
      
      {/* Environment for reflections */}
      <Environment preset="city" />
      
      {/* Scene elements */}
      <SuspensionPoint position={[0, 5, 0]} />
      <Ground />
      
      {/* Mobile */}
      <Mobile />
      
      {/* Camera controls */}
      <OrbitControls 
        makeDefault
        enabled={orbitControlsEnabled}
        enablePan={orbitControlsEnabled}
        enableZoom={orbitControlsEnabled}
        enableRotate={orbitControlsEnabled}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function Scene() {
  const clearSelection = useMobileStore((state) => state.clearSelection)
  
  return (
    <Canvas
      shadows
      camera={{ 
        position: [8, 4, 12], 
        fov: 50,
        near: 0.1,
        far: 100
      }}
      onPointerMissed={clearSelection}
      style={{ background: 'linear-gradient(180deg, #1a1a1f 0%, #0f0f12 100%)' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}

