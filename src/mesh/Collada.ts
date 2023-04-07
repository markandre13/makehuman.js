import { HumanMesh } from './HumanMesh'
import { BaseMeshGroup } from './BaseMeshGroup'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'
import { OrderedMap } from '../lib/OrderedMap'
import { vec3, vec4, mat4 } from 'gl-matrix'
import { zipForEach } from 'lib/zipForEach'
import { Group } from './Group'
import { VertexBoneWeights } from 'skeleton/VertexBoneWeights'

// Export the human as COLLAborative Design Activity (COLLADA) suitable for import in Blender
// https://en.wikipedia.org/wiki/COLLADA

export interface Material {
    vertex: Float32Array
    indices: number[]
    vertexWeights: VertexBoneWeights
    start: number
    length: number
    name: string
    r: number
    g: number
    b: number
}

export function exportCollada(scene: HumanMesh) {
    let s = scene
    // s = testCube
    const geometry = new Geometry()

    const proxy = scene.proxies.get("Teeth")!


    const materials: Material[] = [
        {
            vertex: scene.vertexMorphed,
            indices: scene.baseMesh.fvertex,
            vertexWeights: scene.skeleton.vertexWeights!,
            start: scene.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            length: scene.baseMesh.groups[BaseMeshGroup.SKIN].length,
            name: "skin", r: 1, g: 0.5, b: 0.5
        }, {
            vertex: scene.vertexMorphed,
            indices: scene.baseMesh.fvertex,
            vertexWeights: scene.skeleton.vertexWeights!,
            start: scene.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex,
            length: scene.baseMesh.groups[BaseMeshGroup.EYEBALL0].length,
            name: "eyeL", r: 0.0, g: 1.0, b: 0.5
        }, {
            vertex: scene.vertexMorphed,
            indices: scene.baseMesh.fvertex,
            vertexWeights: scene.skeleton.vertexWeights!,
            start: scene.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex,
            length: scene.baseMesh.groups[BaseMeshGroup.EYEBALL1].length,
            name: "eyeR", r: 1.0, g: 0.0, b: 0.0
        }, {
            vertex: proxy.getCoords(scene.vertexMorphed),
            indices: proxy.mesh.fvertex,
            vertexWeights: proxy.getVertexWeights(scene.skeleton.vertexWeights!),
            start: 0,
            length: proxy.mesh.fvertex.length,
            name: "teeth", r: 1.0, g: 1.0, b: 1.0
        }, {
            vertex: scene.vertexMorphed,
            indices: scene.baseMesh.fvertex,
            vertexWeights: scene.skeleton.vertexWeights!,
            start: scene.baseMesh.groups[BaseMeshGroup.TOUNGE].startIndex,
            length: scene.baseMesh.groups[BaseMeshGroup.TOUNGE].length,
            name: "tounge", r: 1, g: 0.0, b: 0.0
        }
    ]

    return colladaHead() +
        colladaEffects(materials) +
        colladaMaterials(materials) +
        colladaGeometries(s, geometry, materials) + // mesh
        colladaControllers(s, geometry, materials) + // weights
        colladaVisualScenes(s, materials) + // skeleton
        colladaScene() +
        colladaTail()
}

const sceneName = `Scene`
const objectName = `Human`
const meshName = `${objectName}-mesh`
const meshPositionsName = `${meshName}-positions`
const meshPositionsArrayName = `${meshPositionsName}-array`
const meshVerticesName = `${meshName}-vertices`

const armatureName = `Armature`
const armatureLongName = `${armatureName}_${objectName}`
const skinName = `${armatureLongName}-skin`
const skinJointsName = `${skinName}-joints`
const skinJointsArrayName = `${skinJointsName}-array`
const skinWeightsName = `${skinName}-weights`
const skinWeightsArrayName = `${skinWeightsName}-array`
const skinIbmName = `${skinName}-bind_poses`
const skinIbmArrayName = `${skinIbmName}-array`

// TODO: try to export with meter="1" and Z_UP so that blender doesn't scale and rotate
//       the human. this will simplify the workflow in blender after the import
function colladaHead() {
    return `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <asset>
    <contributor>
      <author>makehuman.js user</author>
      <authoring_tool>https://github.com/markandre13/makehuman.js</authoring_tool>
    </contributor>
    <created>${new Date().toISOString()}</created>
    <modified>${new Date().toISOString()}</modified>
    <unit name="meter" meter="0.1"/>
    <up_axis>Y_UP</up_axis>
  </asset>
  <library_images/>\n`
}

function colladaTail() { return `</COLLADA>` }

function colladaEffects(materials: Material[]) {
    // instead of color:
    // <texture texture="teeth_png-sampler" texcoord="UVMap"/>
    let out = `  <library_effects>\n`
    materials.forEach(m => {
        out += `    <effect id="${m.name}-effect">
      <profile_COMMON>
        <technique sid="common">
          <lambert>
            <emission>
              <color sid="emission">0 0 0 1</color>
            </emission>
            <diffuse>
              <color sid="diffuse">${m.r} ${m.g} ${m.b} 1</color>
            </diffuse>
            <reflectivity>
              <float sid="specular">0.0</float>
            </reflectivity>
          </lambert>
        </technique>
      </profile_COMMON>
    </effect>\n`
    })
    out += `  </library_effects>\n`
    return out
}

function colladaMaterials(materials: Material[]) {
    let out = `  <library_materials>\n`
    materials.forEach(m => {
        out += `    <material id="${m.name}-material" name="${m.name}">
      <instance_effect url="#${m.name}-effect"/>
    </material>\n`
    })
    out += `  </library_materials>\n`
    return out
}

function colladaGeometries(scene: HumanMesh, geometry: Geometry, materials: Material[]) {

    for (let m of materials) {
        prepareMesh(
            m.vertex,
            m.indices,
            m.start,
            m.length,
            geometry)
    }

    // prepareGeometry(scene.vertexMorphed, scene.baseMesh.indices, materials, geometry)

    let out = `  <library_geometries>
    <geometry id="${meshName}" name="${objectName}">
      <mesh>
        <source id="${meshPositionsName}">
          <float_array id="${meshPositionsArrayName}" count="${geometry.vertex.length}">${geometry.vertex.join(" ")}</float_array>
          <technique_common>
            <accessor source="#${meshPositionsArrayName}" count="${geometry.vertex.length / 3}" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <vertices id="${meshVerticesName}">
          <input semantic="POSITION" source="#${meshPositionsName}"/>
        </vertices>\n`
    for (let m = 0; m < materials.length; ++m) {
        out += `        <polylist material="${materials[m].name}-material" count="${geometry.indices[m].length / 4}">
          <input semantic="VERTEX" source="#${meshVerticesName}" offset="0"/>
          <vcount>${"4 ".repeat(geometry.indices[m].length / 4)}</vcount>
          <p>${geometry.indices[m].join(" ")}</p>
        </polylist>\n`
    }
    out += `      </mesh>
    </geometry>
  </library_geometries>\n`
    return out
}

function colladaControllers(scene: HumanMesh, geometry: Geometry, materials: Material[]) {

    const allBoneNames = scene.skeleton.boneslist!.map(bone => bone.name)

    let ibmAll = ""
    scene.skeleton.boneslist!.forEach((bone) => {
        ibmAll += ibm(bone) + " "
    })
    ibmAll = ibmAll.trimEnd()

    const { boneWeightPairs, weightMap } = prepareControllerInit(geometry)
    for (const m of materials) {
        prepareControllerAddBoneWeights(
            m.vertex,
            m.vertexWeights,
            scene.skeleton.bones,
            geometry,
            boneWeightPairs, weightMap
        )

    }

    const weights = prepareControllerFlatWeightMap(weightMap)
    const flatBoneWeightList = prepareControllerFlatBoneWeight(boneWeightPairs)

    return `  <library_controllers>
    <controller id="${skinName}" name="${armatureName}">
      <skin source="#${meshName}">
        <bind_shape_matrix>${mat2txt(identity)}</bind_shape_matrix>
        <source id="${skinJointsName}">
          <Name_array id="${skinJointsArrayName}" count="3">${allBoneNames.join(" ").replace(/\./g, "_")}</Name_array>
          <technique_common>
            <accessor source="#${skinJointsArrayName}" count="${allBoneNames.length}" stride="1">
              <param name="JOINT" type="name"/>
            </accessor>
          </technique_common>
        </source>
        <source id="${skinIbmName}">
          <float_array id="${skinIbmArrayName}" count="${allBoneNames.length * 16}">${ibmAll}</float_array>
          <technique_common>
            <accessor source="#${skinIbmArrayName}" count="${allBoneNames.length}" stride="16">
              <param name="TRANSFORM" type="float4x4"/>
            </accessor>
          </technique_common>
        </source>
        <source id="${skinWeightsName}">
          <float_array id="${skinWeightsArrayName}" count="${weights.length}">${weights.join(" ")}</float_array>
          <technique_common>
            <accessor source="#${skinWeightsArrayName}" count="${weights.length}" stride="1">
              <param name="WEIGHT" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <joints>
          <input semantic="JOINT" source="#${skinJointsName}"/>
          <input semantic="INV_BIND_MATRIX" source="#${skinIbmName}"/>
        </joints>
        <vertex_weights count="${boneWeightPairs.length}">
          <input semantic="JOINT" source="#${skinJointsName}" offset="0"/>
          <input semantic="WEIGHT" source="#${skinWeightsName}" offset="1"/>
          <vcount>${boneWeightPairs.map(e => e.length).join(" ")}</vcount>
          <v>${flatBoneWeightList.join(" ")}</v>
        </vertex_weights>
      </skin>
    </controller>
  </library_controllers>\n`
}

function colladaVisualScenes(scene: HumanMesh, materials: Material[]) {
    let out = `  <library_visual_scenes>
    <visual_scene id="${sceneName}" name="${sceneName}">
      <node id="${armatureName}" name="${armatureName}" type="NODE">
        <matrix sid="transform">${mat2txt(identity)}</matrix>
${dumpBone(armatureName, scene.skeleton.roots[0])}\n`
    // what varies...
    // node: id, name
    // instance_controller: url
    //   ouch: this means each controller as a complete list of bone names and IBMs...
    //   (yeah, checked even with a collada export from blender...
    //   WRONG! we can just have a separate polylist per material within <mesh> and that's it!
    //   see ~/Documents/Blender/experiments/colored-2-bone-cube.dae
    //   real treat will be to grab all the meshes, including proxy meshes, and merge them)
    // instance_material: symbol, target
    out += `        <node id="${objectName}" name="${objectName}" type="NODE">
          <matrix sid="transform">${mat2txt(identity)}</matrix>
          <instance_controller url="#${skinName}">
            <skeleton>#${armatureName}_${scene.skeleton.roots[0].name}</skeleton>
            <bind_material>
              <technique_common>\n`
    // <bind_vertex_input semantic="UVMap" input_semantic="TEXCOORD" input_set="0"/>
    for (let m = 0; m < materials.length; ++m) {
        out += `                <instance_material symbol="${materials[m].name}-material" target="#${materials[m].name}-material"/>\n`
    }

    out += `              </technique_common>
            </bind_material>
          </instance_controller>
        </node>\n`
    out += `      </node>
    </visual_scene>
  </library_visual_scenes>\n`
    return out
}

function colladaScene() {
    return `  <scene>
    <instance_visual_scene url="#${sceneName}"/>
  </scene>\n`
}

// const epsilon = Number.EPSILON * 2.0
const epsilon = 0.000000001

export class Geometry {
    vertex: number[] = []
    indices: number[][] = []
    weights: number[] = []
    private indexMap = new Map<Float32Array, Map<number, number>>()

    getIndex(vertex: Float32Array, index: number) {
        return this.indexMap.get(vertex)?.get(index)
    }

    addPoint(vertex: Float32Array, origIndex: number): number {
        let indexMap = this.indexMap.get(vertex)
        if (indexMap === undefined) {
            indexMap = new Map<number, number>()
            this.indexMap.set(vertex, indexMap)
        }

        let newIndex = indexMap.get(origIndex)
        if (newIndex !== undefined) {
            return newIndex
        }

        newIndex = this.vertex.length / 3
        indexMap.set(origIndex, newIndex)

        const ptr = origIndex * 3
        const p = [vertex[ptr], vertex[ptr + 1], vertex[ptr + 2]]
        this.vertex.push(...p)

        return newIndex
    }
    addMesh() {
        this.indices.push([])
    }
    addQuad(vertex: Float32Array, indices: number[], startIndex: number) {
        const currentMesh = this.indices[this.indices.length - 1]
        currentMesh.push(this.addPoint(vertex, indices[startIndex]))
        currentMesh.push(this.addPoint(vertex, indices[startIndex + 1]))
        currentMesh.push(this.addPoint(vertex, indices[startIndex + 2]))
        currentMesh.push(this.addPoint(vertex, indices[startIndex + 3]))
    }
    getQuad(mesh: number, quad: number) {
        const p0 = this.indices[mesh][quad * 4] * 3
        const p1 = this.indices[mesh][quad * 4 + 1] * 3
        const p2 = this.indices[mesh][quad * 4 + 2] * 3
        const p3 = this.indices[mesh][quad * 4 + 3] * 3

        return [[
            this.vertex[p0],
            this.vertex[p0 + 1],
            this.vertex[p0 + 2]
        ],
        [
            this.vertex[p1],
            this.vertex[p1 + 1],
            this.vertex[p1 + 2]
        ],
        [
            this.vertex[p2],
            this.vertex[p2 + 1],
            this.vertex[p2 + 2]
        ],
        [
            this.vertex[p3],
            this.vertex[p3 + 1],
            this.vertex[p3 + 2]
        ]]
    }
}

export function prepareGeometry(vertex: Float32Array, indices: number[], materials: Material[], geometry: Geometry) {
    for (let m = 0; m < materials.length; ++m) {
        prepareMesh(vertex, indices, materials[m].start, materials[m].length, geometry)
    }
}

export function prepareMesh(vertex: Float32Array, indices: number[], startCoord: number, length: number, geometry: Geometry) {
    const indexEnd = startCoord + length
    geometry.addMesh()
    // the mesh is in quads but converted to triangles for OpenGL. when exporting, revert to quads
    for (let i = startCoord; i < indexEnd; i += 6) {
        geometry.addQuad(vertex, indices, i)
    }
}

// IN:
//   vertexWeights = {
//     <boneName>: [
//       [vertexIndex, ...],
//       [weight, ...]
//     ], ...
//   }
//   geometry
//   scene.skeleton.bones
// OUT:
//   boneWeightPairs = [
//     <vertexIndex>: [
//       [boneIndex, weightIndex], ...
//     ]
//   ]
//   weights = [
//     weightIndex: weight, ...
//   ]
export function prepareControllers(vertex: Float32Array, vertexWeights: VertexBoneWeights, boneMap: Map<string, Bone>, geometry: Geometry) {
    const { boneWeightPairs, weightMap } = prepareControllerInit(geometry)
    prepareControllerAddBoneWeights(vertex, vertexWeights, boneMap, geometry, boneWeightPairs, weightMap)
    const weights = prepareControllerFlatWeightMap(weightMap)

    return { weights, boneWeightPairs }
}

export function prepareControllerInit(geometry: Geometry) {
    let boneWeightPairs = new Array<Array<Array<number>>>(geometry.vertex.length / 3)
    for (let i = 0; i < boneWeightPairs.length; ++i) {
        boneWeightPairs[i] = []
    }
    const weightMap = new Map<number, number>()
    return { boneWeightPairs, weightMap }
}

export function prepareControllerAddBoneWeights(vertex: Float32Array, vertexWeights: VertexBoneWeights,
    boneMap: Map<string, Bone>,
    geometry: Geometry,
    boneWeightPairs: Array<Array<Array<number>>>,
    weightMap: Map<number, number>
) {
    vertexWeights!._data.forEach((boneData, boneName) => {
        const boneIndices = boneData[0] as number[]
        const boneWeights = boneData[1] as number[]
        zipForEach(boneIndices, boneWeights, (_index, weight) => {
            const index = geometry.getIndex(vertex, _index)
            if (index === undefined) {
                // vertex is not used
                return
            }
            let weightIndex = weightMap.get(weight)
            if (weightIndex === undefined) {
                weightIndex = weightMap.size
                weightMap.set(weight, weightIndex)
            }
            boneWeightPairs[index].push([boneMap.get(boneName)!.index, weightIndex])
        })
    })
}

export function prepareControllerFlatWeightMap(weightMap: Map<number, number>) {
    const weights = new Array<number>(weightMap.size)
    weightMap.forEach((index, weight) => { weights[index] = weight })
    return weights
}

export function prepareControllerFlatBoneWeight(boneWeightPairs: Array<Array<Array<number>>>) {
    const flatBoneWeightList: number[] = []
    boneWeightPairs.forEach(vertexData => {
        vertexData.forEach(boneWeightPair =>
            boneWeightPair.forEach(value =>
                flatBoneWeightList.push(value)
            )
        )
    })
    return flatBoneWeightList
}

const identity = mat4.identity(mat4.create())

// create the "bind shape matrix" from the collada spec
function bsm(bone: Bone) {
    return mat2txt(bone.matRestRelative!)
}

// create the "inverse bind pose matrix" from the collada spec
function ibm(bone: Bone) {
    return mat2txt(mat4.invert(mat4.create(), bone.matRestGlobal!))
}

// output mat4 in collada format (translation on the right instead of bottom)
function mat2txt(m: mat4) {
    const map = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]
    let out = ""
    for (let i = 0; i < 16; ++i) {
        const x = m[map[i]]
        out += `${x} `
    }
    return out.trimEnd()
}

function dumpBone(armatureName: string, bone: Bone, indent: number = 4, connectWithParent: boolean = false) {
    const is = indentToString(indent)
    let out = ``
    out += `${is}<node id="${armatureName}_${bone.name.replace(/\./g, "_")}" name="${bone.name}" sid="${bone.name.replace(/\./g, "_")}" type="JOINT">\n`
    out += `${is}  <matrix sid="transform">${bsm(bone)}</matrix>\n`
    out += `${is}  <extra>\n`
    out += `${is}    <technique profile="blender">\n`

    const childrenToConnectWith = new Set<Bone>()
    const tail = vec4.transformMat4(vec4.create(), bone.yvector4!, bone.matRestGlobal!)
    for (let child of bone.children) {
        const childHead = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), child.matRestGlobal!)
        if (vec4.equals(tail, childHead)) {
            childrenToConnectWith.add(child)
        }
    }

    if (connectWithParent) {
        out += `${is}      <connect sid="connect" type="bool">1</connect>\n`
    }
    out += `${is}      <layer sid="layer" type="string">0</layer>\n`
    if (childrenToConnectWith.size === 0) {
        const head = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), bone.matRestGlobal!)
        const boneGlobalVec = vec4.sub(vec4.create(), tail, head)
        out += `${is}      <tip_x sid="tip_x" type="float">${boneGlobalVec[0]}</tip_x>\n`
        out += `${is}      <tip_y sid="tip_y" type="float">${boneGlobalVec[1]}</tip_y>\n`
        out += `${is}      <tip_z sid="tip_z" type="float">${boneGlobalVec[2]}</tip_z>\n`
    }
    out += `${is}    </technique>\n`
    out += `${is}  </extra>\n`
    for (let child of bone.children) {
        out += dumpBone(armatureName, child, indent + 1, childrenToConnectWith.has(child))
    }
    out += `${is}</node>\n`
    return out
}

function indentToString(indent: number): string {
    let indentStr = ""
    for (let i = 0; i < indent; ++i) {
        indentStr += "  "
    }
    return indentStr
}