export type SpecialId = 'nova-burst' | 'prism-spray' | 'phase-bomb'

export interface SpecialDefinition {
  id: SpecialId
  name: string
  description: string
  cooldown: number
  color: string
}

export const specialCatalog: SpecialDefinition[] = [
  {
    id: 'nova-burst',
    name: 'Nova Burst',
    description: 'A radial forward burst that clears breathing room.',
    cooldown: 4,
    color: '#ff63c3',
  },
  {
    id: 'prism-spray',
    name: 'Prism Spray',
    description: 'A denser spread attack for wide pressure coverage.',
    cooldown: 3.5,
    color: '#ffd166',
  },
  {
    id: 'phase-bomb',
    name: 'Phase Bomb',
    description: 'A slower, heavier shot built for boss and elite pressure.',
    cooldown: 6,
    color: '#8ca8ff',
  },
]
