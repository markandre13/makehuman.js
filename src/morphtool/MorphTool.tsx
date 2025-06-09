import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/view/Tab'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { Form } from 'toad.js/view/Form'
import { FormSwitch } from 'toad.js/view/FormSwitch'
import { MorphToolMode } from './MorphToolMode'

/**
 * Tool to morph face meshes.
 */
export function MorphTool(props: { app: Application }) {
    const model = new MorphToolModel()
    const renderer = new MorphRenderer(props.app, model)

    return (
        <Tab
            label="Morph"
            value={TAB.FACE}
            visibilityChange={(state) => {
                switch (state) {
                    case 'visible':
                        props.app.setRenderer(renderer)
                        if (props.app.glview) {
                            props.app.glview.pushInputHandler(
                                new MorphToolMode(props.app, model, renderer)
                            )
                        } else {
                            console.trace('NO GLVIEW')
                        }
                        break
                    case 'hidden':
                        props.app.glview.popInputHandler()
                        // reset blendhape model
                        props.app.updateManager.setBlendshapeModel(
                            props.app.frontend.blendshapeModel
                        )
                        break
                }
            }}
        >
            Tool to morph face meshes onto each other.
            <Form>
                <FormSwitch model={model.isARKitActive} />
                <FormSwitch model={model.showBothMeshes} />
            </Form>
            <ul>
                <li>✅ use flat shader to make it easier to select vertices</li>
                <li>✅ select vertices</li>
                <li>
                    ✅ try to overlay both faces, otherwise quad view (or both?)
                </li>
                <li>
                    limit mh selection to BaseMeshGroup.SKIN, with tests and
                    cleanup code
                </li>
                <li>
                    ⚠️ mark/unmark vertices on different meshes and store them as pairs
                </li>
                <li>
                    add blender like fly mode, zoom, etc. to get closer to the
                    model, with tests and cleanup code
                    <ul>
                        <li>✅ middle mouse: rotate around origin</li>
                        <li>middle mouse: rotate around selection</li>
                        <li>shift + middle mouse: grab view</li>
                        <li>wheel up/down: zoom in/out</li>
                        <li>⚠️ reset camera</li>
                        <li>save/restore camera</li>
                        <li>transition z-axis to 0</li>
                        <li>
                            shift+`: start fly mode
                            <ul>
                                <li>✅ mouse: rotate camera</li>
                                <li>
                                    wheel: acceleration (numerical value
                                    shown at bottom)
                                </li>
                                <li>✅ q/e: down/up</li>
                                <li>✅ w/s: forward/backward</li>
                                <li>✅ a/d: left/right</li>
                                <li>q/e: global up/down</li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    calculate and visualize morph of selected point to clostest
                    point on other mesh
                </li>
                <li>
                    mark and store points, lines and faces on both meshes
                    <ul>
                        <li>to be used to validate quality of morph</li>
                        <li>
                            to be used to tweak mesh and/or choose morph
                            strategy
                        </li>
                    </ul>
                </li>
                <li>...</li>
            </ul>
        </Tab>
    )
}
