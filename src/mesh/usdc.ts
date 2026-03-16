import { Crate } from "@markandre13/usd.js/crate/Crate"
import { PseudoRoot } from "@markandre13/usd.js/nodes/usd/PseudoRoot"
import { Mesh } from "@markandre13/usd.js/nodes/geometry/Mesh"
import { Xform } from "@markandre13/usd.js/nodes/geometry/Xform"

import { HumanMesh } from "./HumanMesh"
import { BaseMeshGroup } from "./BaseMeshGroup"

import { Geometry, Material, prepareMesh } from "./Collada"
import { ProxyType } from "../proxy/Proxy";

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
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length,
            name: "eyeL", r: 0.0, g: 1.0, b: 0.5
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length,
            name: "eyeR", r: 1.0, g: 0.0, b: 0.0
        }, {
            xyz: proxy.getCoords(humanMesh.vertexMorphed),
            fxyz: proxy.getMesh().fxyz,
            uv: proxy.getMesh().uv,
            fuv: proxy.getMesh().fuv,
            vertexWeights: proxy.getVertexWeights(humanMesh.skeleton.vertexWeights!),
            start: 0,
            length: proxy.getMesh().fxyz.length,
            name: "teeth", r: 1.0, g: 1.0, b: 1.0
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].length,
            name: "tounge", r: 1, g: 0.0, b: 0.0
        }
    ]
    class UsdMeshPreparer {
        // map to find already stored points
        private pt2idx = new Map<string, number>()
        // points
        xyz: number[] = []
        // quad indices into xyz
        fxyz: number[] = []
        // group indices into fxyz
        groups: number[][] = []

        constructor(materials: Material[]) {
            for (let m of materials) {
                this.addMaterial(m)
            }
        }
        addMaterial(m: Material) {
            const group: number[] = []
            this.groups.push(group)
            const end = m.start + m.length
            for (let i = m.start; i < end; i += 4) {
                group.push(this.addQuad(m, i))
            }
        }
        addQuad(m: Material, index: number) {
            const idx = this.fxyz.length / 4
            this.fxyz.push(this.addPoint(m, 0))
            this.fxyz.push(this.addPoint(m, 1))
            this.fxyz.push(this.addPoint(m, 2))
            this.fxyz.push(this.addPoint(m, 3))
            return idx
        }
        addPoint(m: Material, index: number): number {
            let i = index * 4
            const x = m.xyz[i]
            const y = m.xyz[i + 1]
            const z = m.xyz[i + 2]
            const key = `${x},${y},${z}`
            let ptIndex = this.pt2idx.get(key)
            if (ptIndex === undefined) {
                ptIndex = this.xyz.length / 3
                this.pt2idx.set(key, ptIndex)
                this.xyz.push(x, y, z)
            }
            return ptIndex
        }

    }
    const preparer = new UsdMeshPreparer(materials)



    // merge all the materials into geometry
    const geometry = new Geometry()
    for (let m of materials) {
        prepareMesh(
            m.xyz,
            m.uv,
            m.fxyz,
            m.fuv,
            m.start,
            m.length,
            geometry)
    }

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

    const mesh = new Mesh(root, "Mesh")
    mesh.blenderDataName = "Mesh"
    mesh.extent = [-1, -1, -1, 1, 1, 1]

    // mesh.faceVertexCounts = Array(humanMesh.baseMesh.fxyz.length / 4).fill(4)
    mesh.faceVertexCounts = Array(geometry.indices[0].fxyz.length / 4).fill(4)
    // mesh.faceVertexIndices = humanMesh.baseMesh.fxyz
    mesh.faceVertexIndices = geometry.indices[0].fxyz
    // mesh.normals 
    // mesh.points = humanMesh.vertexMorphed
    mesh.points = geometry.xyz
    // mesh.texCoords
    mesh.subdivisionScheme = "none"

    crate.serialize(pseudoRoot)
    return crate.writer.buffer
}

