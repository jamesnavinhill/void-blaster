import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
} from 'three'

import type { TuningConfig } from '../config/game-config'
import type { ThemeDefinition } from '../config/themes'

interface TunnelFrame {
  line: LineSegments<BufferGeometry, LineBasicMaterial>
}

export class TunnelGrid {
  readonly object = new Group()

  private readonly material = new LineBasicMaterial({
    color: new Color('#39f3ff'),
    transparent: true,
    opacity: 0.72,
  })

  private frames: TunnelFrame[] = []
  private signature = ''

  constructor(config: TuningConfig, theme: ThemeDefinition) {
    this.syncConfig(config)
    this.setTheme(theme)
  }

  setTheme(theme: ThemeDefinition): void {
    this.material.color.set(theme.grid)
  }

  syncConfig(config: TuningConfig): void {
    const nextSignature = [
      config.tunnelWidth.toFixed(2),
      config.tunnelHeight.toFixed(2),
      config.segmentSpacing.toFixed(2),
      config.segmentCount.toString(),
    ].join(':')

    if (nextSignature === this.signature) {
      return
    }

    this.signature = nextSignature
    this.object.clear()
    this.frames = []

    for (let index = 0; index < config.segmentCount; index += 1) {
      const geometry = this.createFrameGeometry(config.tunnelWidth, config.tunnelHeight)
      const line = new LineSegments(geometry, this.material)
      line.position.z = -index * config.segmentSpacing - 8
      this.object.add(line)
      this.frames.push({ line })
    }
  }

  update(dt: number, config: TuningConfig): void {
    const wrapThreshold = 12
    const resetDepth = -config.segmentSpacing * (config.segmentCount - 1) - 8

    for (const frame of this.frames) {
      frame.line.position.z += config.tunnelSpeed * dt

      if (frame.line.position.z > wrapThreshold) {
        frame.line.position.z = resetDepth
      }
    }
  }

  private createFrameGeometry(width: number, height: number): BufferGeometry {
    const halfWidth = width * 0.5
    const halfHeight = height * 0.5

    const points = [
      -halfWidth, -halfHeight, 0, halfWidth, -halfHeight, 0,
      halfWidth, -halfHeight, 0, halfWidth, halfHeight, 0,
      halfWidth, halfHeight, 0, -halfWidth, halfHeight, 0,
      -halfWidth, halfHeight, 0, -halfWidth, -halfHeight, 0,
      0, -halfHeight, 0, 0, halfHeight, 0,
      -halfWidth, 0, 0, halfWidth, 0, 0,
      -halfWidth * 0.65, -halfHeight * 0.65, 0, halfWidth * 0.65, halfHeight * 0.65, 0,
      -halfWidth * 0.65, halfHeight * 0.65, 0, halfWidth * 0.65, -halfHeight * 0.65, 0,
    ]

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }
}
