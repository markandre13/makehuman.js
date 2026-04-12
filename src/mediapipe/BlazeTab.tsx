import { Application } from 'Application'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { TAB } from 'HistoryManager'
import { di } from 'lib/di'
import { RenderHandler } from 'render/RenderHandler'
import { RenderView } from 'render/RenderView'
import { Tab } from 'toad.js/viewkit/Tab'
import { AxisIndicator } from './AxisIndicator'
import { Blaze } from './pose/Blaze'
import { ColorBuffer } from 'gl/buffers/ColorBuffer'
import { Form } from 'toad.js/viewkit/Form'

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
            <Form>
                Visualization of incoming Blaze pose data:
                <ul>
                    <li>blue: good visibility</li>
                    <li>red: bad visibility</li>
                </ul>
            </Form>
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

    static blazePoseLinePaths = [
        // torso
        [Blaze.LEFT_SHOULDER, Blaze.RIGHT_SHOULDER, Blaze.RIGHT_HIP, Blaze.LEFT_HIP, Blaze.LEFT_SHOULDER],
        // left arm
        [Blaze.LEFT_SHOULDER, Blaze.LEFT_ELBOW, Blaze.LEFT_WRIST],
        // right arm
        [Blaze.RIGHT_SHOULDER, Blaze.RIGHT_ELBOW, Blaze.RIGHT_WRIST],
        // right leg
        [Blaze.RIGHT_HIP, Blaze.RIGHT_KNEE, Blaze.RIGHT_ANKLE],
        // left leg
        [Blaze.LEFT_HIP, Blaze.LEFT_KNEE, Blaze.LEFT_ANKLE],
        // right hand
        [Blaze.RIGHT_INDEX, Blaze.RIGHT_PINKY, Blaze.RIGHT_WRIST, Blaze.RIGHT_INDEX],
        // left hand
        [Blaze.LEFT_INDEX, Blaze.LEFT_PINKY, Blaze.LEFT_WRIST, Blaze.LEFT_INDEX],
        // right foot
        [Blaze.RIGHT_ANKLE, Blaze.RIGHT_HEEL, Blaze.RIGHT_FOOT_INDEX, Blaze.RIGHT_ANKLE],
        // left foot
        [Blaze.LEFT_ANKLE, Blaze.LEFT_HEEL, Blaze.LEFT_FOOT_INDEX, Blaze.LEFT_ANKLE],
        // head
        [Blaze.RIGHT_EAR, Blaze.LEFT_EAR, Blaze.NOSE, Blaze.RIGHT_EAR]
    ]
    static blazePoseLines() {
        const out: number[] = []
        for (const path of this.blazePoseLinePaths) {
            for (let i = 0; i < path.length; ++i) {
                out.push(path[i])
                if (i > 0 && i < path.length - 1) {
                    out.push(path[i])
                }
            }
        }
        return out
    }
    static lines = BlazeRenderer.blazePoseLines()

    _vertex?: VertexBuffer
    _index?: IndexBuffer
    _color?: ColorBuffer

    _axis = di.get(AxisIndicator)

    override paint(app: Application, view: RenderView): void {
        const gl = view.gl
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()

        gl.disable(gl.CULL_FACE)
        gl.depthMask(true)

        const shader = view.shaderColored
        shader.init(gl, projectionMatrix, modelViewMatrix)

        if (this._vertex === undefined) {
            const xyz = new Float32Array(33 * 3)
            this.app.poseModel.getXYZ(xyz)
            this._vertex = new VertexBuffer(gl, xyz)

            const color = new Float32Array(33 * 3)
            color.fill(1)
            this._color = new ColorBuffer(gl, color)

            this._index = new IndexBuffer(gl, BlazeRenderer.lines)
        } else {
            this.app.poseModel.getXYZ(this._vertex.data)
            this._vertex.update()

            // indicate visibility of the vertices
            const c = this._color!.data
            for (let i = 0, o = 0; i < 33; ++i) {
                const b = this.app.poseModel.getVisibility(i)
                const r = 1 - b
                const g = b
                c[o++] = r
                c[o++] = g
                c[o++] = b
            }
            this._color!.update()
        }

        shader.use(gl)
        this._axis.paint(view)

        this._vertex.bind(shader)
        this._color!.bind(shader)
        this._index!.bind()
        this._index!.drawLines()
    }
}
