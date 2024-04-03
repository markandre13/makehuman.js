import { Tab } from "toad.js/view/Tab"
import { Button, Checkbox, BooleanModel } from "toad.js"
import { TAB } from "HistoryManager"
import { AnimationTrack, BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { HumanMesh, isZero } from "../mesh/HumanMesh"
import { exportCollada } from "mesh/Collada"
import { loadSkeleton } from "../skeleton/loadSkeleton"

    const useBlenderProfile = new BooleanModel(true)
    const limitPrecision = new BooleanModel(false)
    useBlenderProfile.enabled = false
    limitPrecision.enabled = false

export default function (props: {scene: HumanMesh}) {
    const scene = props.scene

    return (
        <Tab label="File" value={TAB.EXPORT}>
            <div style={{ padding: "10px" }}>
                <h1>Morph</h1>

                <p>
                    <u>NOTE</u>: Only MakeHuman 1.1 and 1.2 files are supported.
                </p>

                <Button action={() => loadMHM(scene)}>Load MHM</Button>
                <Button action={() => saveMHM(scene)}>Save MHM</Button>

                <h1>Pose</h1>
                <Button action={() => loadBVH(scene)}>Load BVH</Button>
                <Button action={() => saveBVH(scene)}>Save BVH</Button>

                <h1>Collada</h1>

                <p>
                    <Checkbox
                        model={useBlenderProfile}
                        title="Export additional Blender specific information (for material, shaders, bones, etc.)."
                    />{" "}
                    Use Blender Profile
                </p>
                <p>
                    <Checkbox model={limitPrecision} title="Reduce the precision of the exported data to 6 digits." />{" "}
                    Limit Precision
                </p>
                <p>
                    <u>NOTE</u>: When importing into Blender, only the first material may look correct in the UV editor
                    while rendering will still be okay. A workaround is to separate the mesh by material after import.
                    (Edit Mode, P).
                </p>
                <p>
                    <u>NOTE</u>: Exporting the pose is not implemented yet. There is just some hardcoded animation of
                    the jaw.
                </p>
                <Button action={() => downloadCollada(scene)}>Export Collada</Button>
            </div>
        </Tab>
    )
}

function makeDownloadElement() {
    const download = document.createElement("a")
    download.type = "text/plain"
    download.style.display = "hidden"
    download.download = "makehuman.dae"
    return download
}

function makeUploadElement() {
    const upload = document.createElement("input")
    upload.type = "file"
    upload.style.display = "none"
    return upload
}

const download = makeDownloadElement()
const upload = makeUploadElement()

function downloadCollada(scene: HumanMesh) {
    download.download = "makehuman.dae"
    download.href = URL.createObjectURL(new Blob([exportCollada(scene)], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

function saveMHM(scene: HumanMesh) {
    console.log(`saveMHM`)

    let out = `version v1.2.0\n`
    out += `name makehuman.js\n`
    out += `camera 0.0 0.0 0.0 0.0 0.0 1.0\n`

    scene.human.modifiers.forEach((modifer, name) => {
        const value = modifer.getValue()
        if (!isZero(value)) {
            out += `modifier ${name} ${value.toPrecision(6)}\n`
        }
    })
    // out += `eyes HighPolyEyes 2c12f43b-1303-432c-b7ce-d78346baf2e6\n`
    out += `clothesHideFaces True\n`
    // out += `skinMaterial skins/default.mhmat\n`
    // out += `material HighPolyEyes 2c12f43b-1303-432c-b7ce-d78346baf2e6 eyes/materials/brown.mhmat\n`
    out += `subdivide False\n`

    download.download = "makehuman.mhm"
    download.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

function loadMHM(scene: HumanMesh) {
    upload.accept = ".mhm"
    upload.onchange = async () => {
        if (upload.files?.length === 1) {
            const file = upload.files[0]
            console.log(`file: "${file.name}", size ${file.size} bytes`)
            const buffer = await file.arrayBuffer()
            const te = new TextDecoder()
            const content = te.decode(buffer)
            scene.human.modifiers.forEach((modifier) => {
                modifier.getModel().value = modifier.getDefaultValue()
            })
            for (const line of content.split("\n")) {
                const token = line.split(" ")
                if (token[0] === "modifier") {
                    const modifier = scene.human.modifiers.get(token[1])
                    if (modifier === undefined) {
                        console.log(`unknown modifier '${token[1]}' in file`)
                    } else {
                        modifier.getModel().value = parseFloat(token[2])
                    }
                }
            }
        }
    }
    upload.dispatchEvent(new MouseEvent("click"))
}

function saveBVH(scene: HumanMesh) {
    // const bvh = new BiovisionHierarchy()
    // const data: mat4[] = scene.skeleton.boneslist!.map((bone) => {
    //     const m = mat4.invert(mat4.create(), bone.matPoseGlobal!)
    //     mat4.mul(m, bone.matPose, m)
    //     mat4.mul(m, bone.matRestGlobal!, m)
    //     return m
    // })

    // const animation = new AnimationTrack("makehuman", data, 1, 1 / 24)
    // bvh.fromSkeleton(scene.skeleton, animation, false)
    // const out = bvh.writeToFile()
    const out = fakeSaveData(scene)

    download.download = "makehuman.bvh"
    download.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

// THIS WORKS!!! (SOMETIMES...)
function fakeSaveData(scene: HumanMesh) {
    const skeleton = loadSkeleton(scene, "data/rigs/default.mhskel")
    skeleton.build()
    skeleton.update()

    scene.skeleton.build()
    scene.skeleton.update()

    // this works
    // const bvh0 = new BiovisionHierarchy().fromFile("data/poses/run01.bvh")
    // const ani0 = bvh0.createAnimationTrack(skeleton)

    // console.log(scene.skeleton.roots[0].matPose)

    // this is a total mess, just using bone.matPose is better but not correct
    // hey! i could create a test from it! and move it into a method and cover that one with tests...
    const data = scene.skeleton.getPose()
    const ani0 = new AnimationTrack("makehuman", data, 1, 1 / 24)

    const bvh1 = new BiovisionHierarchy().fromSkeleton(skeleton, ani0, false)
    return bvh1.writeToFile()
}

function loadBVH(scene: HumanMesh) {
    upload.accept = ".bvh"
    upload.onchange = async () => {
        if (upload.files?.length === 1) {
            const file = upload.files[0]
            // console.log(`file: "${file.name}", size ${file.size} bytes`)
            const buffer = await file.arrayBuffer()
            const textDecoder = new TextDecoder()
            const content = textDecoder.decode(buffer)
            const bvh_file = new BiovisionHierarchy().fromFile(file.name, "auto", "onlyroot", content)
            const anim = bvh_file.createAnimationTrack(scene.skeleton)
            scene.skeleton.setPose(anim, 0)
        }
    }
    upload.dispatchEvent(new MouseEvent("click"))
}
