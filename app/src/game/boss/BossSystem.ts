import {
  BoxGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

import type { BossDefinition } from '../config/bosses'
import type { ThemeDefinition } from '../config/themes'

export interface BossSnapshot {
  id: BossDefinition['id']
  name: string
  health: number
  maxHealth: number
  radius: number
  contactDamage: number
  position: Vector3
  rewardLabel: string
}

export interface BossDamageResult {
  destroyed: boolean
  remainingHealth: number
  scoreValue: number
  rewardLabel: string
  rewardSpecialId: BossDefinition['rewardSpecialId']
}

export class BossSystem {
  readonly object = new Group()

  private readonly shellMaterial = new MeshStandardMaterial({
    color: new Color('#ffe8ff'),
    emissive: new Color('#ff8ae2'),
    emissiveIntensity: 1.15,
    metalness: 0.4,
    roughness: 0.24,
  })
  private readonly coreMaterial = new MeshStandardMaterial({
    color: new Color('#ffd7ff'),
    emissive: new Color('#ff8ae2'),
    emissiveIntensity: 1.6,
    metalness: 0.18,
    roughness: 0.12,
  })
  private readonly body = new Group()
  private readonly position = new Vector3()

  private active = false
  private definition: BossDefinition | null = null
  private health = 0
  private intro = true
  private age = 0

  constructor(theme: ThemeDefinition) {
    this.buildBody()
    this.object.add(this.body)
    this.body.visible = false
    this.setTheme(theme)
  }

  setTheme(theme: ThemeDefinition): void {
    this.shellMaterial.emissive.set(theme.accent)
    this.coreMaterial.emissive.set(theme.accent)
  }

  startEncounter(definition: BossDefinition): void {
    this.definition = definition
    this.health = definition.maxHealth
    this.intro = true
    this.age = 0
    this.active = true
    this.position.set(0, 0, -definition.introDepth)
    this.body.position.copy(this.position)
    this.body.visible = true
    this.shellMaterial.color.set(definition.color)
    this.coreMaterial.color.set('#ffe8ff')
  }

  update(dt: number, simulationTime: number, playerPosition: Vector3): void {
    if (!this.active || !this.definition) {
      return
    }

    this.age += dt

    const desiredZ = -this.definition.anchorDepth
    if (this.intro) {
      this.position.z = MathUtils.lerp(this.position.z, desiredZ, 1 - Math.exp(-1.8 * dt))
      if (Math.abs(this.position.z - desiredZ) < 0.6) {
        this.intro = false
      }
    } else {
      this.position.z = MathUtils.lerp(this.position.z, desiredZ, 1 - Math.exp(-2.6 * dt))
    }

    const swayX = Math.sin(simulationTime * this.definition.swayFrequency) * this.definition.lateralAmplitude
    const swayY = Math.cos(simulationTime * this.definition.swayFrequency * 1.4) * this.definition.verticalAmplitude
    const desiredX = swayX + playerPosition.x * this.definition.tracking
    const desiredY = swayY + playerPosition.y * this.definition.tracking * 0.6

    this.position.x = MathUtils.lerp(this.position.x, desiredX, 1 - Math.exp(-2.2 * dt))
    this.position.y = MathUtils.lerp(this.position.y, desiredY, 1 - Math.exp(-2.4 * dt))
    this.body.position.copy(this.position)
    this.body.rotation.y += dt * 0.32
    this.body.rotation.z = Math.sin(this.age * 1.3) * 0.08
  }

  applyDamage(damage: number): BossDamageResult | null {
    if (!this.active || !this.definition) {
      return null
    }

    this.health = Math.max(0, this.health - damage)
    this.coreMaterial.emissiveIntensity = 1.8

    if (this.health <= 0) {
      const result: BossDamageResult = {
        destroyed: true,
        remainingHealth: 0,
        scoreValue: this.definition.scoreValue,
        rewardLabel: this.definition.rewardLabel,
        rewardSpecialId: this.definition.rewardSpecialId,
      }
      this.clear()
      return result
    }

    return {
      destroyed: false,
      remainingHealth: this.health,
      scoreValue: 0,
      rewardLabel: this.definition.rewardLabel,
      rewardSpecialId: this.definition.rewardSpecialId,
    }
  }

  getSnapshot(): BossSnapshot | null {
    if (!this.active || !this.definition) {
      return null
    }

    return {
      id: this.definition.id,
      name: this.definition.name,
      health: this.health,
      maxHealth: this.definition.maxHealth,
      radius: this.definition.radius,
      contactDamage: this.definition.contactDamage,
      position: this.position.clone(),
      rewardLabel: this.definition.rewardLabel,
    }
  }

  isActive(): boolean {
    return this.active
  }

  isInIntro(): boolean {
    return this.active && this.intro
  }

  clear(): void {
    this.active = false
    this.definition = null
    this.health = 0
    this.intro = false
    this.body.visible = false
    this.position.set(0, 0, 0)
    this.body.position.copy(this.position)
  }

  private buildBody(): void {
    const core = new Mesh(new SphereGeometry(1.25, 24, 24), this.coreMaterial)
    core.scale.set(1.2, 0.8, 1)

    const hullTop = new Mesh(new BoxGeometry(3.8, 0.65, 1.4), this.shellMaterial)
    hullTop.position.set(0, 0.9, 0)
    hullTop.rotation.z = 0.08

    const hullBottom = new Mesh(new BoxGeometry(3.8, 0.65, 1.4), this.shellMaterial)
    hullBottom.position.set(0, -0.9, 0)
    hullBottom.rotation.z = -0.08

    const leftWing = new Mesh(new BoxGeometry(1.9, 0.28, 4.6), this.shellMaterial)
    leftWing.position.set(-2.2, 0, 0.4)
    leftWing.rotation.x = 0.2

    const rightWing = leftWing.clone()
    rightWing.position.x *= -1
    rightWing.rotation.x *= -1

    const rearFin = new Mesh(new BoxGeometry(1.1, 2.4, 0.32), this.shellMaterial)
    rearFin.position.set(0, 0, 1.75)

    this.body.add(core, hullTop, hullBottom, leftWing, rightWing, rearFin)
  }
}
