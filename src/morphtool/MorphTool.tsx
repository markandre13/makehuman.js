import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/view/Tab'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { Form, FormField, FormHelp, FormLabel } from 'toad.js/view/Form'
import { FormSwitch } from 'toad.js/view/FormSwitch'
import { MorphToolMode } from './MorphToolMode'
import { Button, Table } from 'toad.js'
import { ComboBox } from 'toad.js/view/ComboBox'
import { ButtonVariant } from 'toad.js/view/Button'
import { RenderHandler } from 'render/RenderHandler'
import { RenderView } from 'render/RenderView'
import { mat4, vec3 } from 'gl-matrix'
import { di } from 'lib/di'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { NormalBuffer } from 'gl/buffers/NormalBuffer'
import { calculateNormalsTriangles } from 'gl/algorithms/calculateNormalsTriangles'
import { BlendshapeModel } from 'blendshapes/BlendshapeModel'
import { MorphTarget } from 'target/MorphTarget'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { WavefrontObj } from 'mesh/WavefrontObj'
import { isZero } from 'gl/algorithms/isZero'
import { ARKitFaceReceiver as ARKitFaceReceiver_skel } from "../net/makehuman_skel"
import { ORB } from 'corba.js'

// TODO
// [ ] Tab.visibilityChange: improve the APIb
// animate
// [ ] enable/disable animation
//   [ ] get one of the following to work again
//       FaceARKitRenderer / FaceARKitLoader
//       FaceICTKitRenderer / FaceICTKitLoader
//       BlendshapeModel

// showMapping: 
// [ ] enable/disable mapping
// [ ] disable when selecting vertices

// how to connect to backend
// * we want most application logic in the frontend as it's platform independant
// * that would mean that the app is responsible to reconnect to the backend

// * installSystemExceptionHandler(object: CORBAObject, handler: () => void)
//   one handler per object...
//   will be called when the connection closes

/**
 * Tool to morph face meshes.
 */
export function MorphTool(props: { app: Application }) {
    const faceRenderer = new FaceRenderer()
    const model = new MorphToolModel()
    const renderer = new MorphRenderer(props.app, model)
    model.renderer = renderer
    model.faceRenderer = faceRenderer
    return (
        <Tab
            label="Morph"
            value={TAB.FACE}
            visibilityChange={(state) => {
                switch (state) {
                    case 'visible':
                        props.app.setRenderer(faceRenderer)
                        if (props.app.glview) {
                            // props.app.glview.pushInputHandler(
                            //     new MorphToolMode(props.app, model, renderer)
                            // )
                        } else {
                            console.trace('NO GLVIEW')
                        }
                        break
                    case 'hidden':
                        // props.ap~zsp.glview.popInputHandler()
                        // reset blendhape model
                        props.app.updateManager.setBlendshapeModel(
                            props.app.frontend.blendshapeModel
                        )
                        break
                }
            }}
        >
            Tool to morph face meshes onto each other.
            <Form>
                <FormSwitch model={model.isARKitActive} />
                <FormSwitch model={model.isTransparentActiveMesh} />
                <FormSwitch model={model.showBothMeshes} />
                <FormSwitch model={model.showMapping} />

                <FormLabel model={model.morphGroups} />
                <FormField>
                    <ComboBox model={model.morphGroups} text={model.newMorphGroup} />
                    {" "}
                    <Button action={model.addMorphGroup} variant={ButtonVariant.ACCENT} />
                    {" "}
                    <Button action={model.deleteMorphGroup} variant={ButtonVariant.NEGATIVE} />
                </FormField>
                <FormHelp model={model.morphGroups} />

                {/* <FormSlider model={model.mhJawOpen}/>
                <FormSlider model={model.externJawOpen}/> */}
            </Form>

            <Table
                model={props.app.morphControls}
                style={{ width: '100%', height: '100%' }}
            />
        </Tab>
    )
}

export class ARKitFaceReceiver_impl extends ARKitFaceReceiver_skel {
    faceRenderer: FaceRenderer
    constructor(orb: ORB, faceRenderer: FaceRenderer) {
        super(orb)
        this.faceRenderer = faceRenderer
    }
    override faceLandmarks(blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        // console.log(`ARKitFaceReceiver_impl::faceLandmarks([${landmarks.length}], [${blendshapes.length}], [${transform.length}], ${timestamp_ms})`)
        // this.faceRenderer.blendshapeParams = blendshapes // MAKE SETTER WHICH INVALIDATES VIEW
        this.faceRenderer.faceLandmarks(blendshapes, transform, timestamp_ms)
    }
}

export class FaceRenderer extends RenderHandler {
    blendshapeSet: FaceARKitLoader2

    blendshapeParams?: Float32Array
    blendshapeTransform?: Float32Array

    private vertices!: VertexBuffer
    private normals!: NormalBuffer
    private indices!: IndexBuffer

    constructor() {
        super()
        // this.blendshapeSet = di.get(FaceARKitLoader2).preload()
        this.blendshapeSet = new FaceARKitLoader2()
        this.blendshapeSet.preload()

        this.blendshapeParams = new Float32Array(Blendshape.SIZE)
    }
    faceLandmarks(blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        // console.log("FaceRenderer::faceLandmarks()")
        this.blendshapeParams = blendshapes
        this.blendshapeTransform = transform
        di.get(Application).glview.invalidate()
    }
    override defaultCamera(): () => mat4 {
        return di.get(Application).headCamera
    }
    override paint(app: Application, view: RenderView): void {
        if (this.blendshapeParams === undefined) {
            return
        }
        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])

        if (this.vertices === undefined) {
            const vertex = this.blendshapeSet.getVertex(this.blendshapeParams, this.blendshapeTransform!)
            this.vertices = new VertexBuffer(gl, vertex)
            this.indices = new IndexBuffer(gl, this.blendshapeSet.getNeutral().fxyz)
            this.normals = new NormalBuffer(gl, calculateNormalsTriangles(
                new Float32Array(vertex.length),
                vertex,
                this.blendshapeSet.getNeutral().fxyz
            ))
        } else {
            this.blendshapeSet.getVertex(this.blendshapeParams, this.blendshapeTransform!, this.vertices.data)
            this.vertices.update()
            calculateNormalsTriangles(
                this.normals.data,
                this.vertices.data,
                this.blendshapeSet.getNeutral().fxyz
            )
            this.normals.update()
        }

        this.vertices.bind(shaderShadedMono)
        this.normals.bind(shaderShadedMono)
        this.indices.bind()
        this.indices.drawTriangles()
    }
}

export class FaceARKitLoader2 {
    _targets = new Array<MorphTarget>(Blendshape.SIZE)
    _neutral?: WavefrontObj

    /**
     * Load all blendshapes. Useful when doing live animation.
     */
    preload(): FaceARKitLoader2 {
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            this.getMorphTarget(blendshape)
        }
        return this
    }

    getNeutral(): WavefrontObj {
        if (this._neutral === undefined) {
            this._neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
            this.transformToMatchMakehumanFace(this._neutral.xyz)
        }
        return this._neutral
    }

    transformToMatchMakehumanFace(xyz: Float32Array | Array<number>) {
        const scale = 9.4
        const dy = 7.08
        const dz = 0.93

        for (let i = 0; i < xyz.length; ++i) {
            xyz[i] *= scale
        }
        for (let i = 1; i < xyz.length; i += 3) {
            xyz[i] += dy
        }
        for (let i = 2; i < xyz.length; i += 3) {
            xyz[i] += dz
        }
    }

    getMorphTarget(blendshape: Blendshape): MorphTarget | undefined {
        this.getNeutral()
        if (blendshape === Blendshape.neutral) {
            return undefined
        }
        let target = this._targets[blendshape]
        if (target !== undefined) {
            return target
        }

        const name = Blendshape[blendshape]
        const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)

        target = new MorphTarget()
        this.transformToMatchMakehumanFace(dst.xyz)
        target.diff(this._neutral!.xyz, dst.xyz)
        this._targets[blendshape] = target
        return target
    }

    /**
     * get blended vertices
     * 
     * @param blendshapeParams 
     * @returns 
     */
    getVertex(blendshapeParams: Float32Array, blendshapeTransform: Float32Array, vertex?: Float32Array): Float32Array {
        // copy 'neutral' to 'vertex'
        const neutral = this.getNeutral()
        if (vertex === undefined) {
            vertex = new Float32Array(neutral.xyz.length)
        }
        vertex.set(this._neutral!.xyz)
        // apply blendshapes to 'vertex'
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            const weight = blendshapeParams[blendshape]
            if (isZero(weight)) {
                continue
            }
            this.getMorphTarget(blendshape)?.apply(vertex, weight)
        }

        // scale and rotate 'vertex'
        // const t = blendshapeTransform
        // const m = mat4.fromValues(
        //     t[0], t[1], t[2], 0,
        //     t[4], t[5], t[6], 0,
        //     t[8], t[9], t[10], 0,
        //     0, 0, 0, 1
        // )

        // // const camera = di.get(Application).glview.ctx.camera
        // // const ic = mat4.clone(camera)
        // // mat4.invert(m, camera)

        // // mat4.multiply(m, ic, m)
        // // mat4.multiply(m, m, camera)

        // const v = vec3.create()
        // for (let i = 0; i < vertex.length; i += 3) {
        //     v[0] = vertex[i]
        //     v[1] = vertex[i + 1]
        //     v[2] = vertex[i + 2]
        //     vec3.transformMat4(v, v, m)
        //     vertex[i] = v[0]
        //     vertex[i + 1] = v[1]
        //     vertex[i + 2] = v[2]
        // }

        return vertex
    }
}
