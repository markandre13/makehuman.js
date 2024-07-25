import { TAB } from "HistoryManager"

import { Tab } from "toad.js/view/Tab"
import { FormSelect } from "toad.js/view/FormSelect"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { Button, NumberModel, Slider, Table, TableAdapter, TextField } from "toad.js"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"

import { Application } from "Application"
import { BlendShapeEditor } from "./BlendShapeEditor"
import { QuadRenderer } from "mediapipe/QuadRenderer"
import { PoseUnitWeights } from "./PoseUnitWeights"
import { PoseUnitWeightsAdapter } from "./PoseUnitWeightsAdapter"
import { FormText } from "toad.js/view/FormText"
import { BlendshapeToPoseConfig } from "./BlendshapeToPoseConfig"

export interface BlendshapeDescription {
    group: "eyebrow" | "eye" | "eyelid" | "check" | "jaw" | "lips" | "mouth" | "mouthExpression" | "tongue"
    pattern: string
    symmetric?: boolean // true means there is a Left|Right variant
    description: string
}

export const blendshapeDescriptions: BlendshapeDescription[] = [
    {
        group: "eyebrow",
        pattern: "browInnerUp",
        description: "insides, to be combined with browOuter(Up|Down)(Left|Right)",
    },
    {
        group: "eyebrow",
        pattern: "browDown",
        symmetric: true,
        description: "the whole brow down, to be combined with browInnerUp*",
    },
    {
        group: "eyebrow",
        pattern: "browOuterDown",
        symmetric: true,
        description: "",
    },
    {
        group: "eyebrow",
        pattern: "browOuterUp",
        symmetric: true,
        description: "",
    },

    {
        group: "eye",
        pattern: "eyeLook(Up|Down|In|Out)",
        symmetric: true,
        description:
            `this moves the eye and eyelid. movement is also visible on a ` +
            `closed eye due to the bulge that is the corona`,
    },

    {
        group: "eyelid",
        pattern: "eyeBlink",
        symmetric: true,
        description: "normal: close upper eyelid, to be combined",
    },
    {
        group: "eyelid",
        pattern: "eyeSquint",
        symmetric: true,
        description: "smile, move upper and lower eyelid closer but not closed",
    },
    {
        group: "eyelid",
        pattern: "eyeWide",
        symmetric: true,
        description: "surprise, upper eyelid up",
    },

    {
        group: "check",
        pattern: "noseSneer",
        symmetric: true,
        description: "inner nose and check up, inner brow down, to be combined with browDown",
    },
    {
        group: "check",
        pattern: "cheekSquint",
        symmetric: true,
        description: "outer check up, outer brow down",
    },
    {
        group: "check",
        pattern: "cheekPuff",
        description: "fill checks with air, to be combined with mouthPucker",
    },

    {
        group: "jaw",
        pattern: "jaw(Open|Forward|Left|Right)",
        description: "jaw forward",
    },
    {
        group: "jaw",
        pattern: "mouthClose",
        description: "to close mouth to counter jawOpen",
    },

    {
        group: "mouth",
        pattern: "mouthFunnel", // trichter
        description: "o shaped lips, open",
    },
    {
        group: "mouth",
        pattern: "mouthPucker", // zusammenziehen
        description: "o shaped lips, closed",
    },
    {
        group: "mouth",
        pattern: "mouth(Left|Right)",
        description: "move whole mouth left and right",
    },
    {
        group: "mouth",
        pattern: "mouthDimple", // grübchen
        symmetric: true,
        description: "widen mouth",
    },
    {
        group: "mouth",
        pattern: "mouth(UpperUp|LowerDown)",
        symmetric: true,
        description: "open mouth",
    },

    {
        group: "mouthExpression",
        pattern: "mouthSmile",
        symmetric: true,
        description: "smile",
    },
    {
        group: "mouthExpression",
        pattern: "mouthFrown",
        symmetric: true,
        description: "frown",
    },
    {
        group: "mouthExpression",
        pattern: "mouthPress",
        symmetric: true,
        description: "forced smile",
    },
    {
        group: "mouthExpression",
        pattern: "mouthStretch",
        symmetric: true,
        description: "forced frown",
    },

    {
        group: "lips",
        pattern: "mouthRoll(Upper|Lower)",
        description: "roll upper/lower lips inwards",
    },
    {
        group: "lips",
        pattern: "mouthShrug(Upper|Lower)",
        description: "move upper/lower lip up",
    },

    {
        group: "tongue",
        pattern: "tongueOut",
        description: "tongueOut (not tracked by mediapipe but arkit)",
    },
]

export function FormSlider(props: { model: NumberModel }) {
    return (
        <>
            <FormLabel model={props.model} />
            <FormField>
                <TextField model={props.model} style={{ width: "50px" }} />
                <Slider model={props.model} />
            </FormField>
            <FormHelp model={props.model} />
        </>
    )
}

TableAdapter.register(PoseUnitWeightsAdapter, PoseUnitWeights)

export function BlendShapeTab(props: { app: Application }) {
    const editor = BlendShapeEditor.getInstance(props.app)

    // const morphToMatchNeutral = new Condition(() => {
    //     return editor.blendshape.value == blendshapeNames[0]
    // }, [editor.blendshape])
    // const sm = new SelectionModel(TableEditMode.EDIT_CELL)

    const renderer = new QuadRenderer(editor)

    return (
        <Tab
            label="Face"
            value={TAB.FACE}
            visibilityChange={(state) => {
                switch (state) {
                    case "visible":
                        props.app.setRenderer(renderer)
                        break
                    case "hidden":
                        // reset blendhape model
                        props.app.updateManager.setBlendshapeModel(props.app.frontend.blendshapeModel)
                        break
                }
            }}
        >
            Face Blendshape Editor (under construction)
            <a href="https://hinzka.hatenablog.com/entry/2021/12/21/222635">blendshapes explained</a>
            <Form>
                {/* <FormText model={editor.scale} />
                <FormText model={editor.dy} />
                <FormText model={editor.dz} /> */}
                <FormSelect model={editor.blendshape} />
                <FormSlider model={editor.primaryWeight} />
                <FormSlider model={editor.secondaryWeight} />
                <FormSwitch model={props.app.humanMesh.wireframe} />

                <FormLabel>Store</FormLabel>
                <FormField>
                    <Button
                        action={async () => {
                            const jsonString = await props.app.frontend.backend?.load("face-blendshape-poses.cfg")
                            if (jsonString !== undefined) {
                                const cfg = BlendshapeToPoseConfig.fromJSON(props.app.skeleton, jsonString)

                                // FIXME: nasty hack
                                props.app.blendshapeToPoseConfig.modified.remove(props.app.updateManager)

                                props.app.blendshapeToPoseConfig = cfg

                                props.app.blendshapeToPoseConfig.modified.add(() => {
                                    props.app.updateManager.blendshapeToPoseConfigChanged = true
                                }, props.app.updateManager)

                                cfg.modified.trigger()
                            }
                        }}
                    >
                        Load
                    </Button>
                    <Button
                        action={async () => {
                            await props.app.frontend.backend?.save(
                                "face-blendshape-poses.cfg",
                                JSON.stringify(props.app.blendshapeToPoseConfig)
                            )
                        }}
                    >
                        Save
                    </Button>
                </FormField>
            </Form>
            <Table model={editor.poseUnitWeightsModel} style={{ width: "calc(100% - 2px)", height: "200px" }} />
            <p>pose face to match blendshape</p>
            <object
                id="face"
                type="image/svg+xml"
                width="250px"
                data="static/mhjs-face.svg"
                onload={(ev) => editor.prepare(ev)}
                style={{ float: "left" }}
            />
            <Form>
                <FormText model={editor.boneRX} />
                <FormText model={editor.boneRY} />
                <FormText model={editor.boneRZ} />
                <FormText model={editor.boneTX} />
                <FormText model={editor.boneTY} />
                <FormText model={editor.boneTZ} />
            </Form>
        </Tab>
    )
}
