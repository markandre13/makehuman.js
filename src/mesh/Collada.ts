import { HumanMesh } from './HumanMesh'
import { Mesh } from '../Mesh'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'
import { vec3, vec4, mat4 } from 'gl-matrix'

// Export the human as COLLAborative Design Activity (COLLADA) suitable for import in Blender
// https://en.wikipedia.org/wiki/COLLADA

const parentGlobal = mat4.translate(mat4.create(), mat4.identity(mat4.create()), vec3.fromValues(0, 0, -1))
const childGlobal = mat4.translate(mat4.create(), mat4.identity(mat4.create()), vec3.fromValues(0, 0, 0))

const parentRelative = parentGlobal
const childRelative = mat4.mul(
    mat4.create(),
    mat4.invert(mat4.create(), parentGlobal),
    childGlobal
)

const bone001 = {
    name: "Bone.001",
    children: [],
    yvector4: vec4.fromValues(0, 0, 1, 0),
    matRestGlobal: childGlobal,
    matRestRelative: childRelative,
}

const bone000 = {
    name: "Bone",
    children: [bone001],
    yvector4: vec4.fromValues(0, 0, 1, 0),
    matRestGlobal: parentGlobal,
    matRestRelative: parentRelative,
}

//
//         4____________ 0
//        /            /|
//       /            / |
//     6/___________2/  |
//      |   11       | /|8 
//     9|__________10|/ |
//      |  5         | / 1
//      |____________|/
//     7             3 
//  z  y
//  ^ /
//  |/
//  +-->x

export const testCube = ({
    vertex: [
        1, 1, 1,
        1, 1, -1,
        1, -1, 1,
        1, -1, -1,
        -1, 1, 1,
        -1, 1, -1,
        -1, -1, 1,
        -1, -1, -1,
        1, 1, 0,
        -1, -1, 0,
        1, -1, 0,
        -1, 1, 0
    ],
    groups: [{ startIndex: 0, length: 3 * 20 }],
    indices: [
        4, 2, 0,  // top    1/2
        2, 9, 10, // front  2/4
        6, 11, 9, // left   2/4
        1, 7, 5,  // bottom 1/2 
        0, 10, 8, // right  2/4
        4, 8, 11, // back   2/4
        11, 1, 5, // back   4/4
        8, 3, 1,  // right  4/4
        9, 5, 7,  // left   4/4
        10, 7, 3, // front  4/4
        4, 6, 2,  // top    2/2
        2, 6, 9,  // front  1/4
        6, 4, 11, // left   1/4
        1, 3, 7,  // bottom 2/2
        0, 2, 10, // right  1/4
        4, 0, 8,  // back   1/4
        11, 8, 1, // back   3/4
        8, 10, 3, // right  3/4
        9, 11, 5, // left   3/4
        10, 9, 7  // front  3/4
    ],
    human: {
        __skeleton: {
            roots: [bone000],
            bones: new Map([
                [bone000.name, bone000],
                [bone001.name, bone001]
            ]),
            vertexWeights: {
                _data: new Map([
                    [bone000.name, [
                        [1, 3, 5, 7, 8, 9, 10, 11],
                        [1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5]
                    ]],
                    [bone001.name, [
                        [0, 2, 4, 6, 8, 9, 10, 11],
                        [1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5]
                    ]]
                ])
            }
        }
    }
} as any) as HumanMesh

const boneRectM0 = mat4.translate(
    mat4.create(),
    mat4.identity(mat4.create()),
    vec3.fromValues(0, 0, 0)
)

const boneRectM1 = mat4.translate(
    mat4.create(),
    mat4.identity(mat4.create()),
    vec3.fromValues(0, 1, 0)
)

const boneRect1 = {
    name: "Bone.001",
    children: [],
    yvector4: vec4.fromValues(0, 1, 0, 0),
    matRestGlobal: boneRectM0,
    matRestRelative: boneRectM0,
}

const boneRect0 = {
    name: "Bone.000",
    children: [],
    yvector4: vec4.fromValues(0, 1, 0, 0),
    matRestGlobal: boneRectM1,
    matRestRelative: boneRectM1,
}

export const testRect = ({
    vertex: [
        0, 1, 1,
        0, 1, -1,
        0, -1, -1,
        0, -1, 1,
    ],
    groups: [{ startIndex: 0, length: 3 * 2 }],
    indices: [
        0, 1, 2,
        2, 3, 0
    ],
    human: {
        __skeleton: {
            roots: [boneRect0],
            bones: new Map([
                [boneRect0.name, boneRect0],
                // [boneRect1.name, boneRect1],
            ]),
            vertexWeights: {
                _data: new Map([
                    [boneRect0.name, [
                        [0, 1, 2, 3],
                        [1, 1, 1, 1]
                    ]],
                    // [boneRect1.name, [
                    //     [],
                    //     []
                    // ]],
                ])
            }
        }
    }
} as any) as HumanMesh

export function exportCollada(scene: HumanMesh) {
    let s = scene
    // s = testCube
    // s = testRect

    return colladaHead() +
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

function colladaGeometries(scene: HumanMesh) {
    const meshId = Mesh.SKIN
    let polygons = " "
    let maxIndex = Number.MIN_VALUE
    let minIndex = Number.MAX_VALUE
    const startIndex = scene.groups[meshId].startIndex
    const endIndex = startIndex + scene.groups[meshId].length
    for (let i = startIndex; i < endIndex; ++i) {
        const index = scene.indices[i]
        if (maxIndex < index) {
            maxIndex = index
        }
        if (minIndex > index) {
            minIndex = index
        }
        polygons += `${index} `
    }
    polygons = polygons.trim()
    ++maxIndex // range of [minIndex, maxIndex[
    minIndex = minIndex * 3
    maxIndex = maxIndex * 3

    const indices = scene.indices.slice(startIndex, endIndex)
    const vertex = scene.vertex.slice(minIndex, maxIndex)

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
        <triangles count="${indices.length / 3}">
          <input semantic="VERTEX" source="#${meshVerticesName}" offset="0"/>
          <p>${indices.join(" ")}</p>
        </triangles>
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
    return `  <library_visual_scenes>
    <visual_scene id="${sceneName}" name="${sceneName}">
      <node id="${armatureName}" name="${armatureName}" type="NODE">
        <matrix sid="transform">${mat2txt(identity)}</matrix>
${dumpBone(armatureName, scene.human.__skeleton.roots[0])}
        <node id="${objectName}" name="${objectName}" type="NODE">
          <matrix sid="transform">${mat2txt(identity)}</matrix>
          <instance_controller url="#${skinName}">
            <skeleton>#${armatureName}_${scene.human.__skeleton.roots[0].name}</skeleton>
          </instance_controller>
        </node>
      </node>
    </visual_scene>
  </library_visual_scenes>
`}

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

function dumpBone(armatureName: string, bone: Bone, indent: number = 4) {
    const is = indentToString(indent)
    let out = ``
    out += `${is}<node id="${armatureName}_${bone.name.replace(/\./g, "_")}" name="${bone.name}" sid="${bone.name.replace(/\./g, "_")}" type="JOINT">\n`
    out += `${is}  <matrix sid="transform">${bsm(bone)}</matrix>\n`
    out += `${is}  <extra>\n`
    out += `${is}    <technique profile="blender">\n`

    // the trouble with the left foot is this: it is connected to the small toe
    // * check if the tail overlaps with the head of all children
    // * if not
    //   * children must not use <connect>
    //   * tip must be set
    if (bone.name === "foot.L") {
        console.log("I AM AT THE LEFT FOOT")
    }

    if (bone.parent !== undefined) {
        out += `${is}      <connect sid="connect" type="bool">1</connect>\n`
    }
    out += `${is}      <layer sid="layer" type="string">0</layer>\n`
    if (bone.children.length === 0) {
        const boneMat = bone.matRestGlobal!
        const boneHead = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), boneMat)
        const boneTail = vec4.transformMat4(vec4.create(), bone.yvector4!, boneMat)
        const boneVec = vec4.sub(vec4.create(), boneTail, boneHead)
        out += `${is}      <tip_x sid="tip_x" type="float">${boneVec[0]}</tip_x>\n`
        out += `${is}      <tip_y sid="tip_y" type="float">${boneVec[1]}</tip_y>\n`
        out += `${is}      <tip_z sid="tip_z" type="float">${boneVec[2]}</tip_z>\n`
    }
    out += `${is}    </technique>\n`
    out += `${is}  </extra>\n`
    for (let child of bone.children) {
        out += dumpBone(armatureName, child, indent + 1)
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