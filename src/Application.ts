import { MorphManager } from "./modifier/MorphManager"
import { loadModifiers } from "./modifier/loadModifiers"
import { loadSliders, SliderNode } from "./modifier/loadSliders"
import { loadSkeleton } from "./skeleton/loadSkeleton"
import { WavefrontObj } from "mesh/WavefrontObj"
import { HumanMesh } from "./mesh/HumanMesh"
import { PoseNode } from "expression/PoseNode"
// import { PoseModel } from "pose/PoseModel"
import { ProxyManager } from "./ProxyManager"
import { TAB, initHistoryManager } from "HistoryManager"
import { UpdateManager } from "UpdateManager"
import { RenderMode } from "./render/RenderMode"
import { TreeNodeModel } from "toad.js/table/model/TreeNodeModel"
import { EnumModel } from "toad.js/model/EnumModel"
import { ChordataSettings } from "chordata/ChordataSettings"
import { Skeleton } from "skeleton/Skeleton"
import { GLView, RenderHandler } from "render/GLView"
import { ORB } from "corba.js"
import { Backend, MediaPipeTask, Recorder, VideoCamera } from "net/makehuman_stub"
import { FileSystem } from "net/fs_stub"
import { WsProtocol } from "corba.js/net/browser"
import { Frontend_impl } from "net/Frontend_impl"
import { Blendshape2PoseConverter } from "blendshapes/Blendshape2PoseConverter"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { BlendshapeToPose } from "blendshapes/BlendshapeToPose"
import { MHFacePoseUnits } from "blendshapes/MHFacePoseUnits"
import { makeDefaultBlendshapeToPoseConfig } from "blendshapes/defaultBlendshapeToPoseConfig"
import { BlendshapeToPoseConfig } from "blendshapes/BlendshapeToPoseConfig"
import { VALUE } from "toad.js/model/ValueModel"
import { Connector } from "net/Connector"

// the Tab.visibilityChange callback is a bit too boilerplaty to handle,
// smooth my crappy API design for now
export function setRenderer(app: Application, renderer: RenderHandler, classic: boolean = true) {
    return (state: "visible" | "hidden") => {
        // console.log(`setRenderer(state=${state}, renderer='${renderer.constructor.name})`)
        if (state === "visible") {
            app.setRenderer(renderer, classic)
        }
    }
}

export class Application {
    orb: ORB
    frontend: Frontend_impl
    connector: Connector
    blendshapeModel: BlendshapeModel
    blendshapeConverter: Blendshape2PoseConverter
    blendshapeToPoseConfig: BlendshapeToPoseConfig
    makehumanFacePoseUnits: MHFacePoseUnits
    blendshape2pose: BlendshapeToPose

    // makehuman
    human: MorphManager // MorphManager / MorphController
    humanMesh: HumanMesh // base mesh, morphed mesh, posed mesh
    skeleton: Skeleton

    glview!: GLView
    classic = true

    // application
    sliderNodes: SliderNode
    proxyManager: ProxyManager
    renderMode: EnumModel<RenderMode>
    morphControls: TreeNodeModel<SliderNode>
    poseControls: TreeNodeModel<PoseNode>
    // expressionManager: ExpressionManager
    // poseModel: PoseModel
    updateManager: UpdateManager
    chordataSettings: ChordataSettings
    tabModel: EnumModel<TAB>
    renderView: {
        canvas: HTMLCanvasElement
        overlay: HTMLElement
    }

    constructor() {
        console.log("loading assets...")
        this.human = new MorphManager()
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
        // this.expressionManager = new ExpressionManager(this.skeleton)

        this.chordataSettings = new ChordataSettings()
        this.renderMode = new EnumModel(RenderMode.POLYGON, RenderMode)

        //
        // blendshapes
        //

        // load makehumans original face pose units
        this.makehumanFacePoseUnits = new MHFacePoseUnits(this.skeleton)

        // our own face poses on top of on makehuman's face pose units
        this.blendshapeToPoseConfig = makeDefaultBlendshapeToPoseConfig(this.skeleton)

        // blendshapeToPoseConfig + makehumanFacePoseUnits => blendshape2pose
        this.blendshape2pose = new BlendshapeToPose()
        this.blendshapeToPoseConfig.convert(this.makehumanFacePoseUnits, this.blendshape2pose)

        // blendshape weights from backend (e.g. mediapipe, live link)
        this.blendshapeModel = new BlendshapeModel()

        this.blendshapeConverter = new Blendshape2PoseConverter(this)

        // needs skeleton, blendshapeModel, blendshapeConverter, 
        this.updateManager = new UpdateManager(this)

        // some modifiers already have non-null values, hence we mark all modifiers as dirty
        this.human.modifiers.forEach((modifer) => {
            modifer.getModel().signal.emit({type: VALUE})
        })

        this.renderView = {} as any

        // FIXME: OOP SMELL => replace ENUM with OBJECT
        this.tabModel = new EnumModel(TAB.PROXY, TAB)
        this.tabModel.signal.add(() => {
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

        this.orb = new ORB()
        this.orb.registerStubClass(Backend)
        this.orb.registerStubClass(FileSystem)
        this.orb.registerStubClass(VideoCamera)
        this.orb.registerStubClass(MediaPipeTask)
        this.orb.registerStubClass(Recorder)
        this.orb.addProtocol(new WsProtocol())
        this.frontend = new Frontend_impl(this.orb, this.updateManager, this.blendshapeModel)

        this.connector = new Connector(this.frontend)
        this.connector.connectToBackend()
    }

    renderer?: RenderHandler

    setRenderer(renderer: RenderHandler, classic: boolean = true) {
        this.renderer = renderer
        this.classic = classic
    }
}
