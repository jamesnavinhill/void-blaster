export type ThemeId = 'neon' | 'sunrise' | 'moonlight' | 'ember' | 'verdant' | 'solstice'

export interface ThemeLightingDefinition {
  ambientColor: string
  ambientIntensity: number
  keyColor: string
  keyIntensity: number
  fillColor: string
  fillIntensity: number
  fogNear: number
  fogFar: number
}

export interface ThemeFxDefinition {
  gridFrameOpacity: number
  gridRailOpacity: number
  glowIntensity: number
  pulseAmount: number
}

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  background: string
  fog: string
  grid: string
  accent: string
  projectile: string
  hull: string
  gridPalette: string[]
  lighting: ThemeLightingDefinition
  fx: ThemeFxDefinition
}

export interface ThemeCustomization {
  gridColor: string
  glowIntensity: number
  pulseAmount: number
  lightingIntensity: number
}

export const themeCatalog: ThemeDefinition[] = [
  {
    id: 'neon',
    name: 'Neon Core',
    description: 'Electric cyan lanes with hot magenta combat energy.',
    background: '#050816',
    fog: '#10213e',
    grid: '#44ecff',
    accent: '#ff4ca8',
    projectile: '#f8fbff',
    hull: '#d6e2ff',
    gridPalette: ['#44ecff', '#7fffdc', '#9fbcff', '#ff8ed8', '#ffd166', '#ffffff'],
    lighting: {
      ambientColor: '#8fb2ff',
      ambientIntensity: 1.2,
      keyColor: '#ffffff',
      keyIntensity: 1.45,
      fillColor: '#63dbff',
      fillIntensity: 1.15,
      fogNear: 20,
      fogFar: 102,
    },
    fx: {
      gridFrameOpacity: 0.38,
      gridRailOpacity: 0.16,
      glowIntensity: 1.1,
      pulseAmount: 0.48,
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise Drive',
    description: 'Warm coral rails and gold highlights with cleaner contrast.',
    background: '#160611',
    fog: '#3d1528',
    grid: '#ff9d54',
    accent: '#ffd76a',
    projectile: '#fff4d2',
    hull: '#ffe8d1',
    gridPalette: ['#ff9d54', '#ffd76a', '#ff7b72', '#ffc1a6', '#ffd1dc', '#fff6d6'],
    lighting: {
      ambientColor: '#ffc8a6',
      ambientIntensity: 1.1,
      keyColor: '#fff3d9',
      keyIntensity: 1.4,
      fillColor: '#ff8b7e',
      fillIntensity: 1.02,
      fogNear: 18,
      fogFar: 96,
    },
    fx: {
      gridFrameOpacity: 0.42,
      gridRailOpacity: 0.18,
      glowIntensity: 1.05,
      pulseAmount: 0.38,
    },
  },
  {
    id: 'moonlight',
    name: 'Moonlight Prism',
    description: 'Cool indigo tunnel with crisp prism-blue readability.',
    background: '#03050f',
    fog: '#162347',
    grid: '#8fa8ff',
    accent: '#a5f5ff',
    projectile: '#dff5ff',
    hull: '#dce8ff',
    gridPalette: ['#8fa8ff', '#a5f5ff', '#d0c2ff', '#7fffdc', '#ffcce8', '#ffffff'],
    lighting: {
      ambientColor: '#8da4ff',
      ambientIntensity: 1.1,
      keyColor: '#edf2ff',
      keyIntensity: 1.35,
      fillColor: '#7dcfff',
      fillIntensity: 0.96,
      fogNear: 19,
      fogFar: 98,
    },
    fx: {
      gridFrameOpacity: 0.35,
      gridRailOpacity: 0.14,
      glowIntensity: 0.95,
      pulseAmount: 0.32,
    },
  },
  {
    id: 'ember',
    name: 'Ember Veil',
    description: 'A carbon-black lane cut with ember red and brass heat.',
    background: '#110507',
    fog: '#361014',
    grid: '#ff6b6b',
    accent: '#ffb86a',
    projectile: '#fff0d9',
    hull: '#f4d4c3',
    gridPalette: ['#ff6b6b', '#ff915f', '#ffb86a', '#ffd6a5', '#ffd1dc', '#fff5ea'],
    lighting: {
      ambientColor: '#ffb49b',
      ambientIntensity: 1.02,
      keyColor: '#fff0e3',
      keyIntensity: 1.36,
      fillColor: '#ff7a66',
      fillIntensity: 0.98,
      fogNear: 18,
      fogFar: 92,
    },
    fx: {
      gridFrameOpacity: 0.46,
      gridRailOpacity: 0.2,
      glowIntensity: 1.18,
      pulseAmount: 0.44,
    },
  },
  {
    id: 'verdant',
    name: 'Verdant Flux',
    description: 'Mint-green scanlines with cool reactor glow and high legibility.',
    background: '#04100d',
    fog: '#10352b',
    grid: '#64ffc7',
    accent: '#b4fff2',
    projectile: '#efffff',
    hull: '#d5fff0',
    gridPalette: ['#64ffc7', '#7af7ff', '#b4fff2', '#f3ff9c', '#9fd6ff', '#ffffff'],
    lighting: {
      ambientColor: '#85ffd1',
      ambientIntensity: 1.14,
      keyColor: '#f2fff9',
      keyIntensity: 1.42,
      fillColor: '#52d7c8',
      fillIntensity: 1.08,
      fogNear: 19,
      fogFar: 104,
    },
    fx: {
      gridFrameOpacity: 0.37,
      gridRailOpacity: 0.15,
      glowIntensity: 1.08,
      pulseAmount: 0.36,
    },
  },
  {
    id: 'solstice',
    name: 'Solstice Arc',
    description: 'Sky-blue tunnel lighting with bright amber strike accents.',
    background: '#06111c',
    fog: '#14395a',
    grid: '#7ac8ff',
    accent: '#ffd36e',
    projectile: '#fff9e3',
    hull: '#dceeff',
    gridPalette: ['#7ac8ff', '#8ef1ff', '#ffd36e', '#ffc1a6', '#a7bcff', '#ffffff'],
    lighting: {
      ambientColor: '#7dc3ff',
      ambientIntensity: 1.18,
      keyColor: '#fff8ea',
      keyIntensity: 1.48,
      fillColor: '#59e3ff',
      fillIntensity: 1.1,
      fogNear: 20,
      fogFar: 108,
    },
    fx: {
      gridFrameOpacity: 0.39,
      gridRailOpacity: 0.17,
      glowIntensity: 1.12,
      pulseAmount: 0.34,
    },
  },
]

export function createThemeCustomization(theme: ThemeDefinition): ThemeCustomization {
  return {
    gridColor: theme.grid,
    glowIntensity: theme.fx.glowIntensity,
    pulseAmount: theme.fx.pulseAmount,
    lightingIntensity: 1,
  }
}

export function resolveTheme(theme: ThemeDefinition, customization: ThemeCustomization): ThemeDefinition {
  const lightingMultiplier = customization.lightingIntensity
  const glowMultiplier = customization.glowIntensity

  return {
    ...theme,
    grid: customization.gridColor,
    lighting: {
      ...theme.lighting,
      ambientIntensity: theme.lighting.ambientIntensity * lightingMultiplier,
      keyIntensity: theme.lighting.keyIntensity * lightingMultiplier,
      fillIntensity: theme.lighting.fillIntensity * lightingMultiplier,
    },
    fx: {
      ...theme.fx,
      glowIntensity: customization.glowIntensity,
      pulseAmount: customization.pulseAmount,
      gridFrameOpacity: theme.fx.gridFrameOpacity * (0.72 + glowMultiplier * 0.42),
      gridRailOpacity: theme.fx.gridRailOpacity * (0.74 + glowMultiplier * 0.34),
    },
  }
}

export function getThemeById(id: ThemeId): ThemeDefinition {
  const match = themeCatalog.find((theme) => theme.id === id)

  if (!match) {
    throw new Error(`Unknown theme: ${id}`)
  }

  return match
}
