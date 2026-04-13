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
  material: LineBasicMaterial
}

export class TunnelGrid {
  readonly object = new Group()

  private readonly frameMaterial = new LineBasicMaterial({
    color: new Color('#39f3ff'),
    transparent: true,
    opacity: 0.42,
  })

  private readonly railMaterial = new LineBasicMaterial({
    color: new Color('#39f3ff'),
    transparent: true,
    opacity: 0.16,
  })

  private wallRails: LineSegments<BufferGeometry, LineBasicMaterial> | null = null
  private frames: TunnelFrame[] = []
  private signature = ''

  constructor(config: TuningConfig, theme: ThemeDefinition) {
    this.syncConfig(config)
    this.setTheme(theme)
  }

  setTheme(theme: ThemeDefinition): void {
    this.frameMaterial.color.set(theme.grid)
    this.railMaterial.color.set(theme.grid)

    if (this.wallRails) {
      this.wallRails.material.color.set(theme.grid)
    }

    for (const frame of this.frames) {
      frame.material.color.set(theme.grid)
    }
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
    this.wallRails = null

    const railGeometry = this.createWallRailGeometry(
      config.tunnelWidth,
      config.tunnelHeight,
      config.segmentSpacing * (config.segmentCount - 1) + 28,
    )
    this.wallRails = new LineSegments(railGeometry, this.railMaterial.clone())
    this.object.add(this.wallRails)

    for (let index = 0; index < config.segmentCount; index += 1) {
      const geometry = this.createFrameGeometry(config.tunnelWidth, config.tunnelHeight)
      const material = this.frameMaterial.clone()
      const line = new LineSegments(geometry, material)
      line.position.z = -index * config.segmentSpacing - 8
      this.object.add(line)

      const frame = { line, material }
      this.frames.push(frame)
      this.updateFrameOpacity(frame, config)
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

      this.updateFrameOpacity(frame, config)
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
    ]

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }

  private createWallRailGeometry(width: number, height: number, depth: number): BufferGeometry {
    const halfWidth = width * 0.5
    const halfHeight = height * 0.5
    const nearZ = 12
    const farZ = -depth
    const ceilingFloorXs = [-0.72, -0.36, 0.36, 0.72].map((value) => value * halfWidth)
    const sideWallYs = [-0.6, 0, 0.6].map((value) => value * halfHeight)
    const points: number[] = []

    for (const x of ceilingFloorXs) {
      points.push(x, -halfHeight, nearZ, x, -halfHeight, farZ)
      points.push(x, halfHeight, nearZ, x, halfHeight, farZ)
    }

    for (const y of sideWallYs) {
      points.push(-halfWidth, y, nearZ, -halfWidth, y, farZ)
      points.push(halfWidth, y, nearZ, halfWidth, y, farZ)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }

  private updateFrameOpacity(frame: TunnelFrame, config: TuningConfig): void {
    const fadeDepth = config.segmentSpacing * 7
    const normalizedDepth = Math.min(1, Math.max(0, Math.abs(frame.line.position.z) - 8) / fadeDepth)
    const visibility = Math.pow(1 - normalizedDepth, 3.6)
    frame.material.opacity = 0.012 + visibility * 0.34
  }
}
