import type { vec3 } from "gl-matrix"

export class InputHandler {
    destructor() {}
    info(): string | undefined { return undefined }
    selectionCenter(): vec3 | undefined { return undefined }
    paint() {}
    keyup(_ev: KeyboardEvent): void {}
    keydown(_ev: KeyboardEvent): void {}
    pointerdown(_ev: PointerEvent): void {}
    pointermove(_ev: PointerEvent): void {}
    pointerup(_ev: PointerEvent): void {}
}
