import { Tab } from "toad.js/view/Tab"
import { Button, Checkbox, BooleanModel } from "toad.js"
import { TAB } from "HistoryManager"
import { AnimationTrack, BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { HumanMesh } from "./mesh/HumanMesh"
import { loadSkeleton } from "./skeleton/loadSkeleton"
import { Application, setRenderer } from "Application"
import { RenderHuman } from "render/RenderHuman"
import { exportUSDC } from "mesh/usdc"
import { hexdump } from "lib/hexdump"

const useBlenderProfile = new BooleanModel(true)
const limitPrecision = new BooleanModel(false)
useBlenderProfile.enabled = false
limitPrecision.enabled = false

export default function (props: { app: Application }) {
    const humanMesh = props.app.humanMesh

    return (
        <Tab label="File" value={TAB.EXPORT} visibilityChange={setRenderer(props.app, new RenderHuman())}>
            <div style={{ padding: "10px" }}>
                <h3>Morph</h3>

                <p>
                    <u>NOTE</u>: Only MakeHuman 1.1 and 1.2 files are supported.
                </p>

                <Button action={() => loadMHM(humanMesh)}>Load MHM</Button>
                <Button action={() => saveMHM(humanMesh)}>Save MHM</Button>

                <h3>Pose</h3>
                <Button action={() => loadBVH(humanMesh)}>Load BVH</Button>
                <Button action={() => saveBVH(humanMesh)}>Save BVH</Button>

                <h3>Export USDC</h3>

                <Button action={() => downloadUSDC(humanMesh)}>Export as USDC</Button>
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

function downloadUSDC(humanMesh: HumanMesh) {
    let data: ArrayBuffer
    console.log(`----- 0`)
    try {
    data = exportUSDC(humanMesh)
    } catch (e) {
        console.log(e)
        return
    }

    console.log(`----- 1`)

    if (data.resizable) {
        console.log(`----- 2`)
        const nonresizeableArrayBuffer = new ArrayBuffer(data.byteLength)
        new Uint8Array(nonresizeableArrayBuffer, 0, data.byteLength)
            .set(new Uint8Array(data, 0, data.byteLength))
        console.log(`----- 6`)
        data = nonresizeableArrayBuffer
    }

    const blob = new Blob([data], { type: "application/stream" })
    console.log(`----- 7`)
    download.download = "makehuman.usdc"
    download.href = URL.createObjectURL(blob)
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
