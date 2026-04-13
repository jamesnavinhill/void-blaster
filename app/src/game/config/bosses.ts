export type BossId = 'apex-harbinger'

export interface BossDefinition {
  id: BossId
  name: string
  maxHealth: number
  radius: number
  scoreValue: number
  contactDamage: number
  introDepth: number
  anchorDepth: number
  lateralAmplitude: number
  verticalAmplitude: number
  swayFrequency: number
  tracking: number
  color: string
  rewardLabel: string
  rewardSpecialId: 'phase-bomb'
}

export const bossCatalog: BossDefinition[] = [
  {
    id: 'apex-harbinger',
    name: 'Apex Harbinger',
    maxHealth: 34,
    radius: 2.7,
    scoreValue: 1800,
    contactDamage: 3,
    introDepth: 90,
    anchorDepth: 23,
    lateralAmplitude: 4.4,
    verticalAmplitude: 1.5,
    swayFrequency: 0.62,
    tracking: 0.22,
    color: '#ff8ae2',
    rewardLabel: 'Phase Bomb Overdrive',
    rewardSpecialId: 'phase-bomb',
  },
]

export function getBossById(id: BossId): BossDefinition {
  const match = bossCatalog.find((boss) => boss.id === id)

  if (!match) {
    throw new Error(`Unknown boss: ${id}`)
  }

  return match
}
