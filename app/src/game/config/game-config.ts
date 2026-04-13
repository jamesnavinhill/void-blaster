export interface TuningConfig {
  movementRangeX: number
  movementRangeY: number
  movementResponsiveness: number
  keyboardAssist: number
  mouseInfluence: number
  rollStrength: number
  tunnelSpeed: number
  cameraLag: number
  tunnelWidth: number
  tunnelHeight: number
  segmentSpacing: number
  segmentCount: number
}

export const defaultTuningConfig: TuningConfig = {
  movementRangeX: 7.8,
  movementRangeY: 4.2,
  movementResponsiveness: 7,
  keyboardAssist: 0.82,
  mouseInfluence: 1,
  rollStrength: 0.72,
  tunnelSpeed: 24,
  cameraLag: 4.4,
  tunnelWidth: 20,
  tunnelHeight: 11,
  segmentSpacing: 8,
  segmentCount: 18,
}
