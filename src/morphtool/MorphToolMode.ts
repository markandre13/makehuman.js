import { Application } from 'Application'
import { vec3 } from 'gl-matrix'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { InputHandler } from 'gl/input/InputHandler'
import { MouseButton } from 'gl/input/MouseButton'
import { renderIntoTexture } from 'gl/renderIntoTexture'

// some notes on blender's mesh editor
// * Preferences > Viewport > Selection > GPU Depth Picking > yes
// * Preferences > Themes > 3D Viewport > Vertex Size: 3px
//   valid values are 1px to 32px, and it looks like they are drawn
//   as flat, filled circles, not spheres
//.  source/blender/gpu/GPU_shader_builtin.hh:  /** Draw round points with per vertex size and color. */
//.  GPU_SHADER_3D_POINT_VARYING_SIZE_VARYING_COLOR
//   gpu_shader_3D_point_varying_size_varying_color

export class MorphToolMode extends InputHandler {
    _app: Application
    _model: MorphToolModel
    _renderer: MorphRenderer

    constructor(
        app: Application,
        model: MorphToolModel,
        renderer: MorphRenderer
    ) {
        super()
        this._app = app
        this._model = model
        this._renderer = renderer
    }
    override destructor(): void {
    }
    override info(): string | undefined {
        return 'Select Vertex'
    }
    override selectionCenter() {
        return vec3.fromValues(0, 7, 0)
    }
    override pointerdown(ev: PointerEvent): void {
        switch (ev.button) {
            case MouseButton.LEFT:
                this.selectVertex(ev)
                ev.preventDefault()
                break
        }
    }

    /**
     * select vertex at pointer position
     */
    selectVertex(ev: PointerEvent) {
        const gl = this._app.glview.gl
        const { index } = renderIntoTexture(gl, () => this._renderer.drawVerticesToPick(this._app.glview), ev.offsetX, gl.canvas.height - ev.offsetY)
        if (index !== undefined) {
            this._renderer.toggle(index - 1)
            this._app.glview.invalidate()
            ev.preventDefault()
        }
    }
}
