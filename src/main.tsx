import { Human } from './modifier/Human'
import { TargetFactory } from './target/TargetFactory'
import { loadSkeleton } from './skeleton/loadSkeleton'
import { loadModifiers } from './modifier/loadModifiers'
import { loadSliders, SliderNode } from './modifier/loadSliders'
import { HumanMesh, Update } from './mesh/HumanMesh'
import { RenderMode } from './render/RenderMode'
import { exportCollada } from 'mesh/Collada'
import { loadProxy } from 'proxy/Proxy'

import { PoseNode, PoseTreeAdapter } from 'ui/poseView'
import { SliderTreeAdapter } from 'ui/morphView'
import { render } from './render/render'

import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from './filesystem/HTTPFSAdapter'

import { Table } from 'toad.js/table/Table'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from "toad.js/table/adapter/TreeAdapter"
import { EnumModel } from "toad.js/model/EnumModel"
import { Fragment, ref } from "toad.jsx"
import { Tab, Tabs } from 'toad.js/view/Tab'
import { Text } from "toad.js/view/Text"
import { Slider } from "toad.js/view/Slider"
import { BooleanModel, Button, Checkbox, Signal } from 'toad.js'

window.onload = () => { main() }

export function main() {
    try {
        run()
    }
    catch (e) {
        console.log(e)
        if (e instanceof Error)
            alert(`${e.name}: ${e.message}`)
        else
            alert(e)
    }
}

// core/mhmain.py
//   class MHApplication
//     startupSequence()
function run() {
    console.log('loading assets...')
    FileSystemAdapter.setInstance(new HTTPFSAdapter())

    const human = new Human()
    const scene = new HumanMesh(human)
    human.scene = scene

    // scene.proxies.set("Proxymeshes", loadProxy(human, "data/proxymeshes/proxy741/proxy741.proxy", "Proxymeshes"))
    // scene.proxies.set("Proxymeshes", loadProxy(human, "data/proxymeshes/female_generic/female_generic.proxy", "Proxymeshes"))
    // scene.proxies.set("Eyes", loadProxy(human, "data/eyes/high-poly/high-poly.mhclo", "Eyes"))
    scene.proxies.set("Teeth", loadProxy(human, "data/teeth/teeth_base/teeth_base.mhclo", "Teeth"))
    // scene.proxies.set("Tongue", loadProxy(human, "data/tongue/tongue01/tongue01.mhclo", "Tongue"))

    human.modified.add(() => scene.updateRequired = Update.MORPH)

    const skeleton = loadSkeleton(scene, 'data/rigs/default.mhskel')
    scene.skeleton = skeleton

    // humanmodifier.loadModifiers(getpath.getSysDataPath('modifiers/modeling_modifiers.json'), app.selectedHuman)
    loadModifiers(human, 'data/modifiers/modeling_modifiers.json')
    loadModifiers(human, 'data/modifiers/measurement_modifiers.json')

    // guimodifier.loadModifierTaskViews(getpath.getSysDataPath('modifiers/modeling_sliders.json'), app.selectedHuman, category)
    const sliderNodes = loadSliders(human, 'data/modifiers/modeling_sliders.json')

    loadMacroTargets()

    // TargetFactory.getInstance()
    // const vertexCopy = [scene.vertex]

    console.log('everything is loaded...')

    TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)
    TreeAdapter.register(PoseTreeAdapter, TreeNodeModel, PoseNode)

    const renderMode = new EnumModel<RenderMode>(RenderMode, RenderMode.POLYGON)

    const morphControls = new TreeNodeModel(SliderNode, sliderNodes)

    const poseChanged = new Signal<PoseNode>()
    poseChanged.add((poseNode) => {
        // console.log(`Bone ${poseNode.bone.name} changed to ${poseNode.x.value}, ${poseNode.y.value}, ${poseNode.z.value}`)
        if (scene.updateRequired === Update.NONE) {
            scene.updateRequired = Update.POSE
        }
    })
    const poseNodes = new PoseNode(skeleton.roots[0], poseChanged)
    const poseControls = new TreeNodeModel(PoseNode, poseNodes)

    const teethProxy = new BooleanModel(true)
    const toungeProxy = new BooleanModel(false)
    const eyesProxy = new BooleanModel(true)
    const skinProxy = new BooleanModel(true)

    teethProxy.modified.add(() => {
        console.log(`teeth proxy changed to ${teethProxy.value}`)
    })

    const jaw = poseNodes.find("jaw")!

    const download = makeDownloadAnchor()
    const refCanvas = new class { canvas!: HTMLCanvasElement }
    const mainScreen = <>
        <Tabs model={renderMode} style={{ position: 'absolute', left: 0, width: '500px', top: 0, bottom: 0 }}>
            {/* <Tab label="Debug" value="DEBUG">
                <p>
                jaw <Text model={jaw.x} style={{ width: '50px'}}/><Slider model={jaw.x} style={{ width: '200px' }}/>
                </p>
                <p>
                    <Button action={() => downloadBaseMesh(scene, download)}>Export morphed and rigged base mesh</Button>
                </p>
            </Tab> */}
            <Tab label="Morph" value="POLYGON">
                <Table model={morphControls} style={{ width: '100%', height: '100%' }} />
            </Tab>
            <Tab label="Pose" value="WIREFRAME">
                <Table model={poseControls} style={{ width: '100%', height: '100%' }} />
            </Tab>
            <Tab label="Export" value="WIREFRAME">
                <div style={{ padding: "10px" }}>
                    WiP: Only the base mesh is exported.<br />
                    Upcoming: Proxy meshes:
                    <table>
                        <tr>
                            <td><Checkbox model={teethProxy} /></td><td>Teeth</td>
                        </tr>
                        <tr>
                            <td><Checkbox model={toungeProxy} /></td><td>Tounge</td>
                        </tr>
                        <tr>
                            <td><Checkbox model={eyesProxy} /></td><td>Eyes</td>
                        </tr>
                        <tr>
                            <td><Checkbox model={skinProxy} /></td><td>Skin</td>
                        </tr>
                    </table>
                    <Button action={() => downloadCollada(scene, download)}>Export Collada</Button>
                </div>
            </Tab>
        </Tabs>
        <div style={{ position: 'absolute', left: '500px', right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
            <canvas set={ref(refCanvas, 'canvas')} style={{ width: '100%', height: '100%' }} />
        </div>
    </> as Fragment
    mainScreen.appendTo(document.body)
    render(refCanvas.canvas, scene, renderMode)
}

function makeDownloadAnchor() {
    const download = document.createElement("a")
    download.type = "text/plain"
    download.style.display = "hidden"
    download.download = "makehuman.dae"
    return download
}

function downloadCollada(scene: HumanMesh, download: HTMLAnchorElement) {
    download.download = "makehuman.dae"
    download.href = URL.createObjectURL(new Blob([exportCollada(scene)], { type: 'text/plain' }))
    download.dispatchEvent(new MouseEvent("click"))
}

function downloadBaseMesh(scene: HumanMesh, download: HTMLAnchorElement) {
    download.download = "vertex.json"
    download.href = URL.createObjectURL(new Blob([JSON.stringify(scene.vertexRigged)], { type: 'text/plain' }))
    download.dispatchEvent(new MouseEvent("click"))
}

//
// more makehuman stuff i need to figure out:
//

function loadMacroTargets() {
    const targetFactory = TargetFactory.getInstance()
    // for target in targets.getTargets().findTargets('macrodetails'):
    for (const target of targetFactory.findTargets('macrodetails')) {
        //         #log.debug('Preloading target %s', getpath.getRelativePath(target.path))
        //         algos3d.getTarget(self.selectedHuman.meshData, target.path)
        // console.log(target.path)
        // target.getTarget()
    }
}
