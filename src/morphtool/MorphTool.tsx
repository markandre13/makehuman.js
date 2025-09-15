import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/view/Tab'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { Form, FormField, FormHelp, FormLabel } from 'toad.js/view/Form'
import { FormSwitch } from 'toad.js/view/FormSwitch'
import { MorphToolMode } from './MorphToolMode'
import { Action, Button, OptionModel, Table, TextModel } from 'toad.js'
import { ComboBox } from 'toad.js/view/ComboBox'
import { ButtonVariant } from 'toad.js/view/Button'

/**
 * Tool to morph face meshes.
 */
export function MorphTool(props: { app: Application }) {
    const model = new MorphToolModel()
    const renderer = new MorphRenderer(props.app, model)
    model.renderer = renderer
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
                <FormSwitch model={model.isTransparentActiveMesh} />
                <FormSwitch model={model.showBothMeshes} />
                <FormSwitch model={model.showMapping} />

                <FormLabel model={model.morphGroups} />
                <FormField>
                    <ComboBox model={model.morphGroups} text={model.newMorphGroup} />
                    {" "}
                    <Button action={model.addMorphGroup} variant={ButtonVariant.ACCENT} />
                    {" "}
                    <Button action={model.deleteMorphGroup} variant={ButtonVariant.NEGATIVE} />
                </FormField>
                <FormHelp model={model.morphGroups} />

                {/* <FormSlider model={model.mhJawOpen}/>
                <FormSlider model={model.externJawOpen}/> */}
            </Form>

            <Table
                model={props.app.morphControls}
                style={{ width: '100%', height: '100%' }}
            />
        </Tab>
    )
}
