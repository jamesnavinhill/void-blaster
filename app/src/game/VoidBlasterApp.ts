import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  MathUtils,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'

import { getBossById } from './config/bosses'
import { enemyCatalog } from './config/enemies'
import { defaultTuningConfig, type TuningConfig } from './config/game-config'
import { specialCatalog } from './config/specials'
import { getThemeById, themeCatalog, type ThemeDefinition, type ThemeId } from './config/themes'
import { BossSystem } from './boss/BossSystem'
import { EnemySystem } from './enemies/EnemySystem'
import { WaveDirector } from './encounters/WaveDirector'
import { InputController, type FrameInput } from './input/InputController'
import { PlayerShip } from './player/PlayerShip'
import { CollisionSystem } from './physics/CollisionSystem'
import { WeaponSystem } from './weapons/WeaponSystem'
import { TunnelGrid } from './world/TunnelGrid'

interface ShellRefs {
  viewport: HTMLDivElement
  hud: HTMLDivElement
  canvasHost: HTMLDivElement
  rail: HTMLDivElement
  railToggle: HTMLButtonElement
  encounterValue: HTMLSpanElement
  toast: HTMLDivElement
  toastValue: HTMLSpanElement
  scoreValue: HTMLSpanElement
  integrityValue: HTMLSpanElement
  integrityFill: HTMLDivElement
  bossValue: HTMLSpanElement
  bossFill: HTMLDivElement
  bossWidget: HTMLDivElement
  specialValue: HTMLSpanElement
  specialHint: HTMLSpanElement
  cooldownFill: HTMLDivElement
  overlay: HTMLDivElement
  overlayTitle: HTMLParagraphElement
  overlayMessage: HTMLParagraphElement
  themeSelect: HTMLSelectElement
  movementSpeedInput: HTMLInputElement
  tunnelSpeedInput: HTMLInputElement
  rollStrengthInput: HTMLInputElement
  cameraLagInput: HTMLInputElement
  tunnelWidthInput: HTMLInputElement
}

type CombatMode = 'combat' | 'breach'

declare global {
  interface Window {
    advanceTime?: (ms: number) => void
    render_game_to_text?: () => string
    voidBlasterDebug?: {
      previewEnemy: () => void
      previewBoss: () => void
      forceBreach: () => void
      restartRun: () => void
    }
  }
}

export class VoidBlasterApp {
  private readonly shell: ShellRefs
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(58, 1, 0.1, 250)
  private readonly tuning: TuningConfig = { ...defaultTuningConfig }
  private readonly input: InputController
  private readonly player: PlayerShip
  private readonly tunnel: TunnelGrid
  private readonly weapons = new WeaponSystem()
  private readonly enemySystem: EnemySystem
  private readonly bossSystem: BossSystem
  private readonly waveDirector = new WaveDirector()
  private readonly collisions = new CollisionSystem()
  private readonly cameraTarget = new Vector3()
  private readonly cameraLookTarget = new Vector3()
  private readonly muzzleOrigin = new Vector3()
  private readonly playerWorldPosition = new Vector3()

  private activeTheme: ThemeDefinition = getThemeById('neon')
  private activeSpecialIndex = 0
  private progress = 0
  private score = 0
  private destroyedEnemies = 0
  private playerIntegrity = defaultTuningConfig.playerMaxIntegrity
  private simulationTime = 0
  private lastTimestamp = 0
  private railOpen = false
  private mode: CombatMode = 'combat'
  private encounterPhase = 'WAVE'
  private encounterLabel = 'Opening Surge'
  private bossDefeated = false
  private phaseBombOverdrive = false
  private rewardLabel = 'Locked'
  private rewardToastUntil = 0
  private bossStatusVisibleUntil = 0
  private paused = false

  constructor(private readonly root: HTMLDivElement) {
    this.shell = this.buildShell()
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.shell.canvasHost.clientWidth, this.shell.canvasHost.clientHeight)
    this.shell.canvasHost.appendChild(this.renderer.domElement)

    this.input = new InputController(this.shell.viewport)
    this.player = new PlayerShip(this.activeTheme)
    this.tunnel = new TunnelGrid(this.tuning, this.activeTheme)
    this.enemySystem = new EnemySystem(this.activeTheme)
    this.bossSystem = new BossSystem(this.activeTheme)

    this.scene.add(
      this.player.object,
      this.tunnel.object,
      this.enemySystem.object,
      this.bossSystem.object,
      this.weapons.object,
    )
    this.configureScene()
    this.bindControls()
    this.applyTheme(this.activeTheme.id)
    this.installDebugHooks()
    this.handleResize()

    window.addEventListener('resize', this.handleResize)
  }

  start(): void {
    this.lastTimestamp = performance.now()
    this.render()
    window.requestAnimationFrame(this.tick)
  }

  private configureScene(): void {
    const ambient = new AmbientLight('#9eb2ff', 1.3)
    const keyLight = new DirectionalLight('#ffffff', 1.55)
    keyLight.position.set(6, 7, 10)
    const fillLight = new DirectionalLight('#7ce3ff', 1.1)
    fillLight.position.set(-4, 2, -2)

    this.scene.add(ambient, keyLight, fillLight)
    this.camera.position.set(0, 1.8, 13.5)
  }

  private bindControls(): void {
    this.shell.railToggle.addEventListener('click', () => this.setRailOpen(!this.railOpen))

    this.shell.themeSelect.addEventListener('change', () => {
      this.applyTheme(this.shell.themeSelect.value as ThemeId)
    })

    this.bindRange(this.shell.movementSpeedInput, (value) => {
      this.tuning.movementResponsiveness = value
    })
    this.bindRange(this.shell.tunnelSpeedInput, (value) => {
      this.tuning.tunnelSpeed = value
    })
    this.bindRange(this.shell.rollStrengthInput, (value) => {
      this.tuning.rollStrength = value
    })
    this.bindRange(this.shell.cameraLagInput, (value) => {
      this.tuning.cameraLag = value
    })
    this.bindRange(this.shell.tunnelWidthInput, (value) => {
      this.tuning.tunnelWidth = value
      this.tunnel.syncConfig(this.tuning)
    })
  }

  private bindRange(input: HTMLInputElement, onChange: (value: number) => void): void {
    input.addEventListener('input', () => {
      onChange(Number(input.value))
    })
  }

  private readonly tick = (timestamp: number): void => {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000 || 0.016)
    this.lastTimestamp = timestamp

    this.step(dt)
    this.render()
    window.requestAnimationFrame(this.tick)
  }

  private step(dt: number): void {
    const frameInput = this.input.createFrameInput()

    if (frameInput.restart && this.canRestart()) {
      this.restartRun()
      this.updateHud()
      return
    }

    if (frameInput.togglePause && !this.isRunFinished()) {
      this.paused = !this.paused
    }

    if (frameInput.toggleRail) {
      this.setRailOpen(!this.railOpen)
    }

    if (this.paused || this.isRunFinished()) {
      this.updateHud()
      return
    }

    this.simulationTime += dt

    if (frameInput.cycleSpecial) {
      this.activeSpecialIndex = (this.activeSpecialIndex + 1) % specialCatalog.length
    }

    this.player.update(dt, frameInput, this.tuning)
    this.tunnel.syncConfig(this.tuning)
    this.tunnel.update(dt, this.tuning)

    const playerPosition = this.player.getWorldPosition(this.playerWorldPosition)
    const combatInput = this.createCombatInput(frameInput)
    const special = this.getActiveSpecial()

    const encounterUpdate = this.waveDirector.update({
      dt,
      activeEnemies: this.enemySystem.getActiveCount(),
      bossActive: this.bossSystem.isActive(),
      bossDefeated: this.bossDefeated,
    })

    this.encounterPhase = encounterUpdate.encounterPhase
    this.encounterLabel = encounterUpdate.encounterLabel

    for (const enemyId of encounterUpdate.spawns) {
      this.enemySystem.spawnEnemyById(enemyId, this.tuning)
    }

    if (encounterUpdate.startBossId && !this.bossSystem.isActive() && !this.bossDefeated) {
      this.bossSystem.startEncounter(getBossById(encounterUpdate.startBossId))
    }

    if (encounterUpdate.unlockedSpecialId === 'phase-bomb' && !this.phaseBombOverdrive) {
      this.phaseBombOverdrive = true
      this.rewardLabel = encounterUpdate.unlockedRewardLabel ?? 'Phase Bomb Overdrive'
      this.rewardToastUntil = this.simulationTime + 3.6
      this.activeSpecialIndex = Math.max(
        0,
        specialCatalog.findIndex((entry) => entry.id === 'phase-bomb'),
      )
    }

    this.weapons.update(
      dt,
      this.simulationTime,
      this.player.getMuzzleWorldPosition(this.muzzleOrigin),
      combatInput,
      special,
      this.activeTheme,
      {
        phaseBombOverdrive: this.phaseBombOverdrive && special.id === 'phase-bomb',
      },
    )

    this.enemySystem.update(dt, this.tuning, playerPosition)
    this.bossSystem.update(dt, this.simulationTime, playerPosition)

    const projectileSnapshots = this.weapons.getActiveProjectiles()
    const enemyCollisions = this.collisions.resolve(
      projectileSnapshots,
      this.enemySystem.getActiveEnemies(),
      Math.max(this.player.getCollisionRadius(), this.tuning.playerCollisionRadius),
      playerPosition,
    )

    this.resolveProjectileHits(enemyCollisions.projectileHits)
    this.resolvePlayerHits(enemyCollisions.playerHits)

    const bossSnapshot = this.bossSystem.isInIntro() ? null : this.bossSystem.getSnapshot()
    const bossProjectileHits = this.collisions.resolveProjectileTargetHits(projectileSnapshots, bossSnapshot)

    for (const hit of bossProjectileHits) {
      this.weapons.consumeProjectile(hit.projectileId)
      const result = this.bossSystem.applyDamage(hit.damage)

      if (!result) {
        continue
      }

      if (result.destroyed) {
        this.score += result.scoreValue
        this.bossDefeated = true
        this.bossStatusVisibleUntil = this.simulationTime + 4.5
        continue
      }
    }

    const liveBoss = this.bossSystem.isInIntro() ? null : this.bossSystem.getSnapshot()

    if (
      liveBoss &&
      this.collisions.isOverlapping(
        playerPosition,
        Math.max(this.player.getCollisionRadius(), this.tuning.playerCollisionRadius),
        liveBoss.position,
        liveBoss.radius,
      )
    ) {
      this.playerIntegrity = Math.max(0, this.playerIntegrity - liveBoss.contactDamage)

      if (this.playerIntegrity <= 0) {
        this.mode = 'breach'
      }
    }

    this.progress += this.tuning.tunnelSpeed * dt * 0.22
    this.updateCamera(dt)
    this.updateHud()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  private createCombatInput(frameInput: FrameInput): FrameInput {
    if (this.mode === 'combat') {
      return frameInput
    }

    return {
      ...frameInput,
      primaryFire: false,
      secondaryFire: false,
    }
  }

  private resolveProjectileHits(projectileHits: { projectileId: number; enemyId: number; damage: number }[]): void {
    for (const hit of projectileHits) {
      this.weapons.consumeProjectile(hit.projectileId)

      const result = this.enemySystem.applyDamage(hit.enemyId, hit.damage)

      if (!result) {
        continue
      }

      if (result.destroyed) {
        this.score += result.scoreValue
        this.destroyedEnemies += 1
        continue
      }
    }
  }

  private resolvePlayerHits(playerHits: { enemyId: number; damage: number }[]): void {
    for (const hit of playerHits) {
      const enemy = this.enemySystem.consumeEnemy(hit.enemyId)

      if (!enemy) {
        continue
      }

      this.playerIntegrity = Math.max(0, this.playerIntegrity - hit.damage)

      if (this.playerIntegrity <= 0) {
        this.mode = 'breach'
      }
    }
  }

  private updateCamera(dt: number): void {
    const shipPosition = this.player.getWorldPosition(this.cameraTarget)
    const lagAlpha = 1 - Math.exp(-this.tuning.cameraLag * dt)
    const velocityInfluence = this.player.getVelocityMagnitude() * 0.01

    const desiredCameraX = shipPosition.x * 0.34
    const desiredCameraY = 1.8 + shipPosition.y * 0.12
    const desiredCameraZ = 13.5 + velocityInfluence

    this.camera.position.x = MathUtils.lerp(this.camera.position.x, desiredCameraX, lagAlpha)
    this.camera.position.y = MathUtils.lerp(this.camera.position.y, desiredCameraY, lagAlpha)
    this.camera.position.z = MathUtils.lerp(this.camera.position.z, desiredCameraZ, lagAlpha)

    this.cameraLookTarget.set(shipPosition.x * 0.2, shipPosition.y * 0.08, -30)
    this.camera.lookAt(this.cameraLookTarget)
  }

  private updateHud(): void {
    const special = this.getActiveSpecial()
    const cooldownRatio = this.weapons.getCooldownRatio(this.simulationTime)
    const cooldownRemaining = this.weapons.getCooldownRemaining(this.simulationTime)
    const bossSnapshot = this.bossSystem.getSnapshot()
    const bossVisible =
      Boolean(bossSnapshot) ||
      this.bossSystem.isInIntro() ||
      (this.bossDefeated && this.simulationTime <= this.bossStatusVisibleUntil)
    const combatActive =
      this.enemySystem.getActiveCount() > 0 ||
      Boolean(bossSnapshot) ||
      this.bossSystem.isInIntro() ||
      this.destroyedEnemies > 0 ||
      this.mode === 'breach'
    const toastVisible = this.rewardToastUntil > this.simulationTime
    const integrityRatio = Math.max(0.04, this.playerIntegrity / this.tuning.playerMaxIntegrity)
    const runFinished = this.isRunFinished()
    const overlayVisible = this.paused || runFinished

    this.shell.hud.dataset.combatActive = String(combatActive)
    this.shell.hud.dataset.showBriefing = String(!combatActive && this.simulationTime < 9)
    this.shell.toast.dataset.visible = String(toastVisible)
    this.shell.toastValue.textContent = toastVisible ? `${this.rewardLabel} unlocked` : ''
    this.shell.encounterValue.textContent = `${this.encounterPhase} // ${this.encounterLabel}`
    this.shell.scoreValue.textContent = this.score.toString()
    this.shell.integrityValue.textContent = `${this.playerIntegrity}/${this.tuning.playerMaxIntegrity}`
    this.shell.integrityFill.style.transform = `scaleX(${integrityRatio.toFixed(3)})`
    this.shell.bossWidget.dataset.visible = String(bossVisible)
    this.shell.bossValue.textContent =
      bossSnapshot ? `${Math.ceil(bossSnapshot.health)}/${bossSnapshot.maxHealth}` :
      this.bossSystem.isInIntro() ? 'Incoming' :
      this.bossDefeated ? 'Cleared' :
      'No contact'
    this.shell.bossFill.style.transform = `scaleX(${(
      bossSnapshot ? Math.max(0.04, bossSnapshot.health / bossSnapshot.maxHealth) :
      this.bossSystem.isInIntro() ? 0.08 :
      this.bossDefeated ? 1 :
      0.04
    ).toFixed(3)})`
    this.shell.specialValue.textContent = this.phaseBombOverdrive ? `${special.name}+` : special.name
    this.shell.specialHint.textContent =
      cooldownRemaining > 0.05 ? `${cooldownRemaining.toFixed(1)}s cooldown` : 'Ready'
    this.shell.cooldownFill.style.transform = `scaleX(${Math.max(0.04, cooldownRatio).toFixed(3)})`
    this.shell.overlay.dataset.visible = String(overlayVisible)

    if (this.paused) {
      this.shell.overlayTitle.textContent = 'Paused'
      this.shell.overlayMessage.textContent = 'Press Esc to resume the run.'
      return
    }

    if (this.mode === 'breach') {
      this.shell.overlayTitle.textContent = 'Hull Breached'
      this.shell.overlayMessage.textContent = 'Press R or Enter to restart.'
      return
    }

    if (this.encounterPhase === 'CLEAR') {
      this.shell.overlayTitle.textContent = 'Sector Secured'
      this.shell.overlayMessage.textContent = 'Press R or Enter to run it again.'
      return
    }

    this.shell.overlayTitle.textContent = ''
    this.shell.overlayMessage.textContent = ''
  }

  private applyTheme(themeId: ThemeId): void {
    this.activeTheme = getThemeById(themeId)
    this.scene.background = new Color(this.activeTheme.background)
    this.scene.fog = new Fog(this.activeTheme.fog, 20, 95)
    this.player.setTheme(this.activeTheme)
    this.tunnel.setTheme(this.activeTheme)
    this.enemySystem.setTheme(this.activeTheme)
    this.bossSystem.setTheme(this.activeTheme)
    this.shell.themeSelect.value = themeId
    this.root.style.setProperty('--theme-grid', this.activeTheme.grid)
    this.root.style.setProperty('--theme-accent', this.activeTheme.accent)
    this.root.style.setProperty('--theme-background', this.activeTheme.background)
  }

  private setRailOpen(next: boolean): void {
    this.railOpen = next
    this.shell.rail.dataset.open = String(next)
    this.shell.railToggle.textContent = next ? 'Hide Tuning' : 'Tune'
  }

  private getActiveSpecial() {
    const special = specialCatalog[this.activeSpecialIndex]

    if (!special) {
      throw new Error(`Missing special at index ${this.activeSpecialIndex}`)
    }

    return special
  }

  private installDebugHooks(): void {
    window.advanceTime = (ms: number): void => {
      const stepDuration = 1 / 60
      const steps = Math.max(1, Math.round(ms / (1000 / 60)))

      for (let index = 0; index < steps; index += 1) {
        this.step(stepDuration)
      }

      this.render()
    }

    window.render_game_to_text = (): string => this.renderGameToText()
    window.voidBlasterDebug = {
      previewEnemy: () => this.previewEnemyModel(),
      previewBoss: () => this.previewBossModel(),
      forceBreach: () => {
        this.paused = false
        this.mode = 'breach'
        this.updateHud()
      },
      restartRun: () => this.restartRun(),
    }
  }

  private renderGameToText(): string {
    const playerPosition = this.player.getWorldPosition(new Vector3())
    const enemies = this.enemySystem.getActiveEnemies()
    const boss = this.bossSystem.getSnapshot()

    return JSON.stringify({
      mode: this.mode,
      paused: this.paused,
      canRestart: this.canRestart(),
      coordinateSystem: 'Origin is tunnel center. +x right, +y up, +z toward the camera.',
      theme: this.activeTheme.id,
      encounter: {
        phase: this.encounterPhase,
        label: this.encounterLabel,
      },
      score: this.score,
      integrity: this.playerIntegrity,
      progress: Math.floor(this.progress),
      destroyedEnemies: this.destroyedEnemies,
      rewardLabel: this.rewardLabel,
      unlocks: {
        phaseBombOverdrive: this.phaseBombOverdrive,
      },
      player: {
        x: Number(playerPosition.x.toFixed(2)),
        y: Number(playerPosition.y.toFixed(2)),
        z: Number(playerPosition.z.toFixed(2)),
        r: this.player.getCollisionRadius(),
      },
      special: {
        selected: this.getActiveSpecial().id,
        cooldownRemaining: Number(this.weapons.getCooldownRemaining(this.simulationTime).toFixed(2)),
      },
      activeEnemies: enemies.map((enemy) => ({
        id: enemy.id,
        type: enemy.enemyId,
        hp: Number(enemy.health.toFixed(2)),
        x: Number(enemy.position.x.toFixed(2)),
        y: Number(enemy.position.y.toFixed(2)),
        z: Number(enemy.position.z.toFixed(2)),
        r: enemy.radius,
      })),
      boss: boss ? {
        id: boss.id,
        hp: Number(boss.health.toFixed(2)),
        maxHp: boss.maxHealth,
        x: Number(boss.position.x.toFixed(2)),
        y: Number(boss.position.y.toFixed(2)),
        z: Number(boss.position.z.toFixed(2)),
        r: boss.radius,
        intro: this.bossSystem.isInIntro(),
      } : null,
      activeProjectiles: this.weapons.getActiveProjectiles().length,
      threat: Number(
        Math.max(this.enemySystem.getThreatLevel(), boss ? boss.health / boss.maxHealth : 0).toFixed(2),
      ),
    })
  }

  private canRestart(): boolean {
    return this.mode === 'breach' || this.encounterPhase === 'CLEAR'
  }

  private isRunFinished(): boolean {
    return this.canRestart()
  }

  private restartRun(): void {
    this.paused = false
    this.mode = 'combat'
    this.encounterPhase = 'WAVE'
    this.encounterLabel = 'Opening Surge'
    this.progress = 0
    this.score = 0
    this.destroyedEnemies = 0
    this.playerIntegrity = this.tuning.playerMaxIntegrity
    this.simulationTime = 0
    this.bossDefeated = false
    this.phaseBombOverdrive = false
    this.rewardLabel = 'Locked'
    this.rewardToastUntil = 0
    this.bossStatusVisibleUntil = 0
    this.activeSpecialIndex = 0

    this.input.clearState()
    this.player.reset()
    this.weapons.reset()
    this.enemySystem.clear()
    this.bossSystem.clear()
    this.waveDirector.reset()
    this.lastTimestamp = performance.now()
  }

  private previewEnemyModel(): void {
    this.restartRun()
    this.enemySystem.clear()
    this.bossSystem.clear()
    this.weapons.reset()
    this.encounterPhase = 'WAVE'
    this.encounterLabel = 'Common Enemy Preview'
    this.enemySystem.spawnEnemyById('pulse-drone', this.tuning, {
      x: 2.8,
      y: 0.7,
      z: -18,
      phase: 0,
    })
    this.updateHud()
    this.render()
  }

  private previewBossModel(): void {
    this.restartRun()
    this.enemySystem.clear()
    this.weapons.reset()
    this.encounterPhase = 'BOSS'
    this.encounterLabel = 'Boss Preview'
    this.bossSystem.startEncounter(getBossById('apex-harbinger'))

    const playerPosition = this.player.getWorldPosition(this.playerWorldPosition)
    for (let index = 0; index < 180; index += 1) {
      this.bossSystem.update(1 / 60, this.simulationTime + index / 60, playerPosition)
    }

    this.updateHud()
    this.render()
  }

  private readonly handleResize = (): void => {
    const { clientWidth, clientHeight } = this.shell.canvasHost
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  private buildShell(): ShellRefs {
    this.root.innerHTML = `
      <div class="app-shell">
        <section class="viewport" aria-label="Void Blaster viewport">
          <div class="viewport__canvas"></div>
          <div class="hud" data-role="hud" data-combat-active="false" data-show-briefing="true">
            <div class="hud__brand">
              <p class="hud__eyebrow">Void Blaster</p>
              <p class="hud__encounter" data-role="encounter-value"></p>
            </div>

            <div class="hud__toast" data-role="toast" data-visible="false">
              <span data-role="toast-value"></span>
            </div>

            <div class="hud__column hud__column--left">
              <section class="hud-widget hud-widget--hull">
                <span class="hud__label">Hull</span>
                <strong data-role="integrity-value"></strong>
                <div class="hud__meter">
                  <div class="hud__meter-fill hud__meter-fill--hull" data-role="integrity-fill"></div>
                </div>
              </section>
            </div>

            <div class="hud__column hud__column--right">
              <section class="hud-widget hud-widget--score">
                <span class="hud__label">Score</span>
                <strong data-role="score-value"></strong>
              </section>

              <section class="hud-widget hud-widget--boss" data-role="boss-widget" data-visible="false">
                <span class="hud__label">Boss HP</span>
                <strong data-role="boss-value"></strong>
                <div class="hud__meter">
                  <div class="hud__meter-fill hud__meter-fill--boss" data-role="boss-fill"></div>
                </div>
              </section>
            </div>

            <div class="hud__bottom">
              <p class="hud__briefing">WASD move. Space fires. B triggers special. Esc pauses. F1 opens tuning.</p>

              <section class="hud-widget hud-widget--special">
                <span class="hud__label">Special</span>
                <strong data-role="special-value"></strong>
                <div class="hud__cooldown">
                  <span data-role="special-hint"></span>
                  <div class="hud__cooldown-track">
                    <div class="hud__cooldown-fill" data-role="cooldown-fill"></div>
                  </div>
                </div>
              </section>
            </div>

            <div class="hud__overlay" data-role="overlay" data-visible="false">
              <div class="hud__overlay-card">
                <p class="hud__overlay-title" data-role="overlay-title"></p>
                <p class="hud__overlay-message" data-role="overlay-message"></p>
              </div>
            </div>
          </div>
          <button class="rail-toggle" type="button">Tune</button>
        </section>

        <aside class="rail" data-open="false">
          <div class="rail__header">
            <p class="rail__eyebrow">Live Tuning</p>
            <h2>Gameplay Rail</h2>
            <p>These controls shape the feel of the current build in real time.</p>
          </div>

          <label class="field">
            <span>Theme</span>
            <select data-role="theme-select">
              ${themeCatalog
                .map((theme) => `<option value="${theme.id}">${theme.name}</option>`)
                .join('')}
            </select>
          </label>

          <label class="field">
            <span>Movement Responsiveness</span>
            <input data-role="movement-speed" type="range" min="3" max="12" step="0.1" value="${this.tuning.movementResponsiveness}">
          </label>

          <label class="field">
            <span>Tunnel Speed</span>
            <input data-role="tunnel-speed" type="range" min="10" max="40" step="0.5" value="${this.tuning.tunnelSpeed}">
          </label>

          <label class="field">
            <span>Roll Strength</span>
            <input data-role="roll-strength" type="range" min="0.2" max="1.4" step="0.02" value="${this.tuning.rollStrength}">
          </label>

          <label class="field">
            <span>Camera Lag</span>
            <input data-role="camera-lag" type="range" min="1" max="8" step="0.1" value="${this.tuning.cameraLag}">
          </label>

          <label class="field">
            <span>Tunnel Width</span>
            <input data-role="tunnel-width" type="range" min="14" max="28" step="0.5" value="${this.tuning.tunnelWidth}">
          </label>

          <div class="rail__notes">
            <h3>Current V1 Proof Points</h3>
            <ul>
              <li>${enemyCatalog.length} enemy families are staged through directed waves.</li>
              <li>The first boss uses the live projectile and collision contracts.</li>
              <li>Boss clear unlocks a stronger Phase Bomb follow-up hook.</li>
            </ul>
          </div>
        </aside>
      </div>
    `

    return {
      viewport: this.root.querySelector<HTMLDivElement>('.viewport')!,
      hud: this.root.querySelector<HTMLDivElement>('[data-role="hud"]')!,
      canvasHost: this.root.querySelector<HTMLDivElement>('.viewport__canvas')!,
      rail: this.root.querySelector<HTMLDivElement>('.rail')!,
      railToggle: this.root.querySelector<HTMLButtonElement>('.rail-toggle')!,
      encounterValue: this.root.querySelector<HTMLSpanElement>('[data-role="encounter-value"]')!,
      toast: this.root.querySelector<HTMLDivElement>('[data-role="toast"]')!,
      toastValue: this.root.querySelector<HTMLSpanElement>('[data-role="toast-value"]')!,
      scoreValue: this.root.querySelector<HTMLSpanElement>('[data-role="score-value"]')!,
      integrityValue: this.root.querySelector<HTMLSpanElement>('[data-role="integrity-value"]')!,
      integrityFill: this.root.querySelector<HTMLDivElement>('[data-role="integrity-fill"]')!,
      bossValue: this.root.querySelector<HTMLSpanElement>('[data-role="boss-value"]')!,
      bossFill: this.root.querySelector<HTMLDivElement>('[data-role="boss-fill"]')!,
      bossWidget: this.root.querySelector<HTMLDivElement>('[data-role="boss-widget"]')!,
      specialValue: this.root.querySelector<HTMLSpanElement>('[data-role="special-value"]')!,
      specialHint: this.root.querySelector<HTMLSpanElement>('[data-role="special-hint"]')!,
      cooldownFill: this.root.querySelector<HTMLDivElement>('[data-role="cooldown-fill"]')!,
      overlay: this.root.querySelector<HTMLDivElement>('[data-role="overlay"]')!,
      overlayTitle: this.root.querySelector<HTMLParagraphElement>('[data-role="overlay-title"]')!,
      overlayMessage: this.root.querySelector<HTMLParagraphElement>('[data-role="overlay-message"]')!,
      themeSelect: this.root.querySelector<HTMLSelectElement>('[data-role="theme-select"]')!,
      movementSpeedInput: this.root.querySelector<HTMLInputElement>('[data-role="movement-speed"]')!,
      tunnelSpeedInput: this.root.querySelector<HTMLInputElement>('[data-role="tunnel-speed"]')!,
      rollStrengthInput: this.root.querySelector<HTMLInputElement>('[data-role="roll-strength"]')!,
      cameraLagInput: this.root.querySelector<HTMLInputElement>('[data-role="camera-lag"]')!,
      tunnelWidthInput: this.root.querySelector<HTMLInputElement>('[data-role="tunnel-width"]')!,
    }
  }
}
