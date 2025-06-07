import { Application } from 'Application'
import { vec2 } from 'gl-matrix'
import { findVertex } from 'lib/distance'
import { InputHandler } from 'render/glview/InputHandler'
import { createModelViewMatrix } from 'render/util'
import { MorphRenderer, MorphToolModel } from './MorphRenderer'

const BUTTON_LEFT = 0
const BUTTON_MIDDLE = 1
const BUTTON_RIGHT = 2

export class MorphToolMode extends InputHandler {
    app: Application
    model: MorphToolModel
    renderer: MorphRenderer
    constructor(
        app: Application,
        model: MorphToolModel,
        renderer: MorphRenderer
    ) {
        super()
        this.app = app
        this.model = model
        this.renderer = renderer
    }
    override info(): string | undefined {
        return 'Select Vertex'
    }
    override onpointerdown(ev: PointerEvent): void {
        switch(ev.button) {
            case BUTTON_LEFT:
                this.selectVertex(ev)
                break
            case BUTTON_MIDDLE:
                this.rotate(ev)
                break
        }

        ev.preventDefault()
    }
    override onpointermove(ev: PointerEvent): void {
        ev.preventDefault()
        // console.log(`pointermove`)
    }
    override onpointerup(ev: PointerEvent): void {
        ev.preventDefault()
        // console.log(`pointerup`)
    }
    /**
     * select vertex at pointer position
     */
    selectVertex(ev: PointerEvent) {
        const canvas = this.app.glview.canvas as HTMLCanvasElement
        const ctx = this.app.glview.ctx
        let modelViewMatrix = createModelViewMatrix(ctx, true)
        const index = findVertex(
            vec2.fromValues(ev.offsetX, ev.offsetY),
            this.model.isARKitActive.value
                ? this.renderer.vertexARKitOrig
                : this.renderer.vertexMHOrig,
            canvas,
            modelViewMatrix
        )
        if (index !== undefined) {
            this.renderer.indexOfSelectedVertex = index
            this.app.updateManager.invalidateView()
        }
    }
    /**
     * 
     */
    rotate() {
        console.log(`rotate`)
    }
}
