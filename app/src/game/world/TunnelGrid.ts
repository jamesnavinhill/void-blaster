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
  private activeTheme: ThemeDefinition

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
    this.activeTheme = theme
    this.syncConfig(config)
    this.setTheme(theme)
  }

  setTheme(theme: ThemeDefinition): void {
    this.activeTheme = theme
    this.frameMaterial.color.set(theme.grid)
    this.railMaterial.color.set(theme.grid)
    this.frameMaterial.opacity = theme.fx.gridFrameOpacity
    this.railMaterial.opacity = theme.fx.gridRailOpacity

    if (this.wallRails) {
      this.wallRails.material.color.set(theme.grid)
      this.wallRails.material.opacity = theme.fx.gridRailOpacity
    }

    for (const frame of this.frames) {
      frame.material.color.set(theme.grid)
      frame.material.opacity = theme.fx.gridFrameOpacity
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
      this.updateFrameOpacity(frame, config, 0)
    }
  }

  update(dt: number, config: TuningConfig, simulationTime: number): void {
    const wrapThreshold = 12
    const resetDepth = -config.segmentSpacing * (config.segmentCount - 1) - 8

    for (const frame of this.frames) {
      frame.line.position.z += config.tunnelSpeed * dt

      if (frame.line.position.z > wrapThreshold) {
        frame.line.position.z = resetDepth
      }

      this.updateFrameOpacity(frame, config, simulationTime)
    }

    if (this.wallRails) {
      const railPulse = 1 + Math.sin(simulationTime * 2.4) * this.activeTheme.fx.pulseAmount * 0.18
      this.wallRails.material.opacity = Math.min(0.85, this.activeTheme.fx.gridRailOpacity * railPulse)
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

  private updateFrameOpacity(frame: TunnelFrame, config: TuningConfig, simulationTime: number): void {
    const fadeDepth = config.segmentSpacing * 7
    const normalizedDepth = Math.min(1, Math.max(0, Math.abs(frame.line.position.z) - 8) / fadeDepth)
    const visibility = Math.pow(1 - normalizedDepth, 3.6)
    const pulse =
      1 + Math.sin(simulationTime * 4.2 - frame.line.position.z * 0.08) * this.activeTheme.fx.pulseAmount * 0.35
    frame.material.opacity = Math.min(
      0.96,
      0.012 + visibility * this.activeTheme.fx.gridFrameOpacity * pulse,
    )
  }
}
