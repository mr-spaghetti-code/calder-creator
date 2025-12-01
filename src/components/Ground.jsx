import React from 'react'
import { Grid } from '@react-three/drei'

export default function Ground() {
  return (
    <group position={[0, -8, 0]}>
      <Grid 
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3a3a42"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a52"
        fadeDistance={40}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
    </group>
  )
}

