import type { EnemySnapshot } from '../enemies/EnemySystem'
import type { ProjectileSnapshot } from '../weapons/WeaponSystem'

export interface ProjectileEnemyHit {
  projectileId: number
  enemyId: number
  damage: number
}

export interface PlayerEnemyHit {
  enemyId: number
  damage: number
}

export interface CollisionReport {
  projectileHits: ProjectileEnemyHit[]
  playerHits: PlayerEnemyHit[]
}

export class CollisionSystem {
  resolve(
    projectiles: ProjectileSnapshot[],
    enemies: EnemySnapshot[],
    playerRadius: number,
    playerPosition: { x: number; y: number; z: number },
  ): CollisionReport {
    const projectileHits: ProjectileEnemyHit[] = []
    const playerHits: PlayerEnemyHit[] = []
    const remainingEnemyHealth = new Map(enemies.map((enemy) => [enemy.id, enemy.health]))
    const consumedEnemyIds = new Set<number>()

    for (const projectile of projectiles) {
      for (const enemy of enemies) {
        if (consumedEnemyIds.has(enemy.id)) {
          continue
        }

        const remainingHealth = remainingEnemyHealth.get(enemy.id)

        if (remainingHealth === undefined || remainingHealth <= 0) {
          continue
        }

        if (!this.isOverlapping(projectile.position, projectile.radius, enemy.position, enemy.radius)) {
          continue
        }

        projectileHits.push({
          projectileId: projectile.id,
          enemyId: enemy.id,
          damage: projectile.damage,
        })

        const nextHealth = remainingHealth - projectile.damage
        remainingEnemyHealth.set(enemy.id, nextHealth)

        if (nextHealth <= 0) {
          consumedEnemyIds.add(enemy.id)
        }

        break
      }
    }

    for (const enemy of enemies) {
      const remainingHealth = remainingEnemyHealth.get(enemy.id)

      if (remainingHealth === undefined || remainingHealth <= 0) {
        continue
      }

      if (!this.isOverlapping(playerPosition, playerRadius, enemy.position, enemy.radius)) {
        continue
      }

      consumedEnemyIds.add(enemy.id)
      playerHits.push({
        enemyId: enemy.id,
        damage: enemy.contactDamage,
      })
    }

    return { projectileHits, playerHits }
  }

  private isOverlapping(
    aPosition: { x: number; y: number; z: number },
    aRadius: number,
    bPosition: { x: number; y: number; z: number },
    bRadius: number,
  ): boolean {
    const dx = aPosition.x - bPosition.x
    const dy = aPosition.y - bPosition.y
    const dz = aPosition.z - bPosition.z
    const radius = aRadius + bRadius

    return dx * dx + dy * dy + dz * dz <= radius * radius
  }
}
