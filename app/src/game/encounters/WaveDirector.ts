import type { BossId } from '../config/bosses'
import type { EnemyId } from '../config/enemies'

interface WaveDefinition {
  label: string
  queue: EnemyId[]
  spawnInterval: number
  maxConcurrent: number
  downtime: number
}

interface WaveDirectorUpdateContext {
  dt: number
  activeEnemies: number
  bossActive: boolean
  bossDefeated: boolean
}

export interface WaveDirectorUpdateResult {
  encounterLabel: string
  encounterPhase: string
  spawns: EnemyId[]
  startBossId?: BossId
  unlockedSpecialId?: 'phase-bomb'
  unlockedRewardLabel?: string
}

const scriptedWaves: WaveDefinition[] = [
  {
    label: 'Opening Surge',
    queue: ['pulse-drone', 'pulse-drone', 'pulse-drone', 'pulse-drone', 'rift-weaver'],
    spawnInterval: 0.78,
    maxConcurrent: 3,
    downtime: 1.8,
  },
  {
    label: 'Crossfire Bloom',
    queue: ['rift-weaver', 'pulse-drone', 'rift-weaver', 'pulse-drone', 'bulwark', 'pulse-drone'],
    spawnInterval: 0.7,
    maxConcurrent: 4,
    downtime: 2.3,
  },
]

export class WaveDirector {
  private phase: 'wave' | 'intermission' | 'boss-intro' | 'boss' | 'reward' | 'complete' = 'wave'
  private waveIndex = 0
  private queueIndex = 0
  private spawnCooldown = 0.45
  private phaseTimer = 0
  private rewardClaimed = false

  update(context: WaveDirectorUpdateContext): WaveDirectorUpdateResult {
    const spawns: EnemyId[] = []
    let startBossId: BossId | undefined
    let unlockedSpecialId: 'phase-bomb' | undefined
    let unlockedRewardLabel: string | undefined

    if (this.phase === 'wave') {
      const wave = scriptedWaves[this.waveIndex]

      if (wave) {
        this.spawnCooldown -= context.dt

        while (
          this.queueIndex < wave.queue.length &&
          context.activeEnemies + spawns.length < wave.maxConcurrent &&
          this.spawnCooldown <= 0
        ) {
          const enemyId = wave.queue[this.queueIndex]

          if (!enemyId) {
            break
          }

          spawns.push(enemyId)
          this.queueIndex += 1
          this.spawnCooldown += wave.spawnInterval
        }

        if (this.queueIndex >= wave.queue.length && context.activeEnemies === 0 && spawns.length === 0) {
          this.phase = this.waveIndex >= scriptedWaves.length - 1 ? 'boss-intro' : 'intermission'
          this.phaseTimer = wave.downtime
          this.waveIndex += this.phase === 'intermission' ? 1 : 0
          this.queueIndex = 0
          this.spawnCooldown = 0.4
        }
      }
    } else if (this.phase === 'intermission') {
      this.phaseTimer -= context.dt
      if (this.phaseTimer <= 0) {
        this.phase = 'wave'
      }
    } else if (this.phase === 'boss-intro') {
      this.phaseTimer -= context.dt
      if (this.phaseTimer <= 0) {
        this.phase = 'boss'
        startBossId = 'apex-harbinger'
      }
    } else if (this.phase === 'boss') {
      if (context.bossDefeated && !context.bossActive) {
        this.phase = 'reward'
        this.phaseTimer = 2.6
        unlockedSpecialId = 'phase-bomb'
        unlockedRewardLabel = 'Phase Bomb Overdrive'
      }
    } else if (this.phase === 'reward') {
      this.phaseTimer -= context.dt
      if (this.phaseTimer <= 0) {
        this.phase = 'complete'
      }
    }

    const encounterPhase =
      this.phase === 'wave' ? 'WAVE' :
      this.phase === 'intermission' ? 'RESET' :
      this.phase === 'boss-intro' ? 'BOSS INBOUND' :
      this.phase === 'boss' ? 'BOSS' :
      this.phase === 'reward' ? 'REWARD' :
      'CLEAR'

    const encounterLabel =
      this.phase === 'wave' ? scriptedWaves[this.waveIndex]?.label ?? 'Opening Surge' :
      this.phase === 'intermission' ? 'Vector realignment' :
      this.phase === 'boss-intro' ? 'Apex signal detected' :
      this.phase === 'boss' ? 'Apex Harbinger' :
      this.phase === 'reward' ? 'Reward uplink' :
      'Sector secured'

    if (this.phase === 'reward' && !this.rewardClaimed) {
      this.rewardClaimed = true
      unlockedSpecialId = 'phase-bomb'
      unlockedRewardLabel = 'Phase Bomb Overdrive'
    }

    return {
      encounterLabel,
      encounterPhase,
      spawns,
      ...(startBossId ? { startBossId } : {}),
      ...(unlockedSpecialId ? { unlockedSpecialId } : {}),
      ...(unlockedRewardLabel ? { unlockedRewardLabel } : {}),
    }
  }
}
