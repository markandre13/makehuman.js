import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/view/Tab'
import { MorphRenderer } from './MorphRenderer'

/**
 * Tool to morph face meshes.
 */
export function MorphTool(props: { app: Application }) {
    const renderer = new MorphRenderer()
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
            <ul>
                <li>use flat shader to make it easier to select vertices</li>
                <li>select vertices</li>
                <li>
                    use color to visualize morph / difference between meshes
                </li>
            </ul>
        </Tab>
    )
}
