'use client'
import React from 'react'
import { ReactNebula } from '@flodlc/nebula'

export default function NebulaPage() {
  return (
    <div className="relative w-full h-64">
      <ReactNebula
        config={{
          starsCount: 250,
          starsColor: '#88ccff',
          starsRotationSpeed: 5,
          nebulasIntensity: 15,
          cometFrequence: 0,
          planetsScale: 0,
          sunScale: 0,
          solarSystemOrbite: 65,
          solarSystemSpeedOrbit: 100,
        }}
      />
    </div>
  )
}
