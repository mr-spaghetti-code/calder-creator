import React from 'react'

export default function SuspensionPoint({ position = [0, 5, 0] }) {
  return (
    <group position={position}>
      {/* Ceiling mount */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 16]} />
        <meshStandardMaterial color="#52525b" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Hanging hook/ring */}
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.03, 8, 24]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

