import { TAB } from "HistoryManager"

import { Tab } from "toad.js/view/Tab"
import { Condition } from "toad.js/model/Condition"
import { FormSelect } from "toad.js/view/FormSelect"
import { FormSwitch } from "toad.js/view/FormSwitch"
import {
    NumberModel,
    SelectionModel,
    Slider,
    Table,
    TableAdapter,
    TableEditMode,
    TableEvent,
    TableEventType,
    TableModel,
    TablePos,
    TextField,
    css,
    ref,
} from "toad.js"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"

import { Application } from "Application"
import { blendshapeNames } from "mediapipe/blendshapeNames"
import { BlendShapeEditor } from "BlendShapeEditor"
import { QuadRenderer } from "mediapipe/QuadRenderer"
import { MHFacePoseUnits } from "blendshapes/MHFacePoseUnits"
import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { quat2 } from "gl-matrix"

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

class PoseUnitWeights extends TableModel {
    private facePoseUnits

    constructor(facePoseUnits: MHFacePoseUnits) {
        super()
        this.facePoseUnits = Array.from(facePoseUnits.blendshape2bone, ([name, weight]) => ({
            name,
            weight: new NumberModel(0, {
                min: 0,
                max: 1,
                step: 0.01,
                label: name,
            }),
        }))
    }
    get colCount(): number {
        return 2
    }
    get rowCount(): number {
        return this.facePoseUnits.length
    }
    getName(row: number): string {
        return this.facePoseUnits[row].name
    }
    getWeight(row: number): NumberModel {
        return this.facePoseUnits[row].weight
    }
    foo() {}
}

class PoseUnitWeightsAdapter extends TableAdapter<PoseUnitWeights> {
    override getColumnHead(col: number) {
        switch (col) {
            case 0:
                return <>Pose Unit</>
            case 1:
                return <>Weight</>
        }
    }
    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        // cell.style.padding = "1px" // DON'T: this breaks Table's layout algorithm
        switch (pos.col) {
            case 0:
                cell.innerText = this.model.getName(pos.row)
                break
            case 1:
                // cell.innerText = this.model.getWeight(pos.row).toString()
                const poseUnit = this.model.getWeight(pos.row)
                if (poseUnit.modified.count() == 0) {
                    poseUnit.modified.add(() =>
                        this.model.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, pos.col, pos.row))
                        // ALSO
                        // o accumulate MHFacePoseUnits and copy them to BlendshapeConverter

                        // source
                        //   this.model has the weights
                        //   MHFacePoseUnits has the quads for each weight
                        // destination
                        //   MHFaceBlendshapes
                        // algorithm
                        //   BlendshapeConverter combines BlendshapeModel, MHFaceBlendshapes
                        //   and copies it to the polygon
                    )
                }
                cell.style.width = "50px"
                cell.style.textAlign = "right"
                cell.innerText = poseUnit.value.toString()
                // const model = this.model.poseUnits[pos.row]
                poseUnit.applyStyle(cell)
                cell.onwheel = (event: WheelEvent) => {
                    PoseUnitWeightsAdapter.wheel(poseUnit, event)
                }
                cell.ondblclick = () => poseUnit.resetToDefault()
                // cell.onpointerenter = () => poseUnit.focus(true)
                // cell.onpointerleave = () => poseUnit.focus(false)
                break
        }
    }
    protected static wheel(model: NumberModel, e: WheelEvent) {
        // console.log(`wheel event for model ${model.label}`)
        e.preventDefault()
        if (e.deltaY > 0) {
            model.decrement()
        }
        if (e.deltaY < 0) {
            model.increment()
        }
    }
    override saveCell(pos: TablePos, cell: HTMLSpanElement): void {
        switch (pos.col) {
            case 1:
                this.model.getWeight(pos.row).value = parseFloat(cell.innerText)
                break
        }
    }
}

TableAdapter.register(PoseUnitWeightsAdapter, PoseUnitWeights)

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

    const renderer = new QuadRenderer(editor)

    const facePoseUnits = new MHFacePoseUnits(props.app.skeleton)

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
                        props.app.updateManager.blendshapeModel = props.app.frontend.blendshapeModel
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
                <FormSlider model={editor.secondayWeight} />
                <FormSwitch model={props.app.humanMesh.wireframe} />
            </Form>
            <Table model={new PoseUnitWeights(facePoseUnits)} style={{ width: "calc(100% - 2px)", height: "200px" }} />
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
