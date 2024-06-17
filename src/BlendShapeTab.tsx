import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { SelectionModel, TableEditMode, TextField, css, ref } from "toad.js"
import { Condition } from "toad.js/model/Condition"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { blendshapeNames } from "mediapipe/blendshapeNames"
import { FormSelect } from "toad.js/view/FormSelect"
import { BlendShapeEditor } from "BlendShapeEditor"
import { QuadRenderer } from "mediapipe/QuadRenderer"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { IBlendshapeConverter } from "blendshapes/IBlendshapeConverter"

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


export function BlendShapeTab(props: { app: Application }) {
    const editor = BlendShapeEditor.getInstance(props.app)

    const morphToMatchNeutral = new Condition(() => {
        return editor.blendshape.value == blendshapeNames[0]
    }, [editor.blendshape])

    const sm = new SelectionModel(TableEditMode.EDIT_CELL)

    const elements: { x?: TextField; y?: TextField; z?: TextField; dialog?: HTMLDialogElement } = {}
    editor.currentBone.modified.add(() => {
        const poseNode = props.app.skeleton.poseNodes.find(editor.currentBone.value)
        if (poseNode !== undefined) {
            elements.x!.setModel(poseNode.x)
            elements.y!.setModel(poseNode.y)
            elements.z!.setModel(poseNode.z)
        }
    })

    const renderer = new QuadRenderer(props.app.frontend, editor)

    let defaultConverter: IBlendshapeConverter | undefined

    return (
        <Tab
            label="Face"
            value={TAB.FACE}
            visibilityChange={(state) => {
                switch (state) {
                    case "visible":
                        props.app.setRenderer(renderer)
                        defaultConverter = props.app.updateManager.blendshapeConverter
                        props.app.updateManager.blendshapeConverter = undefined
                        break
                    case "hidden":
                        props.app.updateManager.blendshapeConverter = defaultConverter
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
                <FormSwitch model={props.app.humanMesh.wireframe} />
            </Form>
            {/* <If isTrue={morphToMatchNeutral}>
                <p>morph face to match neutral blendshape</p>
                <Table model={props.app.morphControls} style={{ width: "498px", height: "500px" }} />
            </If> */}
            {/* <If isFalse={morphToMatchNeutral}> */}
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
                <FormLabel>X</FormLabel>
                <FormField>
                    <TextField set={ref(elements, "x")} />
                </FormField>
                <FormHelp />
                <FormLabel>Y</FormLabel>
                <FormField>
                    <TextField set={ref(elements, "y")} />
                </FormField>
                <FormHelp />
                <FormLabel>Z</FormLabel>
                <FormField>
                    <TextField set={ref(elements, "z")} />
                </FormField>
                <FormHelp />
                <style>
                    {css`
                        dialog {
                            height: auto;
                            /* width: 400px; */
                            background: var(--tx-gray-200);
                            color: var(--tx-gray-800);
                            border: none;
                        }
                    `}
                </style>
            </Form>
            {/* </If> */}
            {/* <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} /> */}
        </Tab>
    )
}
