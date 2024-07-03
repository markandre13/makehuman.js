import { Application } from "Application"
import { WavefrontObj } from "mesh/WavefrontObj"
import { GLView, Projection, RenderHandler } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { BaseMeshGroup } from "mesh/BaseMeshGroup"
import { NumberModel, OptionModel, TableEvent, TableEventType, TextModel } from "toad.js"
import { Bone } from "skeleton/Bone"
import { blendshapeNames } from "mediapipe/blendshapeNames"
import { FaceARKitLoader } from "mediapipe/FaceARKitLoader"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { PoseUnitWeights as PoseUnitWeightsModel } from "./PoseUnitWeights"
import { MHFacePoseUnits } from "blendshapes/MHFacePoseUnits"
import { isZero } from "mesh/HumanMesh"
import { ModelReason } from "toad.js/model/Model"

export class BlendShapeEditor extends RenderHandler {
    private static _instance: BlendShapeEditor | undefined
    static getInstance(app: Application) {
        if (BlendShapeEditor._instance === undefined) {
            BlendShapeEditor._instance = new BlendShapeEditor(app)
        }
        return BlendShapeEditor._instance
    }

    app: Application
    xyz?: Float32Array
    initialized = false
    update = false

    // this model drives the animation while editing single blendshapes
    blendshapeModel = new BlendshapeModel()

    // this selects the blendshape to be edited
    blendshape = new OptionModel(blendshapeNames[0], blendshapeNames, {
        label: "Blendshape",
    })
    primaryWeight = new NumberModel(1, { min: 0, max: 1, step: 0.01, label: "primary weight" })
    secondayWeight = new NumberModel(0, { min: 0, max: 1, step: 0.01, label: "secondary weight" })

    // this selects the bone to be edited
    currentBone = new TextModel()

    // ictkit
    // scale = new NumberModel(0.1, {min: 0.08, max: 0.12,  step: 0.001, label: "scale"})
    // dy = new NumberModel(7.03, {min: 6.6, max: 7.4,  step: 0.001, label: "dy"})
    // dz = new NumberModel(0.392, {min: 0.08, max: 0.82,  step: 0.001, label: "dz"})
    // arkit
    scale = new NumberModel(9.5, { min: 9, max: 11, step: 0.1, label: "scale" })
    dy = new NumberModel(7.12, { min: 0, max: 7.4, step: 0.01, label: "dy" })
    dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

    blendshapeSet: FaceARKitLoader

    poseUnitWeightsModel: PoseUnitWeightsModel

    neutral: WavefrontObj
    renderMeshBS?: RenderMesh
    renderMeshMH?: RenderMesh
    constructor(app: Application) {
        super()
        this.app = app
        this.blendshapeSet = FaceARKitLoader.getInstance()
        this.neutral = this.blendshapeSet.getNeutral()

        const facePoseUnits = new MHFacePoseUnits(app.skeleton)
        this.poseUnitWeightsModel = new PoseUnitWeightsModel(facePoseUnits)

        let dontCopyFlag = false // FIXME: this needs a solution in toad.js

        this.blendshape.modified.add(() => {
            console.log(`BlendShapeEditor.blendshape.value became ${this.blendshape.value}`)
            switch (this.blendshape.value) {
                case "_neutral":
                    this.app.updateManager.setBlendshapeModel(this.app.frontend.blendshapeModel)
                    break
                default:
                    this.primaryWeight.value = 1
                    this.secondayWeight.value = 0
                    this.app.updateManager.setBlendshapeModel(this.blendshapeModel)
                    this.blendshapeModel.setBlendshapeNames(blendshapeNames)
                    this.blendshapeModel.reset()
                    this.blendshapeModel.setBlendshapeWeight(this.blendshape.value, this.primaryWeight.value)
                    const cfg = app.blendshapeToPoseConfig.get(this.blendshape.value)
                    // copy pose unit weights from config to ui model
                    // this.poseUnitWeightsModel.modified.withLock(() => {
                        dontCopyFlag = true
                        this.poseUnitWeightsModel.reset()
                        cfg?.poseUnitWeight.forEach((weight, name) => {
                            console.log(`to ui  : ${this.blendshape.value}: ${name} = ${weight}`)
                            this.poseUnitWeightsModel.getWeight(name).value = weight
                        })
                        dontCopyFlag = false
                    // })
                    // this.poseUnitWeightsModel.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, 1, 22))
            }
            this.update = true
            this.app.updateManager.invalidateView()
        })
        // copy pose unit weights from ui model to config
        this.poseUnitWeightsModel.modified.add((ev) => {
            console.log(`!!!!! copy pose unit weights from ui model to config of ${this.blendshape.value}`)
            console.log(ev)
            if (dontCopyFlag) {
                return
            }
            // FIXME: move into blendshapeToPoseConfig
            const pose = app.blendshapeToPoseConfig.get(this.blendshape.value)!
            pose.poseUnitWeight.clear()
            this.poseUnitWeightsModel.forEach((v) => {
                if (!isZero(v.weight.value)) {
                    console.log(`from ui: ${this.blendshape.value}: ${v.name} = ${v.weight.value}`)
                    pose.poseUnitWeight.set(v.name, v.weight.value)
                }
            })
            // FIXME: this next call erases part of the configuration
            // but it is not the cause. blendshapeToPoseConfig is messed up when it fails
            app.blendshapeToPoseConfig.modified.trigger()
        })
        this.primaryWeight.modified.add(() => {
            this.blendshapeModel.setBlendshapeWeight(this.blendshape.value, this.primaryWeight.value)
            this.update = true
            this.app.updateManager.invalidateView()
        })
        this.currentBone.modified.add(() => app.updateManager.invalidateView())
    }

    override paint(app: Application, view: GLView): void {
        // console.log(`paint with scale ${this.scale.value}`)
        if (!this.initialized) {
            this.scale.modified.add(() => {
                // console.log(`scale changed to ${this.scale.value}`)
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
            this.update = true
        }
        if (this.update) {
            this.xyz = new Float32Array(this.neutral.xyz)
            this.blendshapeSet.getTarget(this.blendshape.value)?.apply(this.xyz, 1)
            for (let i = 0; i < this.neutral.xyz.length; ++i) {
                this.xyz[i] = this.xyz[i] * this.scale.value
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
            this.renderMeshBS = new RenderMesh(gl, this.xyz!!, this.neutral.fxyz, undefined, undefined, false)

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

        programRGBA.setColor([0, 0.5, 1, alpha])
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

        function collectHeadBoneNames(b: Bone) {
            if (!b.name.startsWith("special")) {
                headBones.add(b.name)
            }
            b.children.forEach((child) => {
                collectHeadBoneNames(child)
            })
        }
        collectHeadBoneNames(skeleton.getBone("head"))

        const obj = ev.target as HTMLObjectElement
        const content = obj.contentDocument!
        // console.log(content)
        headBones.forEach((boneName) => {
            const element = content.getElementById(boneName) as any
            if (element != null) {
                const g = element as SVGGElement
                const e = g.children[0] as SVGEllipseElement
                const title = document.createElementNS("http://www.w3.org/2000/svg", "title")
                title.appendChild(document.createTextNode(boneName))
                e.appendChild(title)
                e.onpointerenter = () => (e.style.fill = "#fff")
                e.onpointerleave = () => {
                    if (boneName !== this.currentBone.value) {
                        e.style.fill = ""
                    }
                }
                e.onpointerdown = () => {
                    if (this.currentBone.value.length !== 0) {
                        const currentElement = content.getElementById(this.currentBone.value) as any
                        currentElement.children[0].style.fill = ""
                    }
                    e.style.fill = "#fff"
                    this.currentBone.value = boneName
                }
            }
        })
    }
}
