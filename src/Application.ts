import { Human } from "./modifier/Human"
import { loadModifiers } from "./modifier/loadModifiers"
import { loadSliders, SliderNode } from "./modifier/loadSliders"
import { loadSkeleton } from "./skeleton/loadSkeleton"
import { WavefrontObj } from "mesh/WavefrontObj"
import { HumanMesh } from "./mesh/HumanMesh"
import { PoseNode } from "expression/PoseNode"
import { ExpressionManager } from "expression/ExpressionManager"
import { PoseModel } from "pose/PoseModel"
import { ProxyManager } from "./ProxyManager"
import { TAB, initHistoryManager } from "HistoryManager"
import { UpdateManager } from "UpdateManager"
import { RenderMode } from "./render/RenderMode"
import { TreeNodeModel } from "toad.js/table/model/TreeNodeModel"
import { EnumModel } from "toad.js/model/EnumModel"
import { ModelReason } from "toad.js/model/Model"
import { ChordataSettings } from "chordata/ChordataSettings"
import { Skeleton } from "skeleton/Skeleton"
import { GLView, RenderHandler } from "GLView"

// the Tab.visibilityChange callback is a bit too boilerplaty to handle,
// smooth my crappy API design for now
export function setRenderer(app: Application, renderer: RenderHandler) {
    return (state: "visible" | "hidden") => {
        if (state === "visible") app.setRenderer(renderer)
    }
}

export class Application {
    // makehuman
    human: Human // MorphManager / MorphController
    humanMesh: HumanMesh // base mesh, morphed mesh, posed mesh
    skeleton: Skeleton
   
    glview!: GLView

    // application
    sliderNodes: SliderNode
    proxyManager: ProxyManager
    renderMode: EnumModel<RenderMode>
    morphControls: TreeNodeModel<SliderNode>
    poseControls: TreeNodeModel<PoseNode>
    expressionManager: ExpressionManager
    poseModel: PoseModel
    updateManager: UpdateManager
    chordataSettings: ChordataSettings
    tabModel: EnumModel<TAB>
    renderView: {
        canvas: HTMLCanvasElement
        overlay: HTMLElement
    }

    constructor() {
        console.log("loading assets...")
        this.human = new Human()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        this.humanMesh = new HumanMesh(this.human, obj)
        this.human.humanMesh = this.humanMesh
        this.skeleton = loadSkeleton(this.humanMesh, "data/rigs/default.mhskel")
        this.humanMesh.skeleton = this.skeleton
        loadModifiers(this.human, "data/modifiers/modeling_modifiers.json")
        loadModifiers(this.human, "data/modifiers/measurement_modifiers.json")

        // setup application
        // morph controls
        this.sliderNodes = loadSliders(this.human, "data/modifiers/modeling_sliders.json")
        this.morphControls = new TreeNodeModel(SliderNode, this.sliderNodes)

        console.log("everything is loaded...")

        this.proxyManager = new ProxyManager(this.humanMesh)

        this.poseControls = new TreeNodeModel(PoseNode, this.skeleton.poseNodes)
        this.expressionManager = new ExpressionManager(this.skeleton)

        this.poseModel = new PoseModel(this.humanMesh.skeleton)
        this.chordataSettings = new ChordataSettings()

        this.renderMode = new EnumModel(RenderMode.POLYGON, RenderMode)
        this.updateManager = new UpdateManager(this.expressionManager, this.poseModel, this.sliderNodes)

        // some modifiers already have non-null values, hence we mark all modifiers as dirty
        this.human.modifiers.forEach((modifer) => {
            modifer.getModel().modified.trigger(ModelReason.VALUE)
        })

        this.renderView = {} as any

        // FIXME: OOP SMELL => replace ENUM with OBJECT
        this.tabModel = new EnumModel(TAB.PROXY, TAB)
        this.tabModel.modified.add(() => {
            if (this.renderView.overlay) {
                this.renderView.overlay.replaceChildren()
            }
            switch (this.tabModel.value) {
                case TAB.PROXY:
                case TAB.MORPH:
                case TAB.MEDIAPIPE:
                    this.renderMode.value = RenderMode.MEDIAPIPE
                    break
                case TAB.POSE:
                case TAB.EXPORT:
                    this.renderMode.value = RenderMode.WIREFRAME
                    break
                case TAB.POSE2:
                    this.renderMode.value = RenderMode.POSE
                    break
                case TAB.EXPRESSION:
                    this.renderMode.value = RenderMode.EXPRESSION
                    break
                case TAB.CHORDATA:
                    this.renderMode.value = RenderMode.CHORDATA
                    break
            }
            this.updateManager.invalidateView()
        })
        initHistoryManager(this.tabModel)
    }

    renderer?: RenderHandler

    setRenderer(renderer?: RenderHandler) {
        this.renderer = renderer
    }
}