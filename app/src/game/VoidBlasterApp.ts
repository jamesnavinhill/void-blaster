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

import { defaultTuningConfig, type TuningConfig } from './config/game-config'
import { specialCatalog } from './config/specials'
import { getThemeById, themeCatalog, type ThemeDefinition, type ThemeId } from './config/themes'
import { InputController } from './input/InputController'
import { PlayerShip } from './player/PlayerShip'
import { WeaponSystem } from './weapons/WeaponSystem'
import { TunnelGrid } from './world/TunnelGrid'

interface ShellRefs {
  viewport: HTMLDivElement
  canvasHost: HTMLDivElement
  rail: HTMLDivElement
  railToggle: HTMLButtonElement
  themeValue: HTMLSpanElement
  speedValue: HTMLSpanElement
  progressValue: HTMLSpanElement
  specialValue: HTMLSpanElement
  specialHint: HTMLSpanElement
  cooldownFill: HTMLDivElement
  themeSelect: HTMLSelectElement
  movementSpeedInput: HTMLInputElement
  tunnelSpeedInput: HTMLInputElement
  rollStrengthInput: HTMLInputElement
  cameraLagInput: HTMLInputElement
  tunnelWidthInput: HTMLInputElement
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
  private readonly cameraTarget = new Vector3()
  private readonly cameraLookTarget = new Vector3()
  private readonly muzzleOrigin = new Vector3()

  private activeTheme: ThemeDefinition = getThemeById('neon')
  private activeSpecialIndex = 0
  private progress = 0
  private lastTimestamp = 0
  private railOpen = false

  constructor(private readonly root: HTMLDivElement) {
    this.shell = this.buildShell()
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.shell.canvasHost.clientWidth, this.shell.canvasHost.clientHeight)
    this.shell.canvasHost.appendChild(this.renderer.domElement)

    this.input = new InputController(this.shell.viewport)
    this.player = new PlayerShip(this.activeTheme)
    this.tunnel = new TunnelGrid(this.tuning, this.activeTheme)

    this.scene.add(this.player.object, this.tunnel.object, this.weapons.object)
    this.configureScene()
    this.bindControls()
    this.applyTheme(this.activeTheme.id)
    this.handleResize()

    window.addEventListener('resize', this.handleResize)
  }

  start(): void {
    this.lastTimestamp = performance.now()
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
    const now = timestamp / 1000
    this.lastTimestamp = timestamp

    const frameInput = this.input.createFrameInput()

    if (frameInput.toggleRail) {
      this.setRailOpen(!this.railOpen)
    }

    if (frameInput.cycleSpecial) {
      this.activeSpecialIndex = (this.activeSpecialIndex + 1) % specialCatalog.length
    }

    this.player.update(dt, frameInput, this.tuning)
    this.tunnel.syncConfig(this.tuning)
    this.tunnel.update(dt, this.tuning)

    const special = this.getActiveSpecial()
    this.weapons.update(
      dt,
      now,
      this.player.getMuzzleWorldPosition(this.muzzleOrigin),
      frameInput,
      special,
      this.activeTheme,
    )

    this.progress += this.tuning.tunnelSpeed * dt * 0.22
    this.updateCamera(dt)
    this.updateHud(now)

    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.tick)
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

  private updateHud(now: number): void {
    const special = this.getActiveSpecial()
    const cooldownRatio = this.weapons.getCooldownRatio(now)

    this.shell.themeValue.textContent = this.activeTheme.name
    this.shell.speedValue.textContent = `${this.tuning.tunnelSpeed.toFixed(1)} u/s`
    this.shell.progressValue.textContent = `${Math.floor(this.progress)} m`
    this.shell.specialValue.textContent = special.name
    this.shell.specialHint.textContent = this.weapons.getLastActivatedSpecial()
    this.shell.cooldownFill.style.transform = `scaleX(${Math.max(0.04, cooldownRatio).toFixed(3)})`
  }

  private applyTheme(themeId: ThemeId): void {
    this.activeTheme = getThemeById(themeId)
    this.scene.background = new Color(this.activeTheme.background)
    this.scene.fog = new Fog(this.activeTheme.fog, 20, 95)
    this.player.setTheme(this.activeTheme)
    this.tunnel.setTheme(this.activeTheme)
    this.shell.themeSelect.value = themeId
    this.root.style.setProperty('--theme-grid', this.activeTheme.grid)
    this.root.style.setProperty('--theme-accent', this.activeTheme.accent)
    this.root.style.setProperty('--theme-background', this.activeTheme.background)
  }

  private setRailOpen(next: boolean): void {
    this.railOpen = next
    this.shell.rail.dataset.open = String(next)
    this.shell.railToggle.textContent = next ? 'Close Rail' : 'Open Rail'
  }

  private getActiveSpecial() {
    const special = specialCatalog[this.activeSpecialIndex]

    if (!special) {
      throw new Error(`Missing special at index ${this.activeSpecialIndex}`)
    }

    return special
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
          <div class="hud">
            <div class="hud__brand">
              <p class="hud__eyebrow">Void Blaster</p>
              <h1>Flight Prototype</h1>
              <p class="hud__summary">Desktop-first tunnel combat foundation with live tuning and multiple specials.</p>
            </div>
            <div class="hud__stats">
              <div>
                <span class="hud__label">Theme</span>
                <strong data-role="theme-value"></strong>
              </div>
              <div>
                <span class="hud__label">Tunnel Speed</span>
                <strong data-role="speed-value"></strong>
              </div>
              <div>
                <span class="hud__label">Progress</span>
                <strong data-role="progress-value"></strong>
              </div>
              <div>
                <span class="hud__label">Selected Special</span>
                <strong data-role="special-value"></strong>
              </div>
            </div>
            <div class="hud__footer">
              <p>Move: WASD or mouse | Roll: Q / E or wheel | Fire: Space / Left Click | Special: B / Right Click | Cycle: C | Rail: F1</p>
              <div class="hud__cooldown">
                <span data-role="special-hint"></span>
                <div class="hud__cooldown-track">
                  <div class="hud__cooldown-fill" data-role="cooldown-fill"></div>
                </div>
              </div>
            </div>
          </div>
          <button class="rail-toggle" type="button">Open Rail</button>
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
              <li>Three preset themes are live now.</li>
              <li>Three specials are data-defined and playable.</li>
              <li>The rail stays usable while the game keeps running.</li>
            </ul>
          </div>
        </aside>
      </div>
    `

    return {
      viewport: this.root.querySelector<HTMLDivElement>('.viewport')!,
      canvasHost: this.root.querySelector<HTMLDivElement>('.viewport__canvas')!,
      rail: this.root.querySelector<HTMLDivElement>('.rail')!,
      railToggle: this.root.querySelector<HTMLButtonElement>('.rail-toggle')!,
      themeValue: this.root.querySelector<HTMLSpanElement>('[data-role="theme-value"]')!,
      speedValue: this.root.querySelector<HTMLSpanElement>('[data-role="speed-value"]')!,
      progressValue: this.root.querySelector<HTMLSpanElement>('[data-role="progress-value"]')!,
      specialValue: this.root.querySelector<HTMLSpanElement>('[data-role="special-value"]')!,
      specialHint: this.root.querySelector<HTMLSpanElement>('[data-role="special-hint"]')!,
      cooldownFill: this.root.querySelector<HTMLDivElement>('[data-role="cooldown-fill"]')!,
      themeSelect: this.root.querySelector<HTMLSelectElement>('[data-role="theme-select"]')!,
      movementSpeedInput: this.root.querySelector<HTMLInputElement>('[data-role="movement-speed"]')!,
      tunnelSpeedInput: this.root.querySelector<HTMLInputElement>('[data-role="tunnel-speed"]')!,
      rollStrengthInput: this.root.querySelector<HTMLInputElement>('[data-role="roll-strength"]')!,
      cameraLagInput: this.root.querySelector<HTMLInputElement>('[data-role="camera-lag"]')!,
      tunnelWidthInput: this.root.querySelector<HTMLInputElement>('[data-role="tunnel-width"]')!,
    }
  }
}
