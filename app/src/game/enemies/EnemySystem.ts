import {
  Color,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  Vector3,
} from 'three'

import { loadShipModel } from '../assets/shipModels'
import type { EnemyDefinition, EnemyId } from '../config/enemies'
import { getEnemyById } from '../config/enemies'
import type { TuningConfig } from '../config/game-config'
import type { ThemeDefinition } from '../config/themes'

export interface EnemySnapshot {
  id: number
  enemyId: EnemyDefinition['id']
  name: string
  position: Vector3
  radius: number
  health: number
  maxHealth: number
  scoreValue: number
  contactDamage: number
}

interface EnemyInstance {
  active: boolean
  id: number
  definition: EnemyDefinition
  mesh: Mesh<BufferGeometry, Material | Material[]>
  material: MeshStandardMaterial
  baseColor: Color
  health: number
  spawnOffsetX: number
  spawnOffsetY: number
  phase: number
  age: number
  visualRoot: Group
}

interface DamageResult {
  destroyed: boolean
  remainingHealth: number
  scoreValue: number
  name: string
}

const geometryMap = {
  sphere: new SphereGeometry(0.72, 18, 18),
  octahedron: new OctahedronGeometry(0.95, 0),
  icosahedron: new IcosahedronGeometry(1.05, 0),
} as const

export class EnemySystem {
  readonly object = new Group()

  private readonly enemies: EnemyInstance[] = []
  private activeTheme: ThemeDefinition
  private nextEnemyId = 1
  private enemyModelTemplate: Group | null = null

  constructor(theme: ThemeDefinition) {
    this.activeTheme = theme
    void this.primeEnemyModel()
  }

  setTheme(theme: ThemeDefinition): void {
    this.activeTheme = theme

    for (const enemy of this.enemies) {
      enemy.material.emissive.set(theme.accent)
      enemy.material.color.copy(enemy.baseColor)
    }
  }

  update(
    dt: number,
    tuning: TuningConfig,
    playerPosition: Vector3,
    simulationTime: number,
  ): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) {
        continue
      }

      enemy.age += dt

      const driftX = Math.sin(enemy.phase + enemy.age * enemy.definition.driftFrequency) * enemy.definition.driftAmplitudeX
      const driftY = Math.cos(enemy.phase * 0.7 + enemy.age * enemy.definition.driftFrequency * 0.8) * enemy.definition.driftAmplitudeY
      const desiredX = enemy.spawnOffsetX + driftX + playerPosition.x * enemy.definition.tracking
      const desiredY = enemy.spawnOffsetY + driftY + playerPosition.y * enemy.definition.tracking * 0.6
      const followAlpha = 1 - Math.exp(-3.2 * dt)

      enemy.mesh.position.x = MathUtils.lerp(enemy.mesh.position.x, desiredX, followAlpha)
      enemy.mesh.position.y = MathUtils.lerp(enemy.mesh.position.y, desiredY, followAlpha)
      enemy.mesh.position.z += (tuning.tunnelSpeed + enemy.definition.forwardSpeed) * dt
      enemy.mesh.rotation.x += dt * 0.65
      enemy.mesh.rotation.y += dt * 0.95
      enemy.material.emissiveIntensity =
        enemy.definition.emissiveIntensity +
        this.activeTheme.fx.glowIntensity * 0.28 +
        (Math.sin(simulationTime * 4.8 + enemy.phase) * 0.5 + 0.5) * this.activeTheme.fx.pulseAmount * 0.42

      if (enemy.mesh.position.z > tuning.enemyDespawnZ) {
        this.deactivateEnemy(enemy)
      }
    }
  }

  getActiveEnemies(): EnemySnapshot[] {
    return this.enemies
      .filter((enemy) => enemy.active)
      .map((enemy) => ({
        id: enemy.id,
        enemyId: enemy.definition.id,
        name: enemy.definition.name,
        position: enemy.mesh.position.clone(),
        radius: enemy.definition.radius,
        health: enemy.health,
        maxHealth: enemy.definition.maxHealth,
        scoreValue: enemy.definition.scoreValue,
        contactDamage: enemy.definition.contactDamage,
      }))
  }

  getActiveCount(): number {
    return this.enemies.reduce((count, enemy) => count + Number(enemy.active), 0)
  }

  getThreatLevel(): number {
    return Math.min(1, this.getActiveCount() / 6)
  }

  clear(): void {
    for (const enemy of this.enemies) {
      this.deactivateEnemy(enemy)
    }

    this.nextEnemyId = 1
  }

  spawnEnemyById(
    enemyId: EnemyId,
    tuning: TuningConfig,
    options?: {
      x?: number
      y?: number
      z?: number
      phase?: number
    },
  ): void {
    this.spawnEnemy(getEnemyById(enemyId), tuning, options)
  }

  applyDamage(enemyId: number, damage: number): DamageResult | null {
    const enemy = this.enemies.find((entry) => entry.active && entry.id === enemyId)

    if (!enemy) {
      return null
    }

    enemy.health = Math.max(0, enemy.health - damage)
    enemy.material.emissiveIntensity = enemy.definition.emissiveIntensity + 0.7

    if (enemy.health <= 0) {
      const result: DamageResult = {
        destroyed: true,
        remainingHealth: 0,
        scoreValue: enemy.definition.scoreValue,
        name: enemy.definition.name,
      }
      this.deactivateEnemy(enemy)
      return result
    }

    return {
      destroyed: false,
      remainingHealth: enemy.health,
      scoreValue: 0,
      name: enemy.definition.name,
    }
  }

  consumeEnemy(enemyId: number): EnemySnapshot | null {
    const enemy = this.enemies.find((entry) => entry.active && entry.id === enemyId)

    if (!enemy) {
      return null
    }

    const snapshot: EnemySnapshot = {
      id: enemy.id,
      enemyId: enemy.definition.id,
      name: enemy.definition.name,
      position: enemy.mesh.position.clone(),
      radius: enemy.definition.radius,
      health: enemy.health,
      maxHealth: enemy.definition.maxHealth,
      scoreValue: enemy.definition.scoreValue,
      contactDamage: enemy.definition.contactDamage,
    }

    this.deactivateEnemy(enemy)
    return snapshot
  }

  private spawnEnemy(
    definition: EnemyDefinition,
    tuning: TuningConfig,
    options?: {
      x?: number
      y?: number
      z?: number
      phase?: number
    },
  ): void {
    const enemy = this.acquireEnemy(definition)
    const widthLimit = tuning.tunnelWidth * 0.32
    const heightLimit = tuning.tunnelHeight * 0.28

    enemy.definition = definition
    enemy.baseColor.set(definition.color)
    enemy.material.color.copy(enemy.baseColor)
    enemy.material.emissive.set(this.activeTheme.accent)
    enemy.material.emissiveIntensity = definition.emissiveIntensity
    enemy.id = this.nextEnemyId
    this.nextEnemyId += 1
    enemy.health = definition.maxHealth
    enemy.spawnOffsetX = options?.x ?? MathUtils.randFloatSpread(widthLimit * 2)
    enemy.spawnOffsetY = options?.y ?? MathUtils.randFloatSpread(heightLimit * 2)
    enemy.phase = options?.phase ?? MathUtils.randFloat(0, Math.PI * 2)
    enemy.age = 0
    enemy.mesh.position.set(
      enemy.spawnOffsetX,
      enemy.spawnOffsetY,
      options?.z ?? -tuning.enemySpawnDepth - Math.random() * 14,
    )
    enemy.mesh.scale.setScalar(definition.radius)
    enemy.mesh.visible = true
    enemy.active = true
  }

  private acquireEnemy(definition: EnemyDefinition): EnemyInstance {
    const inactive = this.enemies.find((enemy) => !enemy.active)

    if (inactive) {
      inactive.mesh.geometry = geometryMap[definition.geometry]
      this.syncEnemyModel(inactive)
      this.applyEnemyVisualState(inactive)
      return inactive
    }

    const material = new MeshStandardMaterial({
      color: new Color(definition.color),
      emissive: new Color(this.activeTheme.accent),
      emissiveIntensity: definition.emissiveIntensity,
      metalness: 0.35,
      roughness: 0.28,
    })
    const mesh = new Mesh(geometryMap[definition.geometry], material)
    mesh.visible = false
    const visualRoot = new Group()
    mesh.add(visualRoot)
    this.object.add(mesh)

    const enemy: EnemyInstance = {
      active: false,
      id: 0,
      definition,
      mesh,
      material,
      baseColor: new Color(definition.color),
      health: definition.maxHealth,
      spawnOffsetX: 0,
      spawnOffsetY: 0,
      phase: 0,
      age: 0,
      visualRoot,
    }

    this.enemies.push(enemy)
    this.syncEnemyModel(enemy)
    this.applyEnemyVisualState(enemy)
    return enemy
  }

  private deactivateEnemy(enemy: EnemyInstance): void {
    enemy.active = false
    enemy.mesh.visible = false
    enemy.mesh.position.setScalar(0)
  }

  private async primeEnemyModel(): Promise<void> {
    const model = await loadShipModel('enemy-stylised')

    if (!model) {
      return
    }

    this.enemyModelTemplate = model

    for (const enemy of this.enemies) {
      this.syncEnemyModel(enemy)
      this.applyEnemyVisualState(enemy)
    }
  }

  private syncEnemyModel(enemy: EnemyInstance): void {
    enemy.visualRoot.clear()

    if (this.enemyModelTemplate) {
      enemy.visualRoot.add(this.enemyModelTemplate.clone(true))
    }
  }

  private applyEnemyVisualState(enemy: EnemyInstance): void {
    const hasExternalModel = enemy.visualRoot.children.length > 0

    enemy.material.transparent = hasExternalModel
    enemy.material.opacity = hasExternalModel ? 0 : 1
    enemy.material.depthWrite = !hasExternalModel
  }
}
