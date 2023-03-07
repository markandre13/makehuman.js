import { HumanMesh } from './HumanMesh'
import { Mesh } from '../Mesh'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'
import { vec3, vec4, mat4 } from 'gl-matrix'

// Export the human as COLLAborative Design Activity (COLLADA) suitable for import in Blender
// https://en.wikipedia.org/wiki/COLLADA


export function exportCollada(scene: HumanMesh) {
    let s = scene
    // s = testCube

    return colladaHead() +
        colladaEffects() +
        colladaMaterials() +
        colladaGeometries(s) + // mesh
        colladaControllers(s) + // weights
        colladaVisualScenes(s) + // skeleton
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
  <library_images/>
`
}

function colladaTail() { return `</COLLADA>` }

interface Material {
    meshId: Mesh
    name: string
    r: number
    g: number
    b: number
}

const materials: Material[] = [
    { meshId: Mesh.SKIN, name: "skin", r: 1, g: 0.5, b: 0.5 },
    { meshId: Mesh.EYEBALL0, name: "eyeL", r: 0, g: 1, b: 0 },
    { meshId: Mesh.EYEBALL1, name: "eyeR", r: 1, g: 0, b: 0 },
]

function colladaEffects() {
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
    </effect>
`})
    out += `  </library_effects>\n`
    return out
}

function colladaMaterials() {
    let out = `  <library_materials>\n`
    materials.forEach(m => {
        out += `    <material id="${m.name}-material" name="${m.name}">
      <instance_effect url="#${m.name}-effect"/>
    </material>
`})
    out += `  </library_materials>\n`
    return out
}

function colladaGeometries(scene: HumanMesh) {
    const meshId = Mesh.SKIN
    let vertexStart = Number.MAX_VALUE, vertexEnd = Number.MIN_VALUE
    const indexStart = scene.groups[meshId].startIndex
    const indexEnd = indexStart + scene.groups[meshId].length
    for (let i = indexStart; i < indexEnd; ++i) {
        const index = scene.indices[i]
        if (vertexStart > index) {
            vertexStart = index
        }
        if (vertexEnd < index) {
            vertexEnd = index
        }
    }
    ++vertexEnd // range of [vertexStart, vertexEnd[
    vertexStart = vertexStart * 3
    vertexEnd = vertexEnd * 3

    const vertex = scene.vertex.slice(vertexStart, vertexEnd)

    // the mesh is in quads but converted to triangles for OpenGL. when exporting, revert to quads
    const indices: number[] = []
    for (let i = indexStart; i < indexEnd; i += 6) {
        indices.push(scene.indices[i])
        indices.push(scene.indices[i + 1])
        indices.push(scene.indices[i + 2])
        indices.push(scene.indices[i + 3])
    }

    return `  <library_geometries>
    <geometry id="${meshName}" name="${objectName}">
      <mesh>
        <source id="${meshPositionsName}">
          <float_array id="${meshPositionsArrayName}" count="${vertex.length}">${vertex.join(" ")}</float_array>
          <technique_common>
            <accessor source="#${meshPositionsArrayName}" count="${vertex.length / 3}" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <vertices id="${meshVerticesName}">
          <input semantic="POSITION" source="#${meshPositionsName}"/>
        </vertices>
        <polylist material="${materials[0].name}-material" count="${indices.length / 4}">
          <input semantic="VERTEX" source="#${meshVerticesName}" offset="0"/>
          <vcount>${"4 ".repeat(indices.length / 4)}</vcount>
          <p>${indices.join(" ")}</p>
        </polylist>
      </mesh>
    </geometry>
  </library_geometries>
`}

function colladaControllers(scene: HumanMesh) {
    const out = new Array<Array<Array<number>>>(scene.vertex.length / 3)
    for (let i = 0; i < out.length; ++i) {
        out[i] = new Array()
    }

    const allBoneNames: string[] = []
    const allWeights: number[] = []
    let ibmAll = ""

    scene.human.__skeleton.vertexWeights!._data.forEach((data, boneName) => {
        const boneIndex = allBoneNames.length
        allBoneNames.push(boneName)

        const bone = scene.human.__skeleton.bones.get(boneName)!
        ibmAll += ibm(bone) + " "

        const indices = data[0] as number[]
        const weights = data[1] as number[]
        for (let i = 0; i < indices.length; ++i) {
            const index = indices[i]
            const weight = weights[i]
            const weightIndex = allWeights.length
            allWeights.push(weight)
            out[index].push([boneIndex, weightIndex])
        }
    })
    ibmAll = ibmAll.trimEnd()

    const outFlat: number[] = []
    out.forEach(x => {
        x.forEach(y =>
            y.forEach(z =>
                outFlat.push(z)
            )
        )
    })

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
          <float_array id="${skinWeightsArrayName}" count="${allWeights.length}">${allWeights.join(" ")}</float_array>
          <technique_common>
            <accessor source="#${skinWeightsArrayName}" count="${allWeights.length}" stride="1">
              <param name="WEIGHT" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <joints>
          <input semantic="JOINT" source="#${skinJointsName}"/>
          <input semantic="INV_BIND_MATRIX" source="#${skinIbmName}"/>
        </joints>
        <vertex_weights count="${out.length}">
          <input semantic="JOINT" source="#${skinJointsName}" offset="0"/>
          <input semantic="WEIGHT" source="#${skinWeightsName}" offset="1"/>
          <vcount>${out.map(e => e.length).join(" ")}</vcount>
          <v>${outFlat.join(" ")}</v>
        </vertex_weights>
      </skin>
    </controller>
  </library_controllers>
`}

function colladaVisualScenes(scene: HumanMesh) {
    let out = `  <library_visual_scenes>
    <visual_scene id="${sceneName}" name="${sceneName}">
      <node id="${armatureName}" name="${armatureName}" type="NODE">
        <matrix sid="transform">${mat2txt(identity)}</matrix>
${dumpBone(armatureName, scene.human.__skeleton.roots[0])}
`
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
            <skeleton>#${armatureName}_${scene.human.__skeleton.roots[0].name}</skeleton>
            <bind_material>
              <technique_common>
                <instance_material symbol="${materials[0].name}-material" target="#${materials[0].name}-material"/>
              </technique_common>
            </bind_material>
          </instance_controller>
        </node>
`
    out += `      </node>
    </visual_scene>
  </library_visual_scenes>
`
    return out
}

function colladaScene() {
    return `  <scene>
    <instance_visual_scene url="#${sceneName}"/>
  </scene>
`}

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