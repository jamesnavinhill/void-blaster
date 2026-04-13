import {
  BoxGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'

import type { TuningConfig } from '../config/game-config'
import type { ThemeDefinition } from '../config/themes'
import type { FrameInput } from '../input/InputController'

export class PlayerShip {
  readonly object = new Group()

  private readonly hullMaterial = new MeshStandardMaterial({
    color: new Color('#d6e2ff'),
    emissive: new Color('#1e315f'),
    metalness: 0.55,
    roughness: 0.24,
  })

  private readonly accentMaterial = new MeshStandardMaterial({
    color: new Color('#ff3fb0'),
    emissive: new Color('#ff3fb0'),
    emissiveIntensity: 1.2,
    metalness: 0.25,
    roughness: 0.2,
  })

  private readonly desiredPosition = new Vector2()
  private readonly velocity = new Vector2()
  private readonly previousPosition = new Vector2()
  private roll = 0

  constructor(theme: ThemeDefinition) {
    const fuselage = new Mesh(new BoxGeometry(0.8, 0.45, 2.3), this.hullMaterial)
    fuselage.castShadow = true

    const cockpit = new Mesh(new SphereGeometry(0.38, 24, 16), this.accentMaterial)
    cockpit.position.set(0, 0.18, -0.25)
    cockpit.scale.set(1, 0.65, 1.3)

    const leftWing = new Mesh(new BoxGeometry(1.6, 0.12, 0.65), this.hullMaterial)
    leftWing.position.set(-0.9, -0.02, 0.1)
    leftWing.rotation.z = -0.18

    const rightWing = leftWing.clone()
    rightWing.position.x *= -1
    rightWing.rotation.z *= -1

    const engineLeft = new Mesh(new SphereGeometry(0.18, 20, 16), this.accentMaterial)
    engineLeft.position.set(-0.28, -0.08, 1.05)
    engineLeft.scale.set(0.85, 0.85, 1.4)

    const engineRight = engineLeft.clone()
    engineRight.position.x *= -1

    this.object.add(fuselage, cockpit, leftWing, rightWing, engineLeft, engineRight)
    this.object.position.set(0, 0, 4)

    this.setTheme(theme)
  }

  setTheme(theme: ThemeDefinition): void {
    this.accentMaterial.color.set(theme.accent)
    this.accentMaterial.emissive.set(theme.accent)
  }

  update(dt: number, input: FrameInput, tuning: TuningConfig): void {
    const pointerX = input.pointerActive ? input.pointer.x * tuning.movementRangeX * tuning.mouseInfluence : 0
    const pointerY = input.pointerActive ? input.pointer.y * tuning.movementRangeY * tuning.mouseInfluence : 0

    const keyboardX = input.keyboard.x * tuning.movementRangeX * tuning.keyboardAssist
    const keyboardY = input.keyboard.y * tuning.movementRangeY * tuning.keyboardAssist

    this.desiredPosition.set(
      MathUtils.clamp(pointerX + keyboardX, -tuning.movementRangeX, tuning.movementRangeX),
      MathUtils.clamp(pointerY + keyboardY, -tuning.movementRangeY, tuning.movementRangeY),
    )

    const moveAlpha = 1 - Math.exp(-tuning.movementResponsiveness * dt)
    this.object.position.x = MathUtils.lerp(this.object.position.x, this.desiredPosition.x, moveAlpha)
    this.object.position.y = MathUtils.lerp(this.object.position.y, this.desiredPosition.y, moveAlpha)

    this.velocity.set(
      (this.object.position.x - this.previousPosition.x) / Math.max(dt, 0.0001),
      (this.object.position.y - this.previousPosition.y) / Math.max(dt, 0.0001),
    )
    this.previousPosition.set(this.object.position.x, this.object.position.y)

    const desiredPitch = MathUtils.clamp(-this.velocity.y * 0.03, -0.5, 0.5)
    const desiredYaw = MathUtils.clamp(-this.velocity.x * 0.018, -0.35, 0.35)
    const desiredRoll = MathUtils.clamp(
      -this.velocity.x * 0.028 + input.rollAxis * tuning.rollStrength,
      -1.2,
      1.2,
    )

    this.object.rotation.x = MathUtils.lerp(this.object.rotation.x, desiredPitch, 1 - Math.exp(-6 * dt))
    this.object.rotation.y = MathUtils.lerp(this.object.rotation.y, desiredYaw, 1 - Math.exp(-5 * dt))
    this.roll = MathUtils.lerp(this.roll, desiredRoll, 1 - Math.exp(-7 * dt))
    this.object.rotation.z = this.roll
  }

  getVelocityMagnitude(): number {
    return this.velocity.length()
  }

  getWorldPosition(target = new Vector3()): Vector3 {
    this.object.updateMatrixWorld()
    return target.setFromMatrixPosition(this.object.matrixWorld)
  }

  getMuzzleWorldPosition(target = new Vector3()): Vector3 {
    this.object.updateMatrixWorld()
    return target.set(0, 0, -1.55).applyMatrix4(this.object.matrixWorld)
  }
}
