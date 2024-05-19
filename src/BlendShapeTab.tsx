import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { RenderHuman } from "render/RenderHuman"
import { WavefrontObj } from "mesh/WavefrontObj"
import { GLView, Projection, RenderHandler } from "GLView"
import { RenderMesh } from "render/RenderMesh"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { BaseMeshGroup } from "mesh/BaseMeshGroup"
import {
    BooleanModel,
    HTMLElementProps,
    Model,
    ModelView,
    NumberModel,
    OptionModel,
    SelectionModel,
    Table,
    TableEditMode,
    TableEvent,
    ToadIf,
    View,
} from "toad.js"
import { Form } from "toad.js/view/Form"
import { FormText } from "toad.js/view/FormText"
import { Bone } from "skeleton/Bone"
import { blendshapeNames } from "mediapipe/blendshapeNames"
import { FormSelect } from "toad.js/view/FormSelect"
import { ModelViewProps } from "toad.js/view/ModelView"
import { ValueModel } from "toad.js/model/ValueModel"

class BlendShapeEditor extends RenderHandler {
    static instance: BlendShapeEditor | undefined
    static getInstance(app: Application) {
        if (BlendShapeEditor.instance === undefined) {
            BlendShapeEditor.instance = new BlendShapeEditor(app)
        }
        return BlendShapeEditor.instance
    }

    app: Application
    xyz?: Float32Array
    initialized = false
    update = false

    blendshape = new OptionModel(blendshapeNames[0], blendshapeNames, {
        label: "Blendshape",
    })

    // ictkit
    // scale = new NumberModel(0.1, {min: 0.08, max: 0.12,  step: 0.001, label: "scale"})
    // dy = new NumberModel(7.03, {min: 6.6, max: 7.4,  step: 0.001, label: "dy"})
    // dz = new NumberModel(0.392, {min: 0.08, max: 0.82,  step: 0.001, label: "dz"})

    // arkit
    scale = new NumberModel(9.5, { min: 9, max: 11, step: 0.1, label: "scale" })
    dy = new NumberModel(7.12, { min: 0, max: 7.4, step: 0.01, label: "dy" })
    dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

    neutral: WavefrontObj
    renderMeshBS?: RenderMesh
    renderMeshMH?: RenderMesh
    constructor(app: Application) {
        super()
        this.app = app
        // this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        // JawDrop 1, JawDropStretched 0.3
        this.neutral = new WavefrontObj("data/blendshapes/arkit/jawOpen.obj.z")
        // this.neutral = new WavefrontObj("data/blendshapes/ict/_neutral.obj")
        // this.neutral = new WavefrontObj("data/blendshapes/ict/cheekSquintLeft.obj")
        // this.neutral = new WavefrontObj("data/blendshapes/ict/noseSneerLeft.obj")
        // const scale = 0.088
        // const scale = 0.1
        // const dy = 7 // 6.67
        // const dz = 0.43 // 0.43
    }

    override paint(app: Application, view: GLView): void {
        console.log(`paint with scale ${this.scale.value}`)
        if (!this.initialized) {
            this.scale.modified.add(() => {
                console.log(`scale changed to ${this.scale.value}`)
                this.update = true
                app.updateManager.invalidateView()
            })
            this.dy.modified.add(() => {
                this.update = true
                app.updateManager.invalidateView()
            })
            this.dz.modified.add(() => {
                this.update = true
                app.updateManager.invalidateView()
            })
            this.initialized = true
        }
        app.updateManager.updateIt()

        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        if (this.xyz === undefined) {
            this.xyz = new Float32Array(this.neutral.xyz.length)
            this.update = true
        }
        if (this.update) {
            for (let i = 0; i < this.neutral.xyz.length; ++i) {
                this.xyz[i] = this.neutral.xyz[i] * this.scale.value
            }
            for (let i = 1; i < this.neutral.xyz.length; i += 3) {
                this.xyz[i] += this.dy.value
            }
            for (let i = 2; i < this.neutral.xyz.length; i += 3) {
                this.xyz[i] += this.dz.value
            }
            this.update = false
            if (this.renderMeshBS !== undefined) {
                this.renderMeshBS.update(this.xyz)
            }
        }

        if (this.renderMeshBS === undefined) {
            this.renderMeshBS = new RenderMesh(gl, this.xyz, this.neutral.fxyz, undefined, undefined, false)

            this.renderMeshMH = new RenderMesh(
                gl,
                app.humanMesh.baseMesh.xyz,
                app.humanMesh.baseMesh.fxyz,
                undefined,
                undefined,
                false
            )
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY, true)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)

        gl.enable(gl.BLEND)
        programRGBA.setColor([1, 0.8, 0.7, 1])
        const WORD_LENGTH = 2
        let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        view.renderList.base.bind(programRGBA)
        view.renderList.base.drawSubset(gl.TRIANGLES, offset, length)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        const alpha = 0.5

        programRGBA.setColor([0.0, 0.5, 1, alpha])
        // this.renderMeshBS.bind(programRGBA)
        // gl.drawElements(gl.TRIANGLES, 100, gl.UNSIGNED_SHORT, 0)

        this.renderMeshBS.draw(programRGBA, gl.TRIANGLES)

        // programRGBA.setColor([1, 0.8, 0.7, alpha])
        // const WORD_LENGTH = 2
        // let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        // let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        // view.renderList.base.bind(programRGBA)
        // view.renderList.base.drawSubset(gl.TRIANGLES, offset, length)
    }

    prepare(ev: Event) {
        const skeleton = this.app.humanMesh.skeleton
        const headBones = new Set<string>()

        function r(b: Bone) {
            if (!b.name.startsWith("special")) {
                // console.log(b.name)
                headBones.add(b.name)
            }
            b.children.forEach((child) => {
                r(child)
            })
        }
        r(skeleton.getBone("head"))

        const obj = ev.target as HTMLObjectElement
        const content = obj.contentDocument!
        // console.log(content)
        headBones.forEach((bone) => {
            const eye = content.getElementById(bone) as any
            if (eye != null) {
                const g = eye as SVGGElement
                const e = g.children[0] as SVGEllipseElement
                e.onpointerenter = () => (e.style.fill = "#f00")
                e.onpointerleave = () => (e.style.fill = "")
            }
        })
    }
}

class Condition extends BooleanModel {
    condition: () => boolean
    constructor(condition: () => boolean, dependencies: Model<any, any>[]) {
        super(condition())
        this.condition = condition
        this.evaluate = this.evaluate.bind(this)
        for (const model of dependencies) {
            model.modified.add(this.evaluate)
        }
    }
    evaluate() {
        this.value = this.condition()
    }
}

interface IfPropsTrue extends HTMLElementProps {
    isTrue: BooleanModel
}
interface IfPropsFalse extends HTMLElementProps {
    isFalse: BooleanModel
}
interface IfPropsEqual<T> extends HTMLElementProps {
    model: ValueModel<T>
    isEqual: T
}

export class If<T> extends ModelView<ValueModel<T>> {
    value: T
    constructor(props: IfPropsTrue | IfPropsFalse | IfPropsEqual<T>) {
        const newProps = props as ModelViewProps<BooleanModel>
        let value: any
        if ("isTrue" in props) {
            value = true
            newProps.model = props.isTrue
        }
        if ("isFalse" in props) {
            value = false
            newProps.model = props.isFalse
        }
        if ("isEqual" in props) {
            value = props.isEqual
        }
        super(props)
        this.value = value
    }

    override updateView() {
        if (this.model) {
            this.show(this.model.value === this.value)
        }
    }
    private show(show: boolean) {
        this.style.display = show ? "" : "none"
    }
}
If.define("tx-enhanced-if", If)

export function BlendShapeTab(props: { app: Application }) {
    const editor = BlendShapeEditor.getInstance(props.app)

    const morphToMatchNeutral = new Condition(() => {
        return editor.blendshape.value == blendshapeNames[0]
    }, [editor.blendshape])

    const sm = new SelectionModel(TableEditMode.EDIT_CELL)

    return (
        <Tab label="Blend" value={TAB.MORPH2} visibilityChange={setRenderer(props.app, editor)}>
            Face Blendshape Editor (under construction)
            <Form>
                <FormText model={editor.scale} />
                <FormText model={editor.dy} />
                <FormText model={editor.dz} />
                <FormSelect model={editor.blendshape} />
            </Form>
            <If isTrue={morphToMatchNeutral}>
            {/* <If model={morphToMatchNeutral} isEqual={true}> */}
                <p>morph face to match neutral blendshape</p>
                <Table model={props.app.morphControls} style={{ width: "100%", height: "100%" }} />
            </If>
            <If isFalse={morphToMatchNeutral}>
                <p>pose face to match blendshape</p>

                <object
                    id="face"
                    type="image/svg+xml"
                    width="250px"
                    data="static/mhjs-face.svg"
                    onload={(ev) => editor.prepare(ev)}
                />
            </If>
            {/* <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} /> */}
            {/* <Table
                selectionModel={sm}
                model={props.app.expressionManager.model}
                style={{ width: "487px", height: "100%" }}
            /> */}
        </Tab>
    )
}
