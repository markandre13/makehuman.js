import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/view/Tab'
import { MorphRenderer, MorphToolModel } from './MorphRenderer'
import { Form } from 'toad.js/view/Form'
import { FormSwitch } from 'toad.js/view/FormSwitch'

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
                        break
                    case 'hidden':
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
                <FormSwitch model={model.isARKitActive}/>
                <FormSwitch model={model.showBothMeshes}/>
            </Form>
            <ul>
                <li>use flat shader to make it easier to select vertices</li>
                <li>select vertices</li>
                <li>try to overlay both faces, otherwise quad view (or both?)</li>
                <li>begin morph algorithm</li>
                <li>
                    use color to visualize morph / difference between meshes
                </li>
            </ul>
        </Tab>
    )
}
