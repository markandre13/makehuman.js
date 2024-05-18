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
import { NumberModel, SelectionModel, Table, TableEditMode, TableEvent } from "toad.js"
import { Form } from "toad.js/view/Form"
import { FormText } from "toad.js/view/FormText"

class BlendShapeEditor extends RenderHandler {
    static instance: BlendShapeEditor | undefined
    static getInstance() {
        if (BlendShapeEditor.instance === undefined) {
            BlendShapeEditor.instance = new BlendShapeEditor()
        }
        return BlendShapeEditor.instance
    }

    xyz?: Float32Array
    initialized = false
    update = false
    scale = new NumberModel(0.1, {min: 0.08, max: 0.12,  step: 0.001, label: "scale"})
    dy = new NumberModel(7.03, {min: 6.6, max: 7.4,  step: 0.001, label: "dy"})
    dz = new NumberModel(0.392, {min: 0.08, max: 0.82,  step: 0.001, label: "dz"})

    neutral: WavefrontObj
    renderMeshICT?: RenderMesh
    renderMeshMH?: RenderMesh
    constructor() {
        super()
        this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
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
            this.scale.modified.add( () => {
                console.log(`scale changed to ${this.scale.value}`)
                this.update = true
                app.updateManager.invalidateView()
            })
            this.dy.modified.add( () => {
                this.update = true
                app.updateManager.invalidateView()
            })
            this.dz.modified.add( () => {
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
            this.update = false;
            if (this.renderMeshICT !== undefined) {
                this.renderMeshICT.update(this.xyz)
            }
        }

        if (this.renderMeshICT === undefined) {
            this.renderMeshICT = new RenderMesh(gl, this.xyz, this.neutral.fxyz, undefined, undefined, true)
            this.renderMeshMH = new RenderMesh(
                gl,
                app.humanMesh.baseMesh.xyz,
                app.humanMesh.baseMesh.fxyz,
                undefined,
                undefined,
                true
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
        this.renderMeshICT.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, 11144 * 6, gl.UNSIGNED_SHORT, 0)

        // programRGBA.setColor([1, 0.8, 0.7, alpha])
        // const WORD_LENGTH = 2
        // let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        // let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        // view.renderList.base.bind(programRGBA)
        // view.renderList.base.drawSubset(gl.TRIANGLES, offset, length)
    }
}

export function BlendShapeTab(props: { app: Application }) {
    const editor = BlendShapeEditor.getInstance()
    const sm = new SelectionModel(TableEditMode.EDIT_CELL)

    return (
        <Tab label="Blend" value={TAB.MORPH2} visibilityChange={setRenderer(props.app, editor)}>
            This is an experimental face morph editor to create blend shapes based on the ICT FaceKit.
            <Form>
                <FormText model={editor.scale}/>
                <FormText model={editor.dy}/>
                <FormText model={editor.dz}/>
            </Form>
            <Table model={props.app.morphControls} style={{ width: "100%", height: "100%" }} />
            {/* <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} /> */}
            {/* <Table
                selectionModel={sm}
                model={props.app.expressionManager.model}
                style={{ width: "487px", height: "100%" }}
            /> */}
        </Tab>
    )
}
