import { useFrame } from '@react-three/fiber'
import useMobileStore from '../store/mobileStore'
import { useMemo, useRef } from 'react'

// Simple 3D noise function for turbulent wind
function noise3D(x, y, z, time) {
  // Simple pseudo-noise using sin waves
  const n1 = Math.sin(x * 1.2 + time * 0.5) * Math.cos(y * 0.8 + time * 0.3)
  const n2 = Math.sin(z * 0.9 + time * 0.7) * Math.cos(x * 1.1 + time * 0.4)
  const n3 = Math.sin(y * 1.3 + time * 0.6) * Math.cos(z * 0.7 + time * 0.8)
  return (n1 + n2 + n3) / 3
}

export default function WindSystem() {
  const windIntensity = useMobileStore((state) => state.windIntensity)
  const windMode = useMobileStore((state) => state.windMode)
  const windDirection = useMobileStore((state) => state.windDirection)
  const physicsRefs = useMobileStore((state) => state.physicsRefs)
  const isPaused = useMobileStore((state) => state.isPaused)
  
  const timeRef = useRef(0)
  
  // Base force magnitude (scaled by intensity)
  const baseForce = 2.0
  
  useFrame((state, delta) => {
    if (isPaused || windIntensity === 0) return
    
    timeRef.current += delta
    const time = timeRef.current
    
    // Apply wind force to all registered physics bodies
    Object.entries(physicsRefs).forEach(([nodeId, ref]) => {
      if (!ref || !ref.current) return
      
      const body = ref.current
      
      // Get body position for turbulent wind variation
      const position = body.translation()
      
      let forceX, forceY, forceZ
      
      if (windMode === 'uniform') {
        // Uniform wind - constant direction and magnitude
        const forceMagnitude = baseForce * windIntensity
        forceX = windDirection[0] * forceMagnitude
        forceY = windDirection[1] * forceMagnitude
        forceZ = windDirection[2] * forceMagnitude
      } else {
        // Turbulent wind - varies by position and time
        const turbulence = noise3D(position.x * 0.5, position.y * 0.5, position.z * 0.5, time)
        const forceMagnitude = baseForce * windIntensity * (0.5 + turbulence * 0.5)
        
        // Add some variation to direction based on turbulence
        const angleOffset = turbulence * Math.PI * 0.3
        const cosOffset = Math.cos(angleOffset)
        const sinOffset = Math.sin(angleOffset)
        
        // Rotate wind direction slightly based on turbulence
        forceX = (windDirection[0] * cosOffset - windDirection[2] * sinOffset) * forceMagnitude
        forceY = windDirection[1] * forceMagnitude * (0.8 + turbulence * 0.4)
        forceZ = (windDirection[0] * sinOffset + windDirection[2] * cosOffset) * forceMagnitude
      }
      
      // Apply force at center of mass
      body.applyForce({ x: forceX, y: forceY, z: forceZ }, true)
    })
  })
  
  // This component doesn't render anything visible
  return null
}

// Utility hook for components to get wind force at a position
export function useWindForce(position) {
  const windIntensity = useMobileStore((state) => state.windIntensity)
  const windMode = useMobileStore((state) => state.windMode)
  const windDirection = useMobileStore((state) => state.windDirection)
  
  const baseForce = 2.0
  
  return useMemo(() => {
    if (windIntensity === 0) return { x: 0, y: 0, z: 0 }
    
    if (windMode === 'uniform') {
      const forceMagnitude = baseForce * windIntensity
      return {
        x: windDirection[0] * forceMagnitude,
        y: windDirection[1] * forceMagnitude,
        z: windDirection[2] * forceMagnitude
      }
    }
    
    // For turbulent, return base direction (actual turbulence is applied per-frame)
    const forceMagnitude = baseForce * windIntensity
    return {
      x: windDirection[0] * forceMagnitude,
      y: windDirection[1] * forceMagnitude,
      z: windDirection[2] * forceMagnitude
    }
  }, [windIntensity, windMode, windDirection])
}

