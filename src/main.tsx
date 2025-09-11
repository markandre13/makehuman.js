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

import { SliderNode } from './modifier/loadSliders'
import { PoseNode } from 'expression/PoseNode'
import { ProxyType } from 'proxy/Proxy'

import FileTab from 'FileTab'
import ChordataTab from 'chordata/chordata'
import { PoseTreeAdapter } from 'ui/poseView'
import { SliderTreeAdapter } from 'ui/morphView'
import { TAB } from 'HistoryManager'

import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from './filesystem/HTTPFSAdapter'

import { Table } from 'toad.js/table/Table'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from 'toad.js/table/adapter/TreeAdapter'
import { Tab, Tabs } from 'toad.js/view/Tab'
import { Form, FormLabel, FormField, FormHelp } from 'toad.js/view/Form'
import { Display, Select, TableAdapter } from 'toad.js'
import { StringArrayAdapter } from 'toad.js/table/adapter/StringArrayAdapter'
import { StringArrayModel } from 'toad.js/table/model/StringArrayModel'
import { MediapipeTab } from 'mediapipe/mediapipe'
import { Application, setRenderer } from 'Application'
import { RenderHuman } from 'render/RenderHuman'
// import { BlendShapeTab } from 'blendshapes/BlendShapeTab'
import { ConnectButton } from 'net/ConnectButton'
import { PoseTab } from 'mediapipe/pose/PoseTab'
import { MorphTool } from 'morphtool/MorphTool'
import { RenderView } from 'render/RenderView'
import { FormSwitch } from 'toad.js/view/FormSwitch'

export async function main() {
    try {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
        await run()
    } catch (e) {
        console.log(e)
        if (e instanceof Error) {
            alert(`${e.name}: ${e.message}`)
        } else {
            alert(e)
        }
    }
}

async function run() {
    const app = new Application()

    // const mhm = localStorage.getItem("MakeHumanMorph")
    // if (mhm != null) {
    //     app.humanMesh.human.fromMHM(mhm)
    // }
    // const mhp = localStorage.getItem("MakeHumanPose")
    // if (mhp != null) {
    //     app.skeleton.fromMHP(mhp)
    // }
    // document.onvisibilitychange = (e) => {
    //     localStorage.setItem("MakeHumanMorph", app.humanMesh.human.toMHM())
    //     localStorage.setItem("MakeHumanPose", app.skeleton.toMHP())
    // }

    TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)
    TreeAdapter.register(PoseTreeAdapter, TreeNodeModel, PoseNode)

    TableAdapter.register(StringArrayAdapter, StringArrayModel)

    const oiah = 'calc((12/16) * 1rem + 8px'

    // App.glview needs to be set before other operations
    const glview = (
        <RenderView
            app={app}
            style={{
                position: 'absolute',
                left: '500px',
                right: 0,
                top: 0,
                bottom: 'calc((12/16) * 1rem + 4px',
                overflow: 'hidden',
            }}
        />
    )

    document.body.replaceChildren(
        ...(
            <>
                <Tabs
                    model={app.tabModel}
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: '500px',
                        top: 0,
                        bottom: oiah,
                    }}
                >
                    <FileTab app={app} />
                    <MorphTab app={app} />
                    <ProxyTab app={app} />
                    {/* <PoseTab app={app} /> */}
                    {/* <BlendShapeTab app={app} /> */}
                    <MorphTool app={app} />
                    <PoseTab app={app} />
                    {/* <ExpressionTab app={app} /> */}
                    {/* <MediapipeTab app={app} /> */}
                    <ChordataTab app={app} />
                </Tabs>
                {glview}
                <div
                    style={{
                        background: 'var(--tx-gray-50)',
                        padding: '2px',
                        paddingLeft: '8px',
                        margin: 0,
                        border: 'none',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 'calc((12/16) * 1rem + 4px',
                        bottom: 0,
                        overflow: 'hidden',
                    }}
                >
                    <ConnectButton connector={app.connector} />
                    &nbsp;
                    <Display model={app.status} />
                </div>
            </>
        )
    )
}

function MorphTab(props: { app: Application }) {
    return (
        <Tab
            label="Morph"
            value={TAB.MORPH}
            visibilityChange={setRenderer(props.app, new RenderHuman())}
        >
            <Table
                model={props.app.morphControls}
                style={{ width: '100%', height: '100%' }}
            />
        </Tab>
    )
}

function ProxyTab(props: { app: Application }) {
    return (
        <Tab
            label="Proxy"
            value={TAB.PROXY}
            visibilityChange={setRenderer(props.app, new RenderHuman())}
        >
            <Form variant="narrow">
                {props.app.proxyManager.allProxyTypes.map((pid) => (
                    <>
                        <FormLabel>{ProxyType[pid]}</FormLabel>
                        <FormField>
                            <Select id={ProxyType[pid]} model={props.app.proxyManager.list.get(pid)} />
                        </FormField>
                        <FormHelp model={props.app.proxyManager.list.get(pid) as any} />
                    </>
                ))}
                <FormSwitch model={props.app.humanMesh.wireframe} />
            </Form>
            <div id="debug">DEBUG</div>
        </Tab>
    )
}

main()
