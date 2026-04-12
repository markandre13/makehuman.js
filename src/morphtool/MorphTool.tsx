import { Application } from 'Application'
import { TAB } from 'HistoryManager'
import { Tab } from 'toad.js/viewkit/Tab'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { Form, FormField, FormHelp, FormLabel } from 'toad.js/viewkit/Form'
import { FormSwitch } from 'toad.js/viewkit/FormSwitch'
import { MorphToolMode } from './MorphToolMode'
import { ComboBox } from 'toad.js/viewkit/ComboBox'
import { Button, ButtonVariant } from 'toad.js/viewkit/Button'
import { FaceRenderer } from './FaceRenderer'
import { ARKitBlendshapeMesh } from './ARKitBlendshapeMesh'
import { di } from 'lib/di'
import { mat4 } from 'gl-matrix'
import { deg2rad } from 'gl/algorithms/deg2rad'
import { Table } from 'toad.js/table/Table'

// TODO
// [ ] Tab.visibilityChange: improve the APIb
// animate
// [ ] enable/disable animation
//   [ ] get one of the following to work again
//       FaceARKitRenderer / FaceARKitLoader
//       FaceICTKitRenderer / FaceICTKitLoader
//       BlendshapeModel

// showMapping: 
// [ ] enable/disable mapping
// [ ] disable when selecting vertices

// how to connect to backend
// * we want most application logic in the frontend as it's platform independant
// * that would mean that the app is responsible to reconnect to the backend

// * installSystemExceptionHandler(object: CORBAObject, handler: () => void)
//   one handler per object...
//   will be called when the connection closes

/**
 * Tool to morph face meshes.
 */
export function MorphTool(props: { app: Application }) {
    const faceRenderer = new FaceRenderer(di.get(ARKitBlendshapeMesh).preload())
    const model = new MorphToolModel()
    const renderer = new MorphRenderer(props.app, model, faceRenderer)
    model.renderer = renderer
    model.faceRenderer = faceRenderer

    model.showMapping.signal.add(() => {
        if (model.showMapping.value) {
            model.showAnimation.value = false
        }
        props.app.glview.invalidate()
    })
    model.showAnimation.signal.add(() => {
        // MorphRenderer redirects to FaceRenderer when true
        if (model.showAnimation.value) {
            props.app.blendshapeModel.signal.add(props.app.glview.invalidate, renderer)
        } else {
            props.app.blendshapeModel.signal.remove(renderer)
        }
        props.app.glview.invalidate()
    })

    return (
        <Tab
            label="Face"
            value={TAB.FACE}
            visibilityChange={(state) => {
                switch (state) {
                    case 'visible':
                        // TODO: move this elsewhere
                        props.app.morphManager.reset()
                        props.app.skeleton.reset()

                        const jaw = props.app.skeleton.getBone("jaw")!
                        jaw.matUserPoseRelative = mat4.fromXRotation(mat4.create(), deg2rad(12))

                        const scaleHeadVert = props.app.morphManager.getModifier("head/head-scale-vert-decr|incr")
                        scaleHeadVert!.model!.value = -0.1696875 // -0.37132812500000006

                        // move eye
                        const leftEye = props.app.morphManager.getModifier("eyes/l-eye-trans-down|up")
                        leftEye!.model!.value = -1
                        const rightEye = props.app.morphManager.getModifier("eyes/r-eye-trans-down|up")
                        rightEye!.model!.value = -1
                        const forehead = props.app.morphManager.getModifier("forehead/forehead-trans-backward|forward")
                        forehead!.model!.value = -0.5
                        const mouth = props.app.morphManager.getModifier("mouth/mouth-trans-backward|forward")
                        mouth!.model!.value = 0.1

                        props.app.updateManager.updateFromLocalSettingsWithoutGL()

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
                        model.showAnimation.value = false
                        props.app.morphManager.reset()
                        props.app.skeleton.reset()
                        props.app.updateManager.updateFromLocalSettingsWithoutGL()

                        props.app.glview.popInputHandler()
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
                <FormSwitch model={model.showAnimation} />

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


