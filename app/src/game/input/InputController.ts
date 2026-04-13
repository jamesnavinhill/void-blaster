import { Vector2 } from 'three'

export interface FrameInput {
  keyboard: Vector2
  pointer: Vector2
  pointerActive: boolean
  primaryFire: boolean
  secondaryFire: boolean
  rollAxis: number
  cycleSpecial: boolean
  toggleRail: boolean
}

export class InputController {
  private readonly pressedKeys = new Set<string>()
  private readonly pressedMouseButtons = new Set<number>()
  private readonly pointer = new Vector2()
  private pointerActive = false
  private wheelRollImpulse = 0
  private cycleSpecialRequested = false
  private toggleRailRequested = false

  constructor(private readonly host: HTMLElement) {
    this.host.tabIndex = 0
    this.host.addEventListener('mouseenter', () => this.host.focus())
    this.host.addEventListener('mousemove', this.handleMouseMove)
    this.host.addEventListener('mouseleave', this.handleMouseLeave)
    this.host.addEventListener('mousedown', this.handleMouseDown)
    this.host.addEventListener('mouseup', this.handleMouseUp)
    this.host.addEventListener('contextmenu', this.preventDefault)
    this.host.addEventListener('wheel', this.handleWheel, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleBlur)
  }

  createFrameInput(): FrameInput {
    const keyboard = new Vector2(
      Number(this.isPressed('KeyD')) - Number(this.isPressed('KeyA')),
      Number(this.isPressed('KeyW')) - Number(this.isPressed('KeyS')),
    )

    if (keyboard.lengthSq() > 1) {
      keyboard.normalize()
    }

    const rollAxis =
      Number(this.isPressed('KeyE')) - Number(this.isPressed('KeyQ')) + this.wheelRollImpulse

    const frameInput: FrameInput = {
      keyboard,
      pointer: this.pointer.clone(),
      pointerActive: this.pointerActive,
      primaryFire: this.isPressed('Space') || this.pressedMouseButtons.has(0),
      secondaryFire: this.isPressed('KeyB') || this.pressedMouseButtons.has(2),
      rollAxis,
      cycleSpecial: this.cycleSpecialRequested,
      toggleRail: this.toggleRailRequested,
    }

    this.wheelRollImpulse = 0
    this.cycleSpecialRequested = false
    this.toggleRailRequested = false

    return frameInput
  }

  private isPressed(code: string): boolean {
    return this.pressedKeys.has(code)
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    const rect = this.host.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    this.pointer.set(x, y)
    this.pointerActive = true
  }

  private readonly handleMouseLeave = (): void => {
    this.pointerActive = false
  }

  private readonly handleMouseDown = (event: MouseEvent): void => {
    this.host.focus()
    this.pressedMouseButtons.add(event.button)
  }

  private readonly handleMouseUp = (event: MouseEvent): void => {
    this.pressedMouseButtons.delete(event.button)
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault()
    this.wheelRollImpulse += event.deltaY < 0 ? -1 : 1
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return
    }

    if (event.code === 'F1') {
      event.preventDefault()
      this.toggleRailRequested = true
      return
    }

    if (event.code === 'KeyC') {
      this.cycleSpecialRequested = true
    }

    this.pressedKeys.add(event.code)
  }

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code)
  }

  private readonly handleBlur = (): void => {
    this.pressedKeys.clear()
    this.pressedMouseButtons.clear()
    this.pointerActive = false
    this.wheelRollImpulse = 0
  }

  private readonly preventDefault = (event: Event): void => {
    event.preventDefault()
  }
}
