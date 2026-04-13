export type EnemyId = 'pulse-drone' | 'rift-weaver' | 'bulwark'

export interface EnemyDefinition {
  id: EnemyId
  name: string
  radius: number
  maxHealth: number
  scoreValue: number
  contactDamage: number
  forwardSpeed: number
  driftAmplitudeX: number
  driftAmplitudeY: number
  driftFrequency: number
  tracking: number
  color: string
  emissiveIntensity: number
  geometry: 'sphere' | 'octahedron' | 'icosahedron'
}

export const enemyCatalog: EnemyDefinition[] = [
  {
    id: 'pulse-drone',
    name: 'Pulse Drone',
    radius: 0.74,
    maxHealth: 2,
    scoreValue: 120,
    contactDamage: 1,
    forwardSpeed: 8,
    driftAmplitudeX: 1.8,
    driftAmplitudeY: 0.7,
    driftFrequency: 2.2,
    tracking: 0.1,
    color: '#ff7f7f',
    emissiveIntensity: 0.8,
    geometry: 'sphere',
  },
  {
    id: 'rift-weaver',
    name: 'Rift Weaver',
    radius: 0.86,
    maxHealth: 3,
    scoreValue: 190,
    contactDamage: 1,
    forwardSpeed: 6.5,
    driftAmplitudeX: 2.8,
    driftAmplitudeY: 1.35,
    driftFrequency: 1.55,
    tracking: 0.16,
    color: '#ffd166',
    emissiveIntensity: 1,
    geometry: 'octahedron',
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    radius: 1.18,
    maxHealth: 6,
    scoreValue: 340,
    contactDamage: 2,
    forwardSpeed: 4.2,
    driftAmplitudeX: 1.1,
    driftAmplitudeY: 0.42,
    driftFrequency: 0.95,
    tracking: 0.06,
    color: '#8ca8ff',
    emissiveIntensity: 1.25,
    geometry: 'icosahedron',
  },
]
