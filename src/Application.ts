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
import { RenderHandler } from 'render/RenderHandler'
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
import { TextModel } from "toad.js"
import { GLView } from "gl/GLView"
import { RenderView } from "render/RenderView"
import { mat4 } from "gl-matrix"
import { di } from "lib/di"
import { FaceARKitLoader } from "mediapipe/FaceARKitLoader"

// the Tab.visibilityChange callback is a bit too boilerplaty to handle,
// this smoothes my crappy API design for now
export function setRenderer(app: Application, renderer: RenderHandler, classic: boolean = true) {
    return (state: "visible" | "hidden") => {
        console.log(`setRenderer(state=${state}, renderer='${renderer.constructor.name})`)
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

    status = new TextModel("")

    // makehuman
    morphManager: MorphManager // MorphManager / MorphController
    humanMesh: HumanMesh // base mesh, morphed mesh, posed mesh
    skeleton: Skeleton

    glview!: RenderView
    /** classic MakeHuman: convert pose unit to matPose after blending all pose units */
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
        this.bodyCamera = this.bodyCamera.bind(this)
        this.headCamera = this.headCamera.bind(this)

        di.single(Application, () => this)
        di.single(FaceARKitLoader, () => new FaceARKitLoader())
        // TODO: replace most properties with di instances, one after another

        console.log("loading assets...")
        this.morphManager = new MorphManager()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        this.humanMesh = new HumanMesh(this.morphManager, obj)
        this.morphManager.humanMesh = this.humanMesh
        this.skeleton = loadSkeleton(this.humanMesh, "data/rigs/default.mhskel")
        this.humanMesh.skeleton = this.skeleton
        loadModifiers(this.morphManager, "data/modifiers/modeling_modifiers.json")
        loadModifiers(this.morphManager, "data/modifiers/measurement_modifiers.json")

        // setup application
        // morph controls
        this.sliderNodes = loadSliders(this.morphManager, "data/modifiers/modeling_sliders.json")
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
        di.single(UpdateManager, () => this.updateManager)

        // some modifiers already have non-null values, hence we mark all modifiers as dirty
        this.morphManager.modifiers.forEach((modifer) => {
            modifer.getModel().signal.emit({ type: VALUE })
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

    /**
     * 
     * @param renderer 
     * @param classic classic MakeHuman: convert pose unit to matPose after blending all pose units
     */
    setRenderer(renderer: RenderHandler, classic: boolean = true) {
        this.renderer = renderer
        this.classic = classic
        if (this.glview) {
            this.glview.draw = () => renderer.paint(this, this.glview)
            const defaultCamera = renderer.defaultCamera()
            if (this.glview.ctx.defaultCamera !== defaultCamera) {
                this.glview.ctx.defaultCamera = defaultCamera
                this.glview.ctx.camera = defaultCamera()
            }
        }
    }

    headCamera(): mat4 {
        const camera = mat4.create()
        mat4.translate(camera, camera, [0, -7, -5])
        return camera
    }
    bodyCamera(): mat4 {
        const camera = mat4.create()
        mat4.translate(camera, camera, [0, 0, -25])
        return camera
    }

}
