import { Human } from './modifier/Human'
import { TargetFactory } from './target/TargetFactory'
import { loadSkeleton } from './skeleton/loadSkeleton'
import { loadModifiers } from './modifier/loadModifiers'
import { loadSliders, SliderNode } from './modifier/loadSliders'
import { WavefrontObj } from 'mesh/WavefrontObj'
import { HumanMesh, Update } from './mesh/HumanMesh'
import { RenderMode } from './render/RenderMode'
import { exportCollada } from 'mesh/Collada'
import { ProxyType } from 'proxy/Proxy'

import { PoseNode, PoseTreeAdapter } from 'ui/poseView'
import { SliderTreeAdapter } from 'ui/morphView'
import { render } from './render/render'
import { renderFace } from 'render/renderFace'

import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from './filesystem/HTTPFSAdapter'

import { Table } from 'toad.js/table/Table'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from "toad.js/table/adapter/TreeAdapter"
import { EnumModel } from "toad.js/model/EnumModel"
import { Fragment, ref } from "toad.jsx"
import { Tab, Tabs } from 'toad.js/view/Tab'
import { Form, FormLabel, FormField, FormHelp } from 'toad.js/view/Form'
import { BooleanModel, Button, Checkbox, Select, SelectionModel, Signal, TableAdapter, TableEditMode, TableModel, TablePos, text } from 'toad.js'
import { calcWebGL, ExpressionManager } from './ExpressionManager'
import { ProxyManager } from './ProxyManager'

window.onload = () => { main() }

export function main() {
    try {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
        run()
        // runMediaPipe()
    }
    catch (e) {
        console.log(e)
        if (e instanceof Error) {
            alert(`${e.name}: ${e.message}`)
        } else {
            alert(e)
        }
    }
}

// MEDIAPIPE INTEGRATION PLAYGROUND
// [X] assuming that we receive the vertices, render the face
// [ ] have a look at http://www.makehumancommunity.org/wiki/Documentation:Basemesh
//     and provide some controls to manually animate the face
//     (maybe even save the pose in case we have some good ones)
//     MH provides some additional level of abstraction:
//         data/poseunits/face-poseunits.bvh with 60 frames
//         data/poseunits/face-poseunits.json with names for each frame
//         data/expressions/*.pose with percentage for each poseunit
//     expressions are most expressive on old people with teeth, hair and eye brows
//     [X] load bvh
//     [X] load poseunits
//     [X] load expression
//     [X] add face page showing face, list of expression and list of poseunits
//     [X] apply expression
//     [ ] export expression as animation in collada file
//     [ ] animate between expressions?
//         http://www.makehumancommunity.org/wiki/Documentation:Basemesh
//         dark helper bones: no deformation (of the skin), used to guide other bones
// [ ] it seems we get normalized face landmarks, try to get the non-normalized ones
//     coordinates are tripes with z == 0, is there 3d data somewhere available inside?
// [ ] render makehuman head besides mediapipe head
// [ ] try to animate the makehuman head from the mediapipe head
//     (assume that the camera is mounted to the head)
// [ ] to adjust to different people, we might need an initialisation step
// [ ] have a look at shape keys
//     http://www.makehumancommunity.org/wiki/Documentation:Corrective_shape_keys
// [ ] add ability to reconnect (client & server)
// [X] put server side ws code into a separate thread to improve performance
// [ ] record to file
// [ ] read file (either with frames dropped or precise)
// [ ] try opencv motion tracking to track optional markers painted
//     on the real face
export function runMediaPipe() {
    const refCanvas = new class { canvas!: HTMLCanvasElement }
    document.body.replaceChildren(...<>
        <canvas set={ref(refCanvas, 'canvas')} style={{ width: '480px', height: '480px', border: "1px #fff solid" }} />
    </>)
    // const obj = new WavefrontObj('data/canonical_face_model.obj') // uh! not quads

    const enc = new TextEncoder()
    const host = "localhost"
    const port = 9001
    const socket = new WebSocket(`ws://${host}:${port}`)
    socket.binaryType = "arraybuffer"
    socket.onopen = () => {
        console.log(`web socket is open`)
        socket.onmessage = async (msg: MessageEvent) => {
            let arrayBuffer: ArrayBuffer
            if (msg.data instanceof Blob) {
                arrayBuffer = await msg.data.arrayBuffer()
            } else
                if (msg.data instanceof ArrayBuffer) {
                    arrayBuffer = msg.data
                } else {
                    console.log("neither blob nor arraybuffer")
                    return
                }
            renderFace(refCanvas.canvas, arrayBuffer)
            socket.send(enc.encode("GET FACE"))
        }
        socket.send(enc.encode("GET FACE"))
    }
}

// core/mhmain.py
//   class MHApplication
//     startupSequence()
function run() {
    console.log('loading assets...')
    const human = new Human()
    const obj = new WavefrontObj('data/3dobjs/base.obj')
    const scene = new HumanMesh(human, obj)
    human.scene = scene

    const proxyManager = new ProxyManager(scene)

    // scene.proxies.set("Proxymeshes", loadProxy(human, "data/proxymeshes/proxy741/proxy741.proxy", "Proxymeshes"))
    // scene.proxies.set("Proxymeshes", loadProxy(human, "data/proxymeshes/female_generic/female_generic.proxy", "Proxymeshes"))
    // scene.proxies.set("Eyes", loadProxy(human, "data/eyes/high-poly/high-poly.mhclo", "Eyes"))
    // scene.proxies.set("Teeth", loadProxy(human, "data/teeth/teeth_base/teeth_base.mhclo", ProxyType.Teeth))
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

    //
    // EXPRESSIONS
    //

    const expressionManager = new ExpressionManager(skeleton)
    const expressionModel = new StringArrayModel(expressionManager.expressions)
    const selectedExpression = new SelectionModel(TableEditMode.SELECT_ROW)
    selectedExpression.modified.add(() => {
        const pm = expressionManager.fromPoseUnit(selectedExpression.row)
        for (let boneIdx = 0; boneIdx < skeleton.boneslist!.length; ++boneIdx) {
            const bone = skeleton.boneslist![boneIdx]
            const mrg = bone.matRestGlobal!
            skeleton.boneslist![boneIdx].matPose = calcWebGL(pm[boneIdx], mrg)
        }
        skeleton.update()
        scene.updateRequired = Update.POSE

        // expressionManager.setExpression(selectedExpression.row, poseNodes)
        // skeleton.update()
        // scene.updateRequired = Update.POSE
    })

    console.log('everything is loaded...')

    TableAdapter.register(StringArrayAdapter, StringArrayModel)
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

    // const teethProxy = new BooleanModel(true)
    // const toungeProxy = new BooleanModel(false)
    // const eyesProxy = new BooleanModel(true)
    // const skinProxy = new BooleanModel(true)
    // teethProxy.modified.add(() => {
    //     console.log(`teeth proxy changed to ${teethProxy.value}`)
    // })

    // might need use order from mat2txt

    const useBlenderProfile = new BooleanModel(true)
    const limitPrecision = new BooleanModel(false)
    useBlenderProfile.enabled = false
    limitPrecision.enabled = false

    const download = makeDownloadAnchor()
    const refCanvas = new class { canvas!: HTMLCanvasElement }
    // htmlFor={ProxyType[pid]}
    const mainScreen = <>
        <Tabs model={renderMode} style={{ position: 'absolute', left: 0, width: '500px', top: 0, bottom: 0 }}>
            <Tab label="Proxy" value="POLYGON">
                <Form variant="narrow">
                    {proxyManager.allProxyTypes.map(pid => <>
                        <FormLabel>{ProxyType[pid]}</FormLabel>
                        <FormField>
                            <Select id={ProxyType[pid]} model={proxyManager.list.get(pid)} />
                        </FormField>
                        <FormHelp model={proxyManager.list.get(pid) as any}/>
                    </>
                    )}
                </Form>
            </Tab>
            <Tab label="Expression" value="DEBUG">
                <Table
                    model={expressionModel}
                    selectionModel={selectedExpression}
                    style={{ width: '150px', height: '100%' }} />
            </Tab>
            <Tab label="Morph" value="POLYGON">
                <Table model={morphControls} style={{ width: '100%', height: '100%' }} />
            </Tab>
            <Tab label="Pose" value="WIREFRAME">
                <Table model={poseControls} style={{ width: '100%', height: '100%' }} />
            </Tab>
            <Tab label="Export" value="WIREFRAME">
                <div style={{ padding: "10px" }}>
                    <p>
                        <Checkbox model={useBlenderProfile} title="Export additional Blender specific information (for material, shaders, bones, etc.)." /> Use Blender Profile
                    </p>
                    <p>
                        <Checkbox model={limitPrecision} title="Reduce the precision of the exported data to 6 digits." /> Limit Precision
                    </p>
                    <p>
                        <u>NOTE</u>: When importing into Blender, only the first material may look correct
                        in the UV editor while rendering will still be okay.
                        A workaround is to separate the mesh by material after import. (Edit Mode, P).
                    </p>
                    <p>
                        <u>NOTE</u>: Exporting the pose is not implemented yet. There is just some hardcoded
                        animation of the jaw.
                    </p>
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

class StringArrayModel extends TableModel {
    protected data: string[]
    constructor(data: string[]) {
        super()
        this.data = data
    }
    override get colCount() { return 1 }
    override get rowCount() { return this.data.length }
    get(row: number) {
        return this.data[row]
    }
}

class StringArrayAdapter extends TableAdapter<StringArrayModel> {
    override showCell(pos: TablePos, cell: HTMLSpanElement): void {
        cell.replaceChildren(
            text(this.model!.get(pos.row))
        )
    }
}
