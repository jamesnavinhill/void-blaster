import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

import type { SpecialDefinition } from '../config/specials'
import type { ThemeDefinition } from '../config/themes'
import type { FrameInput } from '../input/InputController'

interface Projectile {
  active: boolean
  mesh: Mesh<SphereGeometry, MeshBasicMaterial>
  ttl: number
  velocity: Vector3
}

export class WeaponSystem {
  readonly object = new Group()

  private readonly projectileGeometry = new SphereGeometry(0.14, 12, 12)
  private readonly bombGeometry = new SphereGeometry(0.26, 14, 14)
  private readonly projectiles: Projectile[] = []
  private nextPrimaryReadyAt = 0
  private nextSpecialReadyAt = 0
  private specialCooldownDuration = 0
  private lastActivatedSpecial = 'Stand by'
  private readonly spawnVector = new Vector3()

  update(
    dt: number,
    now: number,
    origin: Vector3,
    input: FrameInput,
    special: SpecialDefinition,
    theme: ThemeDefinition,
  ): void {
    if (input.primaryFire && now >= this.nextPrimaryReadyAt) {
      this.spawnPrimary(origin, theme)
      this.nextPrimaryReadyAt = now + 0.12
    }

    if (input.secondaryFire && now >= this.nextSpecialReadyAt) {
      this.activateSpecial(origin, special)
      this.specialCooldownDuration = special.cooldown
      this.nextSpecialReadyAt = now + special.cooldown
      this.lastActivatedSpecial = special.name
    }

    for (const projectile of this.projectiles) {
      if (!projectile.active) {
        continue
      }

      projectile.ttl -= dt

      if (projectile.ttl <= 0) {
        projectile.active = false
        projectile.mesh.visible = false
        continue
      }

      projectile.mesh.position.addScaledVector(projectile.velocity, dt)
    }
  }

  getCooldownRemaining(now: number): number {
    return Math.max(0, this.nextSpecialReadyAt - now)
  }

  getCooldownRatio(now: number): number {
    if (this.specialCooldownDuration <= 0) {
      return 1
    }

    const remaining = this.getCooldownRemaining(now)
    return 1 - remaining / this.specialCooldownDuration
  }

  getLastActivatedSpecial(): string {
    return this.lastActivatedSpecial
  }

  private spawnPrimary(origin: Vector3, theme: ThemeDefinition): void {
    this.spawnProjectile(origin, new Vector3(0, 0, -52), 1.4, theme.projectile, false)
  }

  private activateSpecial(origin: Vector3, special: SpecialDefinition): void {
    if (special.id === 'nova-burst') {
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12
        this.spawnVector.set(Math.cos(angle) * 10, Math.sin(angle) * 6, -30)
        this.spawnProjectile(origin, this.spawnVector, 1.3, special.color, false)
      }
      return
    }

    if (special.id === 'prism-spray') {
      const spreads = [-9, -4, 0, 4, 9]
      for (const spread of spreads) {
        this.spawnProjectile(origin, new Vector3(spread, 0, -40), 1.2, special.color, false)
      }
      return
    }

    this.spawnProjectile(origin, new Vector3(0, 0, -25), 2.4, special.color, true)
  }

  private spawnProjectile(
    origin: Vector3,
    velocity: Vector3,
    ttl: number,
    color: string,
    heavy: boolean,
  ): void {
    const projectile = this.acquireProjectile(heavy)
    projectile.mesh.material.color.set(new Color(color))
    projectile.mesh.visible = true
    projectile.mesh.position.copy(origin)
    projectile.mesh.scale.setScalar(heavy ? 1.6 : 1)
    projectile.velocity.copy(velocity)
    projectile.ttl = ttl
    projectile.active = true
  }

  private acquireProjectile(heavy: boolean): Projectile {
    const inactive = this.projectiles.find((projectile) => !projectile.active)

    if (inactive) {
      const desiredGeometry = heavy ? this.bombGeometry : this.projectileGeometry
      inactive.mesh.geometry = desiredGeometry
      return inactive
    }

    const material = new MeshBasicMaterial({ color: new Color('#ffffff') })
    const mesh = new Mesh(heavy ? this.bombGeometry : this.projectileGeometry, material)
    mesh.visible = false
    this.object.add(mesh)

    const projectile: Projectile = {
      active: false,
      mesh,
      ttl: 0,
      velocity: new Vector3(),
    }

    this.projectiles.push(projectile)
    return projectile
  }
}
