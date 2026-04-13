export interface TuningConfig {
  movementRangeX: number
  movementRangeY: number
  movementResponsiveness: number
  keyboardAssist: number
  mouseInfluence: number
  rollStrength: number
  playerCollisionRadius: number
  playerMaxIntegrity: number
  tunnelSpeed: number
  cameraLag: number
  tunnelWidth: number
  tunnelHeight: number
  segmentSpacing: number
  segmentCount: number
  enemySpawnInterval: number
  enemySpawnDepth: number
  enemyDespawnZ: number
  maxActiveEnemies: number
}

export const defaultTuningConfig: TuningConfig = {
  movementRangeX: 7.8,
  movementRangeY: 4.2,
  movementResponsiveness: 7,
  keyboardAssist: 0.82,
  mouseInfluence: 1,
  rollStrength: 0.72,
  playerCollisionRadius: 0.95,
  playerMaxIntegrity: 8,
  tunnelSpeed: 24,
  cameraLag: 4.4,
  tunnelWidth: 20,
  tunnelHeight: 11,
  segmentSpacing: 8,
  segmentCount: 18,
  enemySpawnInterval: 1.1,
  enemySpawnDepth: 70,
  enemyDespawnZ: 12,
  maxActiveEnemies: 8,
}
