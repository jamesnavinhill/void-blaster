export type ThemeId = 'neon' | 'sunrise' | 'moonlight'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  background: string
  fog: string
  grid: string
  accent: string
  projectile: string
}

export const themeCatalog: ThemeDefinition[] = [
  {
    id: 'neon',
    name: 'Neon Core',
    description: 'Electric cyan tunnel with magenta combat accents.',
    background: '#050816',
    fog: '#0d1934',
    grid: '#39f3ff',
    accent: '#ff3fb0',
    projectile: '#f8fbff',
  },
  {
    id: 'sunrise',
    name: 'Sunrise Drive',
    description: 'Warm golds and coral glow for a brighter velocity read.',
    background: '#140510',
    fog: '#351128',
    grid: '#ff9d54',
    accent: '#ffd166',
    projectile: '#fff4d2',
  },
  {
    id: 'moonlight',
    name: 'Moonlight Prism',
    description: 'Cool indigo tunnel with iridescent highlight energy.',
    background: '#03050f',
    fog: '#111936',
    grid: '#8ca8ff',
    accent: '#9cf5ff',
    projectile: '#dff5ff',
  },
]

export function getThemeById(id: ThemeId): ThemeDefinition {
  const match = themeCatalog.find((theme) => theme.id === id)

  if (!match) {
    throw new Error(`Unknown theme: ${id}`)
  }

  return match
}
