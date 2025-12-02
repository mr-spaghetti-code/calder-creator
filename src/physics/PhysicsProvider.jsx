import React from 'react'
import { Physics } from '@react-three/rapier'
import useMobileStore from '../store/mobileStore'

// Physics configuration - using realistic values
export const PHYSICS_CONFIG = {
  // Real gravity for accurate physics
  gravity: -9.81,
  // Base timestep - 1/60 is standard, we use 1/120 for better stability
  baseTimestep: 1/120
}

export default function PhysicsProvider({ children }) {
  const physicsEnabled = useMobileStore((state) => state.physicsEnabled)
  const isPaused = useMobileStore((state) => state.isPaused)
  const timeScale = useMobileStore((state) => state.timeScale)
  
  // If physics is disabled, just render children without physics wrapper
  if (!physicsEnabled) {
    return <>{children}</>
  }
  
  // Use fixed timestep for stability, timeScale affects simulation speed
  // At timeScale=1, we run at normal speed
  // At timeScale=0.1, we run 10x slower (slow-mo)
  const timestep = PHYSICS_CONFIG.baseTimestep
  
  return (
    <Physics
      gravity={[0, PHYSICS_CONFIG.gravity, 0]}
      paused={isPaused}
      timeStep={timestep}
      // Solver iterations for constraint stability
      numSolverIterations={8}
      numAdditionalFrictionIterations={4}
      interpolate={true}
      colliders={false}
      debug={false}
      // Update priority to allow timeScale to work
      updatePriority={-50}
    >
      {children}
    </Physics>
  )
}

