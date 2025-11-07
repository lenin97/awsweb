'use client'

import ReactNebulaDefault, { ReactNebula as NamedReactNebula } from '@flodlc/nebula'

const ReactNebula = NamedReactNebula || ReactNebulaDefault

export function NebulaBackground() {
  const nebulaConfig = {
    starsCount: 150,
    starsRotationSpeed: 2,
    nebulasIntensity: 3,
    cometsFrequency: 0,
    planetsScale: 0,
    sunScale: 0,
  }

  return (
    <div
     className="absolute inset-0 z-0 pointer-events-none"
     aria-hidden="true"
    >
        <ReactNebula config={nebulaConfig} />
    </div>
  )
}
