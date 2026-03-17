import { Crate } from "@markandre13/usd.js/crate/Crate"
import { PseudoRoot } from "@markandre13/usd.js/nodes/usd/PseudoRoot"
import { Mesh } from "@markandre13/usd.js/nodes/geometry/Mesh"
import { Xform } from "@markandre13/usd.js/nodes/geometry/Xform"
import { SkelRoot } from "@markandre13/usd.js/nodes/skeleton/SkelRoot"
import { Skeleton } from "@markandre13/usd.js/nodes/skeleton/Skeleton"
import { HumanMesh } from "./HumanMesh"
import { BaseMeshGroup } from "./BaseMeshGroup"

import { Material } from "./Collada"
import { ProxyType } from "../proxy/Proxy"

export function exportUSDC(humanMesh: HumanMesh): ArrayBuffer {

    const proxy = humanMesh.proxies.get(ProxyType.Teeth)!

    const materials: Material[] = [
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length,
            name: "skin", r: 1, g: 0.5, b: 0.5
            // }, {
            //     xyz: humanMesh.vertexMorphed,
            //     fxyz: humanMesh.baseMesh.fxyz,
            //     uv: humanMesh.baseMesh.uv,
            //     fuv: humanMesh.baseMesh.fuv,
            //     vertexWeights: humanMesh.skeleton.vertexWeights!,
            //     start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex,
            //     length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length,
            //     name: "eyeL", r: 0.0, g: 1.0, b: 0.5
            // }, {
            //     xyz: humanMesh.vertexMorphed,
            //     fxyz: humanMesh.baseMesh.fxyz,
            //     uv: humanMesh.baseMesh.uv,
            //     fuv: humanMesh.baseMesh.fuv,
            //     vertexWeights: humanMesh.skeleton.vertexWeights!,
            //     start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex,
            //     length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length,
            //     name: "eyeR", r: 1.0, g: 0.0, b: 0.0
            // }, {
            //     xyz: proxy.getCoords(humanMesh.vertexMorphed),
            //     fxyz: proxy.getMesh().fxyz,
            //     uv: proxy.getMesh().uv,
            //     fuv: proxy.getMesh().fuv,
            //     vertexWeights: proxy.getVertexWeights(humanMesh.skeleton.vertexWeights!),
            //     start: 0,
            //     length: proxy.getMesh().fxyz.length,
            //     name: "teeth", r: 1.0, g: 1.0, b: 1.0
            // }, {
            //     xyz: humanMesh.vertexMorphed,
            //     fxyz: humanMesh.baseMesh.fxyz,
            //     uv: humanMesh.baseMesh.uv,
            //     fuv: humanMesh.baseMesh.fuv,
            //     vertexWeights: humanMesh.skeleton.vertexWeights!,
            //     start: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].startIndex,
            //     length: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].length,
            //     name: "tounge", r: 1, g: 0.0, b: 0.0
        }
    ]

    const crate = new Crate()
    const pseudoRoot = new PseudoRoot(crate)
    pseudoRoot.documentation = "makehuman.js for Blender 5.0"
    pseudoRoot.upAxis = "Z" // makehuman uses Y but Blender seems to ignore it on import
    pseudoRoot.metersPerUnit = 1.0 // ignored by Blender import too???

    const root = new Xform(pseudoRoot, "root")
    root.customData = {
        Blender: {
            generated: true
        }
    }

    // export options:
    // * one mesh per material?
    //   * this might be nicer for tweaking
    //   * how to connect that with the armature and blendshapes?
    //   * 
    // * multiple materials, single mesh
    //   * here we could offer additional materials for nails, the parts of the eye...
    //   * how about space allocations
    // * a combination of the above?
    //   * YES
    //     * clothes should be speparate objects
    //     * eyes (lens, iris, ...), teeths (teeth, gum) should be one object but with separate materials
    //       having all proxies as separate meshes/objects should examines the human easier when creating/teaking
    //       animations, etc.

    // NEXT STEPS:
    // * find out how that would look in USD
    // because i have to learn it anyway...

    //
    // skeleton/armature
    //
    const skelRoot = new SkelRoot(root, "Human")
    const skeleton = new Skeleton(skelRoot, "Skeleton")

    const joints: string[] = []
    const bindTransforms: number[] = []
    const restTransforms: number[] = []
    const blenderBoneLength: number[] = []

    for (const bone of humanMesh.skeleton.boneslist!) {
        let name = bone.name
        for (let parent = bone.parent; parent != undefined; parent = parent.parent) {
            name = `${parent.name}/${name}`
        }
        // remove special characters which break import into Blender
        name = name.replaceAll('.', '_').replaceAll('-', '_')
        joints.push(name)
        bindTransforms.push(...bone.matPoseGlobal!)
        restTransforms.push(...bone.matRestRelative!)
        blenderBoneLength.push(bone.length)
    }
    // console.log(`joints = %o`, joints)
    skeleton.joints = joints
    skeleton.bindTransforms = bindTransforms
    skeleton.restTransforms = restTransforms
    skeleton.blenderBoneLength = blenderBoneLength

    //
    // body/skin etc.
    //
    const preparer = new UsdMeshPreparer(materials)

    const body = new Xform(skelRoot, "Body") // this node won't appear in blender

    const bodyMesh = new Mesh(body, "Body")
    bodyMesh.extent = [-1, -1, -1, 1, 1, 1]

    bodyMesh.faceVertexCounts = Array(preparer.fxyz.length / 4).fill(4)
    bodyMesh.faceVertexIndices = preparer.fxyz
    bodyMesh.points = preparer.xyz
    bodyMesh.subdivisionScheme = "none"

    crate.serialize(pseudoRoot)
    return crate.writer.buffer
}

export class UsdMeshPreparer {
    // map to find duplicate points: key is hex of x,y,z concatenated, value is index in this.xyz
    private pt2idx = new Map<string, number>()
    // points
    xyz: number[] = []
    // quad indices into xyz
    fxyz: number[] = []
    // group indices into fxyz, one per material
    groups: number[][] = []

    constructor(materials: Material[]) {
        for (let m of materials) {
            this.addMaterial(m)
        }
    }
    addMaterial(m: Material) {
        // console.log(`addMaterial(${m.name})`)
        const group: number[] = []
        this.groups.push(group)
        const end = m.start + m.length
        for (let i = m.start; i < end; i += 4) {
            group.push(this.addQuad(m, i))
        }
    }
    /**
     * 
     * @param m 
     * @param index index of quad as index in this.fxyz
     * @returns 
     */
    addQuad(m: Material, index: number) {
        // console.log(`addQuad(${m.name}, ${index})`)
        const idx = this.fxyz.length / 4
        this.fxyz.push(this.addPoint(m, m.fxyz[index]))
        this.fxyz.push(this.addPoint(m, m.fxyz[index + 1]))
        this.fxyz.push(this.addPoint(m, m.fxyz[index + 2]))
        this.fxyz.push(this.addPoint(m, m.fxyz[index + 3]))
        return idx
    }
    /**
     * 
     * @param m 
     * @param index index as stored in m.fxyz
     * @returns 
     */
    addPoint(m: Material, index: number): number {
        let i = index * 3
        const x = m.xyz[i]
        const y = m.xyz[i + 1]
        const z = m.xyz[i + 2]
        const key = `${float32ToHex(x)}${float32ToHex(y)}${float32ToHex(z)}`
        let ptIndex = this.pt2idx.get(key)
        if (ptIndex === undefined) {
            ptIndex = this.xyz.length / 3
            this.pt2idx.set(key, ptIndex)
            this.xyz.push(x, y, z)
        }
        // console.log(`addPoint(${m.name}, ${index}): [${i}](${x}, ${y}, ${z}) -> ${ptIndex}`)
        return ptIndex
    }
}

const datad2h = new Uint8Array(8)
const viewd2h = new DataView(datad2h.buffer)

export function float64ToHex(value: number): string {
    viewd2h.setFloat64(0, value, true)
    let hex = ""
    for (let c of datad2h) {
        hex += c.toString(16).padStart(2, '0')
    }
    return hex
}

const dataf2h = new Uint8Array(4)
const viewf2h = new DataView(dataf2h.buffer)

export function float32ToHex(value: number): string {
    viewf2h.setFloat32(0, value, true)
    let hex = ""
    for (let c of dataf2h) {
        hex += c.toString(16).padStart(2, '0')
    }
    return hex
}
