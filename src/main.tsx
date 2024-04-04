/*

TODO: IT'S TIME TO CLEAR UP THIS MESS
[ ] instead of passing indiviual models around, group them into a class and pass that around
    it will be basically like a bunch of global variables. but at the moment i'm not sure
    how all the parts of the app will relate to each other
[ ] render, UpdateManager, ...
    * have something like setRenderer(...) which is called when a tab is activated
    * Tab has visibilityChange(state: "visible" | "hidden") property
    * it will need the canvas and the overlay
    * name... RenderView?, GLView? => WE NOW HAVE 'GlView'
[ ] get rid of the ui/ directory and instead clean up the root directory to match the UI structure
    application/
      file/
      morph/
      proxy/
      pose/
      expression/
      mediapipe/
      chordata/
      glview/
    makehuman/ ;; all the code from makehuman
    main.tsx   ;; an no other files to make it prominent!
*/

import { Human } from "./modifier/Human"
import { loadModifiers } from "./modifier/loadModifiers"
import { loadSliders, SliderNode } from "./modifier/loadSliders"

import { loadSkeleton } from "./skeleton/loadSkeleton"

import { WavefrontObj } from "mesh/WavefrontObj"
import { HumanMesh } from "./mesh/HumanMesh"

import { PoseNode } from "expression/PoseNode"
import { PoseUnitsModel } from "expression/PoseUnitsModel"
import { ExpressionManager } from "expression/ExpressionManager"
import { PoseModel } from "pose/PoseModel"

import { ProxyType } from "proxy/Proxy"
import { ProxyManager } from "./ProxyManager"

import ExpressionTab from "ui/expression"
import FileTab from "ui/file"
import chordataTab from "chordata/chordata"
import { PoseTreeAdapter } from "ui/poseView"
import { SliderTreeAdapter } from "ui/morphView"
import { PoseUnitsAdapter } from "ui/PoseUnitsAdapter"
import { TAB, initHistoryManager } from "HistoryManager"
import { UpdateManager } from "UpdateManager"

import { RenderMode } from "./render/RenderMode"
import { render } from "./render/render"
import { renderFace } from "render/renderFace"

import { FileSystemAdapter } from "./filesystem/FileSystemAdapter"
import { HTTPFSAdapter } from "./filesystem/HTTPFSAdapter"

import { Table } from "toad.js/table/Table"
import { TreeNodeModel } from "toad.js/table/model/TreeNodeModel"
import { TreeAdapter } from "toad.js/table/adapter/TreeAdapter"
import { EnumModel } from "toad.js/model/EnumModel"
import { Tab, Tabs } from "toad.js/view/Tab"
import { Form, FormLabel, FormField, FormHelp } from "toad.js/view/Form"
import { HTMLElementProps, ref, Select, TableAdapter } from "toad.js"
import { StringArrayAdapter } from "toad.js/table/adapter/StringArrayAdapter"
import { StringArrayModel } from "toad.js/table/model/StringArrayModel"
import { ModelReason } from "toad.js/model/Model"
import { ChordataSettings } from "chordata/ChordataSettings"
import { MediapipeTab } from "mediapipe/mediapipe"
import { Skeleton } from "skeleton/Skeleton"

export function main() {
    try {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
        run()
    } catch (e) {
        console.log(e)
        if (e instanceof Error) {
            alert(`${e.name}: ${e.message}`)
        } else {
            alert(e)
        }
    }
}

class Application {
    // makehuman
    human: Human // MorphManager / MorphController
    scene: HumanMesh // base mesh, morphed mesh, posed mesh
    skeleton: Skeleton

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
    references: any
    // references: {
    //         canvas!: HTMLCanvasElement
    //         overlay!: HTMLElement
    //     }

    constructor() {
        console.log("loading assets...")
        this.human = new Human()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        this.scene = new HumanMesh(this.human, obj)
        this.human.scene = this.scene
        this.skeleton = loadSkeleton(this.scene, "data/rigs/default.mhskel")
        this.scene.skeleton = this.skeleton
        loadModifiers(this.human, "data/modifiers/modeling_modifiers.json")
        loadModifiers(this.human, "data/modifiers/measurement_modifiers.json")

        // setup application
        this.sliderNodes = loadSliders(this.human, "data/modifiers/modeling_sliders.json")

        console.log("everything is loaded...")

        this.proxyManager = new ProxyManager(this.scene)
        this.renderMode = new EnumModel(RenderMode.POLYGON, RenderMode)
        this.morphControls = new TreeNodeModel(SliderNode, this.sliderNodes)
        this.poseControls = new TreeNodeModel(PoseNode, this.skeleton.poseNodes)
        this.expressionManager = new ExpressionManager(this.skeleton)
        this.poseModel = new PoseModel(this.scene.skeleton)
        this.updateManager = new UpdateManager(this.expressionManager, this.poseModel, this.sliderNodes)
        this.chordataSettings = new ChordataSettings()

        // some modifiers already have non-null values, hence we mark all modifiers as dirty
        this.human.modifiers.forEach((modifer) => {
            modifer.getModel().modified.trigger(ModelReason.VALUE)
        })

        this.references = {} as any

        // FIXME: OOP SMELL => replace ENUM with OBJECT
        this.tabModel = new EnumModel(TAB.PROXY, TAB)
        this.tabModel.modified.add(() => {
            if (this.references.overlay) {
                this.references.overlay.replaceChildren()
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
}

// core/mhmain.py
//   class MHApplication
//     startupSequence()
function run() {
    const application = new Application()

    TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)
    TreeAdapter.register(PoseTreeAdapter, TreeNodeModel, PoseNode)

    TableAdapter.register(StringArrayAdapter, StringArrayModel)
    TableAdapter.register(PoseUnitsAdapter, PoseUnitsModel as any) // FIXME: WTF???

    document.body.replaceChildren(
        ...(
            <>
                <Tabs
                    model={application.tabModel}
                    style={{ position: "absolute", left: 0, width: "500px", top: 0, bottom: 0 }}
                >
                    <FileTab scene={application.scene} />
                    <Tab label="Morph" value={TAB.MORPH}>
                        <Table model={application.morphControls} style={{ width: "100%", height: "100%" }} />
                    </Tab>
                    <Tab label="Proxy" value={TAB.PROXY}>
                        <Form variant="narrow">
                            {application.proxyManager.allProxyTypes.map((pid) => (
                                <>
                                    <FormLabel>{ProxyType[pid]}</FormLabel>
                                    <FormField>
                                        <Select id={ProxyType[pid]} model={application.proxyManager.list.get(pid)} />
                                    </FormField>
                                    <FormHelp model={application.proxyManager.list.get(pid) as any} />
                                </>
                            ))}
                        </Form>
                    </Tab>
                    <Tab label="Pose" value={TAB.POSE}>
                        <Table model={application.poseControls} style={{ width: "100%", height: "100%" }} />
                    </Tab>
                    {/* {poseTab(scene, poseModel)} */}
                    {/* 
                        this one costs too much time when using motion capture
                        <ExpressionTab scene={scene} expressionManager={expressionManager} />
                    */}
                    <MediapipeTab
                        updateManager={application.updateManager}
                        expressionModel={application.expressionManager.model}
                    />
                    {chordataTab(application.scene, application.updateManager, application.chordataSettings)}
                </Tabs>
                <GLView
                    references={application.references}
                    style={{ position: "absolute", left: "500px", right: 0, top: 0, bottom: 0, overflow: "hidden" }}
                />
            </>
        )
    )
    render(
        application.references.canvas,
        application.references.overlay,
        application.scene,
        application.renderMode,
        application.updateManager,
        application.chordataSettings
    )
}

interface GLViewProps extends HTMLElementProps {
    references: {
        canvas: HTMLCanvasElement
        overlay: HTMLElement
    }
}

function GLView(props: GLViewProps) {
    return (
        <div style={props.style}>
            <canvas set={ref(props.references, "canvas")} style={{ width: "100%", height: "100%" }} />
            <div
                set={ref(props.references, "overlay")}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            ></div>
        </div>
    )
}

main()
