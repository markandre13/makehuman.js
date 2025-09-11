import { Tab } from "toad.js/view/Tab"
import { Button, Checkbox, BooleanModel } from "toad.js"
import { TAB } from "HistoryManager"
import { AnimationTrack, BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { HumanMesh, isZero } from "./mesh/HumanMesh"
import { exportCollada } from "mesh/Collada"
import { loadSkeleton } from "./skeleton/loadSkeleton"
import { Application, setRenderer } from "Application"
import { RenderHuman } from "render/RenderHuman"

const useBlenderProfile = new BooleanModel(true)
const limitPrecision = new BooleanModel(false)
useBlenderProfile.enabled = false
limitPrecision.enabled = false

export default function (props: { app: Application }) {
    const humanMesh = props.app.humanMesh

    return (
        <Tab label="File" value={TAB.EXPORT} visibilityChange={setRenderer(props.app, new RenderHuman())}>
            <div style={{ padding: "10px" }}>
                <h1>Morph</h1>

                <p>
                    <u>NOTE</u>: Only MakeHuman 1.1 and 1.2 files are supported.
                </p>

                <Button action={() => loadMHM(humanMesh)}>Load MHM</Button>
                <Button action={() => saveMHM(humanMesh)}>Save MHM</Button>

                <h1>Pose</h1>
                <Button action={() => loadBVH(humanMesh)}>Load BVH</Button>
                <Button action={() => saveBVH(humanMesh)}>Save BVH</Button>

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
                <Button action={() => downloadCollada(humanMesh)}>Export Collada</Button>
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

function downloadCollada(humanMesh: HumanMesh) {
    download.download = "makehuman.dae"
    download.href = URL.createObjectURL(new Blob([exportCollada(humanMesh)], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

function saveMHM(humanMesh: HumanMesh) {
    console.log(`saveMHM`)
    download.download = "makehuman.mhm"
    download.href = URL.createObjectURL(new Blob([humanMesh.morphManager.toMHM()], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

function loadMHM(humanMesh: HumanMesh) {
    upload.accept = ".mhm"
    upload.onchange = async () => {
        if (upload.files?.length === 1) {
            const file = upload.files[0]
            console.log(`file: "${file.name}", size ${file.size} bytes`)
            const buffer = await file.arrayBuffer()
            const te = new TextDecoder()
            const content = te.decode(buffer)
            humanMesh.morphManager.fromMHM(content)
        }
    }
    upload.dispatchEvent(new MouseEvent("click"))
}

function saveBVH(humanMesh: HumanMesh) {
    // const bvh = new BiovisionHierarchy()
    // const data: mat4[] = humanMesh.skeleton.boneslist!.map((bone) => {
    //     const m = mat4.invert(mat4.create(), bone.matPoseGlobal!)
    //     mat4.mul(m, bone.matPose, m)
    //     mat4.mul(m, bone.matRestGlobal!, m)
    //     return m
    // })

    // const animation = new AnimationTrack("makehuman", data, 1, 1 / 24)
    // bvh.fromSkeleton(humanMesh.skeleton, animation, false)
    // const out = bvh.writeToFile()
    const out = fakeSaveData(humanMesh)

    download.download = "makehuman.bvh"
    download.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }))
    download.dispatchEvent(new MouseEvent("click"))
}

// THIS WORKS!!! (SOMETIMES...)
function fakeSaveData(humanMesh: HumanMesh) {
    const skeleton = loadSkeleton(humanMesh, "data/rigs/default.mhskel")
    skeleton.build()
    skeleton.update()

    humanMesh.skeleton.build()
    humanMesh.skeleton.update()

    // this works
    // const bvh0 = new BiovisionHierarchy().fromFile("data/poses/run01.bvh")
    // const ani0 = bvh0.createAnimationTrack(skeleton)

    // console.log(humanMesh.skeleton.roots[0].matPose)

    // this is a total mess, just using bone.matPose is better but not correct
    // hey! i could create a test from it! and move it into a method and cover that one with tests...
    const data = humanMesh.skeleton.getPose()
    const ani0 = new AnimationTrack("makehuman", data, 1, 1 / 24)

    const bvh1 = new BiovisionHierarchy().fromSkeleton(skeleton, ani0, false)
    return bvh1.writeToFile()
}

function loadBVH(humanMesh: HumanMesh) {
    upload.accept = ".bvh"
    upload.onchange = async () => {
        if (upload.files?.length === 1) {
            const file = upload.files[0]
            // console.log(`file: "${file.name}", size ${file.size} bytes`)
            const buffer = await file.arrayBuffer()
            const textDecoder = new TextDecoder()
            const content = textDecoder.decode(buffer)
            const bvh_file = new BiovisionHierarchy().fromFile(file.name, "auto", "onlyroot", content)
            const anim = bvh_file.createAnimationTrack(humanMesh.skeleton)
            humanMesh.skeleton.setPose(anim, 0)
        }
    }
    upload.dispatchEvent(new MouseEvent("click"))
}
