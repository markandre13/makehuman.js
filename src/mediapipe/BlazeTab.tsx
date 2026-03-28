import { Application } from 'Application'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { NormalBuffer } from 'gl/buffers/NormalBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { TAB } from 'HistoryManager'
import { di } from 'lib/di'
import { RenderHandler } from 'render/RenderHandler'
import { RenderView } from 'render/RenderView'
import { Tab } from 'toad.js/view/Tab'
import { AxisIndicator } from './AxisIndicator'

/**
 * Tool to morph face meshes.
 */
export function BlazeTab(props: { app: Application }) {
    return (
        <Tab
            label="Blaze"
            value={TAB.BLAZE}
            visibilityChange={(state) => {
                switch (state) {
                    case 'visible':
                        // TODO: move this elsewhere
                        // props.app.morphManager.reset()
                        // props.app.skeleton.reset()

                        // const jaw = props.app.skeleton.getBone("jaw")!
                        // jaw.matUserPoseRelative = mat4.fromXRotation(mat4.create(), deg2rad(12))

                        // // move eye
                        // const leftEye = props.app.morphManager.getModifier("eyes/l-eye-trans-down|up")
                        // leftEye!.model!.value = -1
                        // const rightEye = props.app.morphManager.getModifier("eyes/r-eye-trans-down|up")
                        // rightEye!.model!.value = -1
                        // const forehead = props.app.morphManager.getModifier("forehead/forehead-trans-backward|forward")
                        // forehead!.model!.value = -0.5
                        // const mouth = props.app.morphManager.getModifier("mouth/mouth-trans-backward|forward")
                        // mouth!.model!.value = 0.1

                        // props.app.updateManager.updateFromLocalSettingsWithoutGL()

                        props.app.setRenderer(new BlazeRenderer(props.app))
                        // if (props.app.glview) {
                        //     props.app.glview.pushInputHandler(
                        //         new MorphToolMode(props.app, model, renderer)
                        //     )
                        // } else {
                        //     console.trace('NO GLVIEW')
                        // }
                        break
                    case 'hidden':
                        // model.showAnimation.value = false
                        // props.app.morphManager.reset()
                        // props.app.skeleton.reset()
                        // props.app.updateManager.updateFromLocalSettingsWithoutGL()

                        // props.app.glview.popInputHandler()
                        break
                }
            }}
        >
            W.I.P.
        </Tab>
    )
}

export class BlazeRenderer extends RenderHandler {
    app: Application
    constructor(app: Application) {
        super()
        this.app = app
    }
    override defaultCamera() { return this.app.bodyCamera }

    line0 = [
        11, 12, 12, 24, 24, 23, 23, 11, 11, 13, 13, 15, 12, 14, 14, 16, 24, 26, 26, 28, 23, 25, 25, 27,

        20, 18, 18, 16, 16, 20, 15, 19, 19, 17, 17, 15,

        28, 30, 30, 32, 32, 28, 27, 31, 31, 29, 29, 27,

        8, 7, 7, 0, 0, 8,
    ]
    _xyz?: VertexBuffer
    _fxyz?: IndexBuffer

    _axis = di.get(AxisIndicator)

    override paint(app: Application, view: RenderView): void {
        const gl = view.gl
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()

        gl.disable(gl.CULL_FACE)
        gl.depthMask(true)

        const shaderColored = view.shaderColored
        shaderColored.init(gl, projectionMatrix, modelViewMatrix)

        const shaderMono = view.shaderMono
        shaderMono.init(gl, projectionMatrix, modelViewMatrix)

        if (this._xyz === undefined) {
            const data = new Float32Array(33 * 3)
            this.app.poseModel.getXYZ(data)
            this._xyz = new VertexBuffer(gl, data)
            this._fxyz = new IndexBuffer(gl, this.line0)
        } else {
            this.app.poseModel.getXYZ(this._xyz.data)
            this._xyz.update()
        }

        shaderColored.use(gl)
        this._axis.paint(view)

        shaderMono.use(gl)
        shaderMono.setColor(gl, [1,1,1,1])
        this._xyz.bind(shaderMono)
        this._fxyz!.bind()
        this._fxyz!.drawLines()
    }
}
