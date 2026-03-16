import { Crate } from "@markandre13/usd.js/crate/Crate"
import { PseudoRoot } from "@markandre13/usd.js/nodes/usd/PseudoRoot"
import { Mesh } from "@markandre13/usd.js/nodes/geometry/Mesh"
import { Xform } from "@markandre13/usd.js/nodes/geometry/Xform"

import { HumanMesh } from "./HumanMesh"

export function exportUSDC(human: HumanMesh): ArrayBuffer {
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

    // xyz: humanMesh.vertexMorphed,
    // fxyz: humanMesh.baseMesh.fxyz,
    // uv: humanMesh.baseMesh.uv,
    // fuv: humanMesh.baseMesh.fuv,
    // vertexWeights: humanMesh.skeleton.vertexWeights!,
    // start: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
    // length: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length,
    // name: "skin", r: 1, g: 0.5, b: 0.5
    
    const mesh = new Mesh(root, "Mesh")
    mesh.blenderDataName = "Mesh"
    mesh.extent = [-1, -1, -1, 1, 1, 1]
    mesh.faceVertexCounts = Array(human.baseMesh.fxyz.length / 4).fill(4)
    mesh.faceVertexIndices = human.baseMesh.fxyz
    // mesh.normals 
    mesh.points = human.vertexMorphed
    // mesh.texCoords
    mesh.subdivisionScheme = "none"

    crate.serialize(pseudoRoot)
    return crate.writer.buffer
}
