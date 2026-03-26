import { Crate } from "@markandre13/usd.js/crate/Crate"
import { PseudoRoot } from "@markandre13/usd.js/nodes/usd/PseudoRoot"
import { Mesh } from "@markandre13/usd.js/nodes/geometry/Mesh"
import { Xform } from "@markandre13/usd.js/nodes/geometry/Xform"
import { Material } from "@markandre13/usd.js/nodes/shader/Material"
import { UVMap } from "@markandre13/usd.js/nodes/shader/blender/UVMap"
import { ImageTexture } from "@markandre13/usd.js/nodes/shader/blender/ImageTexture"
import { PrincipledBSDF } from "@markandre13/usd.js/nodes/shader/blender/PrincipledBSDF"
import { SkelRoot } from "@markandre13/usd.js/nodes/skeleton/SkelRoot"
import { Skeleton } from "@markandre13/usd.js/nodes/skeleton/Skeleton"
import { Scope } from "@markandre13/usd.js/nodes/geometry/Scope"

import { HumanMesh } from "./HumanMesh"
import { BaseMeshGroup } from "./BaseMeshGroup"

import { ProxyType } from "../proxy/Proxy"
import { zipForEach } from "lib/zipForEach"
import { VertexBoneWeights } from "skeleton/VertexBoneWeights"
import { Skeleton as MHSkeleton } from "skeleton/Skeleton"

// TODO
// [ ] export UV maps, same way as Blender 5.1 does (how is that done?)
//   [ ] let material reference image file (how is that done?)
// [X] export other meshes (teeth, tounge, eyes, ...)
//   [ ] update prepareWeights() to work with/without preparer
//   [ ] add function prepareMesh() because we already have prepareWeights()
//   [ ] use the current proxy settings during export
// [ ] adjust export orientation and scale
// [ ] vertexMorphed has the jaw moved. why? that should only be in vertextRigged.

export interface MeshExportDef {
    xyz: ArrayLike<number>
    fxyz: ArrayLike<number>
    uv: ArrayLike<number>
    fuv: ArrayLike<number>
    vertexWeights: VertexBoneWeights
    start: number
    length: number
    name: string
    r: number
    g: number
    b: number,
    texture: string
}

//         this.bodyTexture = new Texture(this, "data/skins/textures/young_caucasian_female_special_suit.png")
// this.eyeTexture = new Texture(this, "data/eyes/materials/green_eye.png")

export function exportUSDC(humanMesh: HumanMesh): ArrayBuffer {

    const proxy = humanMesh.proxies.get(ProxyType.Teeth)!

    const meshesToExport: MeshExportDef[] = [
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length,
            name: "skin", r: 1, g: 0.5, b: 0.5,
            texture: "data/skins/textures/young_caucasian_female_special_suit.png"
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length,
            name: "eyeL", r: 0.0, g: 1.0, b: 0.5,
            texture: "data/skins/textures/young_caucasian_female_special_suit.png"
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length,
            name: "eyeR", r: 1.0, g: 0.0, b: 0.0,
            texture: "data/skins/textures/young_caucasian_female_special_suit.png"
        }, {
            xyz: proxy.getCoords(humanMesh.vertexMorphed),
            fxyz: proxy.getMesh().fxyz,
            uv: proxy.getMesh().uv,
            fuv: proxy.getMesh().fuv,
            vertexWeights: proxy.getVertexWeights(humanMesh.skeleton.vertexWeights!),
            start: 0,
            length: proxy.getMesh().fxyz.length,
            name: "teeth", r: 1.0, g: 1.0, b: 1.0,
            texture: "data/teeth/materials/teeth.png"
        }, {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].length,
            name: "tounge", r: 1, g: 0.0, b: 0.0,
            texture: "data/tongue/tongue01/tongue01_diffuse.png"
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

    const materialRoot = new Scope(root, "_materials")

    //
    // skeleton/armature
    //
    const skelRoot = new SkelRoot(root, "human")
    // NOTE: armature and skeleton mean the same. we use 'armature' so that it
    // appears on top in an alphabetic order
    const skeleton = new Skeleton(skelRoot, "armature")

    const joints: string[] = []
    const bindTransforms: number[] = []
    const restTransforms: number[] = []
    const blenderBoneLength: number[] = []

    for (const bone of humanMesh.skeleton.getBones()) {
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

    for (const meshDef of meshesToExport) {
        const meshRoot = new Xform(skelRoot, meshDef.name) // this node won't appear in blender

        const mesh = new Mesh(meshRoot, meshDef.name)

        // FIXME: calculate actual extent
        // mesh.extent = [-1, -1, -1, 1, 1, 1]

        const preparer = new UsdMeshPreparer(meshDef)
        mesh.faceVertexCounts = Array(preparer.fxyz.length / 4).fill(4)
        mesh.faceVertexIndices = preparer.fxyz
        mesh.points = preparer.xyz
        mesh.texCoords = preparer.uv
        mesh.texIndices = preparer.fuv
        mesh.subdivisionScheme = "none"

        mesh.geomBindTransform = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
        const { elementSize, jointIndices, jointWeights } = prepareWeights(
            humanMesh.skeleton,
            preparer,
            meshDef.vertexWeights
        )
        mesh.jointIndices = { elementSize, indices: jointIndices }
        mesh.jointWeights = { elementSize, indices: jointWeights }
        mesh.skeleton = skeleton

        const material = new Material(materialRoot, meshDef.name)

                const uvmap = new UVMap(material, "uvmap")
        uvmap.infoId = "UsdPrimvarReader_float2"
        uvmap.inputsVarname = "st"

        const imageTexture = new ImageTexture(material, "Image_Texture")
        imageTexture.infoId = "UsdUVTexture"
        imageTexture.file = meshDef.texture
        imageTexture.sourceColorSpace = "sRGB"
        imageTexture.uvCoords = uvmap.outputsResult
        imageTexture.wrapS = "repeat"
        imageTexture.wrapT = "repeat"

        const principledBSDF = new PrincipledBSDF(material, "Principled_BSDF")
        principledBSDF.infoId = "UsdPreviewSurface"
        principledBSDF.clearcoat = 0
        principledBSDF.clearcoatRoughness = 0.03
        // principledBSDF.diffuseColor = [meshDef.r, meshDef.g, meshDef.b]
        principledBSDF.diffuseColor = imageTexture.outputsRGB
        principledBSDF.ior = 1.5
        principledBSDF.metallic = 0
        principledBSDF.opacity = 1
        principledBSDF.roughness = 0.5
        principledBSDF.specular = 0.5

        material.surface = principledBSDF.outputsSurface
        material.blenderDataName = meshDef.name

        mesh.materialBinding = {
            isExplicit: true,
            explicit: [material]
        }
    }

    crate.serialize(pseudoRoot)
    return crate.writer.buffer
}

/**
 * extract subset mesh from material
 */
export class UsdMeshPreparer {
    private xyz_idx2idx = new Map<number, number>()
    private uv_idx2idx = new Map<number, number>()
    // points
    xyz: number[] = []
    // quad indices into xyz
    fxyz: number[] = []

    uv: number[] = []
    fuv: number[] = []

    // group indices into fxyz, one per material
    // groups: number[][] = []

    constructor(material: MeshExportDef) {
        this.addMaterial(material)
    }
    addMaterial(m: MeshExportDef) {
        // console.log(`addMaterial(${m.name})`)
        // const group: number[] = []
        // this.groups.push(group)
        const end = m.start + m.length
        for (let i = m.start; i < end; i += 4) {
            // group.push(this.addQuad(m, i))
            this.addQuad(m, i)
        }
    }
    /**
     * 
     * @param m 
     * @param index index of quad as index in this.fxyz
     * @returns 
     */
    addQuad(m: MeshExportDef, index: number) {
        // console.log(`addQuad(${m.name}, ${index})`)
        // const idx = this.fxyz.length / 4
        this.fxyz.push(this.addXYZ(m, m.fxyz[index]))
        this.fxyz.push(this.addXYZ(m, m.fxyz[index + 1]))
        this.fxyz.push(this.addXYZ(m, m.fxyz[index + 2]))
        this.fxyz.push(this.addXYZ(m, m.fxyz[index + 3]))

        this.fuv.push(this.addUV(m, m.fuv[index]))
        this.fuv.push(this.addUV(m, m.fuv[index + 1]))
        this.fuv.push(this.addUV(m, m.fuv[index + 2]))
        this.fuv.push(this.addUV(m, m.fuv[index + 3]))
        // return idx
    }
    /**
     * 
     * @param m 
     * @param oldIndex index as stored in m.fxyz
     * @returns 
     */
    addXYZ(m: MeshExportDef, oldIndex: number): number {
        let newIndex = this.xyz_idx2idx.get(oldIndex)
        if (newIndex === undefined) {
            newIndex = this.xyz.length / 3
            this.xyz_idx2idx.set(oldIndex, newIndex)
            let i = oldIndex * 3
            this.xyz.push(m.xyz[i], m.xyz[i + 1], m.xyz[i + 2])
        }
        // console.log(`addPoint(${m.name}, ${index}): [${i}](${x}, ${y}, ${z}) -> ${ptIndex}`)
        return newIndex
    }
    /**
     * 
     * @param m 
     * @param oldIndex index as stored in m.fxyz
     * @returns 
     */
    addUV(m: MeshExportDef, oldIndex: number): number {
        let newIndex = this.uv_idx2idx.get(oldIndex)
        if (newIndex === undefined) {
            newIndex = this.uv.length / 2
            this.uv_idx2idx.set(oldIndex, newIndex)
            let i = oldIndex * 2
            this.uv.push(m.uv[i], m.uv[i + 1])
        }
        // console.log(`addPoint(${m.name}, ${index}): [${i}](${x}, ${y}, ${z}) -> ${ptIndex}`)
        return newIndex
    }
    getNewIndex(index: number): number | undefined {
        return this.xyz_idx2idx.get(index)
    }
}

/**
 * prepare vertex weights for USD export
 * 
 * m.vertexWeights._data is organized as
 * 
 * > boneName -> pointIndex[], weightIndex[]
 * 
 * which for USD needs to be converted into
 * 
 * > point -> boneIndex[], weightIndex[]
 * 
 * @param skeleton used to convert bone name in vertexWeights to bone index
 * @param preparer use to map old point index to new point index
 * @param vertexWeights the weights to prepare
 */
function prepareWeights(skeleton: MHSkeleton, preparer: UsdMeshPreparer, vertexWeights: VertexBoneWeights) {
    // prepare intermediate data structure
    const boneWeightPairs = new Array<{ index: number[], weight: number[] }>(preparer.xyz.length / 3)
    for (let i = 0; i < boneWeightPairs.length; ++i) {
        boneWeightPairs[i] = { index: [], weight: [] }
    }

    // prepare weights
    vertexWeights!._data.forEach((boneData, boneName) => {
        const boneIndex = skeleton.getBone(boneName!).index
        const pointIndices = boneData[0]
        const boneWeights = boneData[1]
        zipForEach(pointIndices, boneWeights, (oldPointIndex, weight) => {
            const newPointIndex = preparer.getNewIndex(oldPointIndex)
            if (newPointIndex !== undefined) {
                boneWeightPairs[newPointIndex].index.push(boneIndex)
                boneWeightPairs[newPointIndex].weight.push(weight)
            }
        })
    })

    // copy boneWeightPairs into jointIndices and jointWeights

    let maxJointsPerPoint = 0
    for (const { index } of boneWeightPairs) {
        if (index.length > maxJointsPerPoint) {
            maxJointsPerPoint = index.length
        }
    }

    const jointIndices: number[] = []
    const jointWeights: number[] = []
    for (const { index, weight } of boneWeightPairs) {
        jointIndices.push(...index)
        jointWeights.push(...weight)
        for (let i = index.length; i < maxJointsPerPoint; ++i) {
            jointIndices.push(0)
            jointWeights.push(0)
        }
    }

    return { elementSize: maxJointsPerPoint, jointIndices, jointWeights }
}
