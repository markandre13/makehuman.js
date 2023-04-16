import { FileSystemAdapter } from "filesystem/FileSystemAdapter"

// When exporting to Collada, I currently merge everything into a single mesh
// and separate by Material, so that I only need to export one skeleton.
// While this renders find in Blender, it confuses Blender's UV editor and
// only the UV for the 1st material will be displayed correctly.
//
// Deleting the Skin part of the mesh resulted the next materials UVs to be
// displayed correctly in Blenders UV editor.
//
// At 1st I believed that my export was wrong, so the function in here
// loads the Collada and renders the UV. And it looked correct.
//
// One note on textures:
// * Skins are stored in
//   /data/skin/textures/(young|middleage|old)\_(dark|light)skinned\_(fe)male\_diffuse(|2|3).png
//   /data/skin/textures/young_caucasia_(fe)male_special_suit.png
// * UV Layout
//   * Makehuman 1.x.x neck connects to head
//   * Makehuman 0.9.x neck connects to body
//   * MB-Lab totally different (texture is symmetrical and uses the space more economically)

export function debugUV() {
    const filename = "data/makehuman.dae"
    const data = new DOMParser().parseFromString(FileSystemAdapter.getInstance().readFile(filename), "text/xml")
    const uv = data
        .querySelector("#Human-mesh-texcoords-array")!
        .innerHTML
        .split(" ")
        .filter(f => f.length > 0)
        .map(f => parseFloat(f))
    // skin-material
    // teeth-material
    const teeth = data
        .querySelector("polylist[material=teeth-material] > p")!
        .innerHTML
        .split(" ")
        .filter(f => f.length > 0)
        .map(f => parseFloat(f))

    let minX, maxX, minY, maxY
    minX = maxX = uv[teeth[0]]
    minY = maxY = uv[teeth[0] + 1]
    for (let i = 1; i < teeth.length; ++i) {
        let idx = teeth[i] * 2
        const x = uv[idx]
        const y = uv[idx + 1]
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minX, y)
        maxY = Math.max(maxY, y)
    }
    console.log(`teeth X: ${minX} : ${maxX}; Y: ${minY} : ${maxY}`)

    document.body.replaceChildren(
        ...<>
            <h1>UV</h1>
            <svg width={1024} height={1024} style={{ border: "#fff 1px solid" }}>
                {...drawQuads(teeth, uv)}
            </svg>
        </>
    )
}

function drawQuads(faces: number[], uv: number[]) {
    let r = []
    const w = 1024
    const h = 1024
    for (let i = 0; i < faces.length / 2; i += 4) {
        let idx0 = faces[i * 2 + 1] * 2
        let idx1 = faces[i * 2 + 3] * 2
        let idx2 = faces[i * 2 + 5] * 2
        let idx3 = faces[i * 2 + 7] * 2
        let x0 = uv[idx0] * w
        let y0 = h - uv[idx0 + 1] * h
        let x1 = uv[idx1] * w
        let y1 = h - uv[idx1 + 1] * h
        let x2 = uv[idx2] * w
        let y2 = h - uv[idx2 + 1] * h
        let x3 = uv[idx3] * w
        let y3 = h - uv[idx3 + 1] * h
        r.push(<line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" />)
        r.push(<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" />)
        r.push(<line x1={x2} y1={y2} x2={x3} y2={y3} stroke="#fff" />)
        r.push(<line x1={x3} y1={y3} x2={x0} y2={y0} stroke="#fff" />)
    }
    return r
}
