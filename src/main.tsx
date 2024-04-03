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

main()

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

// core/mhmain.py
//   class MHApplication
//     startupSequence()
function run() {
    console.log("loading assets...")
    const human = new Human()
    const obj = new WavefrontObj("data/3dobjs/base.obj")
    const scene = new HumanMesh(human, obj)
    human.scene = scene

    const proxyManager = new ProxyManager(scene)

    const skeleton = loadSkeleton(scene, "data/rigs/default.mhskel")
    scene.skeleton = skeleton

    // humanmodifier.loadModifiers(getpath.getSysDataPath('modifiers/modeling_modifiers.json'), app.selectedHuman)
    loadModifiers(human, "data/modifiers/modeling_modifiers.json")
    loadModifiers(human, "data/modifiers/measurement_modifiers.json")

    // guimodifier.loadModifierTaskViews(getpath.getSysDataPath('modifiers/modeling_sliders.json'), app.selectedHuman, category)
    const sliderNodes = loadSliders(human, "data/modifiers/modeling_sliders.json")

    console.log("everything is loaded...")

    TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)
    TreeAdapter.register(PoseTreeAdapter, TreeNodeModel, PoseNode)

    TableAdapter.register(StringArrayAdapter, StringArrayModel)
    TableAdapter.register(PoseUnitsAdapter, PoseUnitsModel as any) // FIXME: WTF???

    const renderMode = new EnumModel(RenderMode.POLYGON, RenderMode)
    const morphControls = new TreeNodeModel(SliderNode, sliderNodes)
    const poseControls = new TreeNodeModel(PoseNode, skeleton.poseNodes)

    const expressionManager = new ExpressionManager(skeleton)
    const poseModel = new PoseModel(scene.skeleton)
    const updateManager = new UpdateManager(expressionManager, poseModel, sliderNodes)
    const chordataSettings = new ChordataSettings()

    // some modifiers already have non-null values, hence we mark all modifiers as dirty
    human.modifiers.forEach((modifer) => {
        modifer.getModel().modified.trigger(ModelReason.VALUE)
    })

    const references = new (class {
        canvas!: HTMLCanvasElement
        overlay!: HTMLElement
    })()

    // FIXME: OOP SMELL => replace ENUM with OBJECT
    const tabModel = new EnumModel(TAB.PROXY, TAB)
    tabModel.modified.add(() => {
        if (references.overlay) {
            references.overlay.replaceChildren()
        }
        switch (tabModel.value) {
            case TAB.PROXY:
            case TAB.MORPH:
            case TAB.MEDIAPIPE:
                renderMode.value = RenderMode.MEDIAPIPE
                break
            case TAB.POSE:
            case TAB.EXPORT:
                renderMode.value = RenderMode.WIREFRAME
                break
            case TAB.POSE2:
                renderMode.value = RenderMode.POSE
                break
            case TAB.EXPRESSION:
                renderMode.value = RenderMode.EXPRESSION
                break
            case TAB.CHORDATA:
                renderMode.value = RenderMode.CHORDATA
                break
        }
        updateManager.invalidateView()
    })
    initHistoryManager(tabModel)

    document.body.replaceChildren(
        ...(
            <>
                <Tabs model={tabModel} style={{ position: "absolute", left: 0, width: "500px", top: 0, bottom: 0 }}>
                    <FileTab scene={scene} />
                    <Tab label="Morph" value={TAB.MORPH}>
                        <Table model={morphControls} style={{ width: "100%", height: "100%" }} />
                    </Tab>
                    <Tab label="Proxy" value={TAB.PROXY}>
                        <Form variant="narrow">
                            {proxyManager.allProxyTypes.map((pid) => (
                                <>
                                    <FormLabel>{ProxyType[pid]}</FormLabel>
                                    <FormField>
                                        <Select id={ProxyType[pid]} model={proxyManager.list.get(pid)} />
                                    </FormField>
                                    <FormHelp model={proxyManager.list.get(pid) as any} />
                                </>
                            ))}
                        </Form>
                    </Tab>
                    <Tab label="Pose" value={TAB.POSE}>
                        <Table model={poseControls} style={{ width: "100%", height: "100%" }} />
                    </Tab>
                    {/* {poseTab(scene, poseModel)} */}
                    {/* 
                        this one costs too much time when using motion capture
                        <ExpressionTab scene={scene} expressionManager={expressionManager} />
                    */}
                    <MediapipeTab updateManager={updateManager} expressionModel={expressionManager.model} />
                    {chordataTab(scene, updateManager, chordataSettings)}
                </Tabs>
                <GLView
                    references={references}
                    style={{ position: "absolute", left: "500px", right: 0, top: 0, bottom: 0, overflow: "hidden" }}
                />
            </>
        )
    )
    render(references.canvas, references.overlay, scene, renderMode, updateManager, chordataSettings)
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
