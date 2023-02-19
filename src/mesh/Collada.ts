import { HumanMesh } from './HumanMesh'
import { Mesh } from '../Mesh'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'
import { vec3, vec4, mat4 } from 'gl-matrix'

// COLLAborative Design Activity
// https://en.wikipedia.org/wiki/COLLADA
// https://docs.fileformat.com/3d/dae/
// https://github.com/blender/blender/blob/master/source/blender/io/collada/MeshImporter.cpp

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
                ["Bone", bone000],
                ["Bone.001", bone001]
            ]),
            vertexWeights: {
                _data: new Map([
                    ["Bone", [
                        [1, 3, 5, 7, 8, 9, 19, 11],
                        [1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5]
                    ]],
                    ["Bone.001", [
                        [0, 2, 4, 6, 8, 9, 19, 11],
                        [1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5]
                    ]]
                ])
            }
        }
    }
} as any) as HumanMesh

export function exportCollada(scene: HumanMesh) {
    let s = scene
    // s = testCube

    return colladaHead() +
        colladaGeometries(s) + // mesh
        colladaControllers(s) + // weights
        colladaVisualScenes2(s) + // skeleton
        colladaScene() +
        colladaTail()
}

function colladaHead(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <asset>
    <contributor>
      <author>makehuman.js user</author>
      <authoring_tool>https://github.com/markandre13/makehuman.js</authoring_tool>
    </contributor>
    <created>${new Date().toISOString()}</created>
    <modified>${new Date().toISOString()}</modified>
    <unit name="meter" meter="1"/>
    <up_axis>Z_UP</up_axis>
  </asset>`
}

function colladaTail(): string {
    return `\n</COLLADA>\n`
}

function colladaGeometries(scene: HumanMesh): string {
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

    const normals = calculateNormals(scene.vertex, scene.indices)

    return `
  <library_geometries>
    <geometry id="skin-mesh" name="skin">
      <mesh>
        <source id="skin-mesh-positions">
          <float_array id="skin-mesh-positions-array" count="${maxIndex - minIndex}">
            ${numberRangeToString(scene.vertex, minIndex, maxIndex)}
          </float_array>
          <technique_common>
            <accessor source="#skin-mesh-positions-array" count="${scene.vertex.length / 3}" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <source id="skin-mesh-normals">
          <float_array id="skin-mesh-normals-array" count="${normals.length}">
            ${numberRangeToString(normals, minIndex, maxIndex)}
          </float_array>
          <technique_common>
            <accessor source="#skin-mesh-normals-array" count="${normals.length / 3}" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>

        <vertices id="skin-mesh-vertices">
          <input semantic="POSITION" source="#skin-mesh-positions"/>
        </vertices>

        <triangles count="${scene.groups[meshId].length / 3}">
          <input semantic="VERTEX" source="#skin-mesh-vertices" offset="0"/>
          <input semantic="NORMAL" source="#skin-mesh-normals" offset="0"/>
          <p>${polygons}</p>
        </triangles>

        </mesh>
    </geometry>
  </library_geometries>`
}

interface JointData {
    bone: number[]
    weight: number[]
}

function colladaControllers(scene: HumanMesh): string {
    const vbw = scene.human.__skeleton.vertexWeights!._data
    let boneNames = ""
    let bindMatrices = ""
    let allWeights: number[] = []
    let bar = new Map<number, JointData>()
    let boneCounter = 0
    for (let [name, [vertex, weight]] of vbw) {
        boneNames += `${name.replace(".", "_")} `
        const bone = scene.human.__skeleton.bones.get(name)!
        bindMatrices += matrixToString(mat4.invert(mat4.create(), bone.matRestGlobal!)) + " "
        for (let i = 0; i < vertex.length; ++i) {
            let vertexInfo = bar.get(vertex[i])
            if (vertexInfo === undefined) {
                vertexInfo = {
                    bone: [],
                    weight: []
                }
                bar.set(vertex[i], vertexInfo)
            }
            vertexInfo.bone.push(boneCounter)
            vertexInfo.weight.push(allWeights.length)
            allWeights.push(weight[i])
        }
        ++boneCounter
    }
    let vcount: number[] = []
    let foo: number[] = []
    for (let [vertex, b] of bar) {
        vcount.push(b.bone.length)
        for (let i = 0; i < b.bone.length; ++i) {
            foo.push(b.bone[i])
            foo.push(b.weight[i])
        }
    }

    boneNames = boneNames.trimEnd()
    bindMatrices = bindMatrices.trimEnd()

    return `
    <library_controllers>
      <controller id="human_human_body-skin" name="human">
        <skin source="#skin-mesh">
          <bind_shape_matrix>1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1</bind_shape_matrix>
  
          <!-- JOINTS: list all joints in the skeleton by name -->
          <source id="dariya_dariya_body-skin-joints">
            <Name_array id="dariya_dariya_body-skin-joints-array" count="${vbw.size}">${boneNames}</Name_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-joints-array" count="${vbw.size}" stride="1">
                <param name="JOINT" type="name"/>
              </accessor>
            </technique_common>
          </source>
          
          <!-- INVERSE BIND MATRIX: one inverse 4x4 rest matrix for each of the joints (?) -->
          <source id="dariya_dariya_body-skin-bind_poses">
            <float_array id="dariya_dariya_body-skin-bind_poses-array" count="${vbw.size * 16}">${bindMatrices}</float_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-bind_poses-array" count="${vbw.size}" stride="16">
                  <param name="TRANSFORM" type="float4x4"/>
              </accessor>
            </technique_common>
          </source>
  
          <!-- JOINT + INVERSE BIND MATRIX -->
          <joints>
            <input semantic="JOINT" source="#dariya_dariya_body-skin-joints"/>
            <input semantic="INV_BIND_MATRIX" source="#dariya_dariya_body-skin-bind_poses"/>
          </joints>
  
          <!-- WEIGHTS -->
          <source id="dariya_dariya_body-skin-weights">
            <float_array id="dariya_dariya_body-skin-weights-array" count="${allWeights.length}">${numbersToString(allWeights)}</float_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-weights-array" count="${allWeights.length}" stride="1">
                <param name="WEIGHT" type="float"/>
              </accessor>
            </technique_common>
          </source>
  
          <!-- associate a set of joint-weight pairs with each vertex in the base mesh -->
          <vertex_weights count="${vcount.length}">
            <input semantic="JOINT" source="#dariya_dariya_body-skin-joints" offset="0"/>
            <input semantic="WEIGHT" source="#dariya_dariya_body-skin-weights" offset="1"/>
            <!-- number of joint-weight pairs per vertex in the base mesh -->
            <vcount>${numbersToString(vcount)}</vcount>
            <!-- list of joint-index weight-index pairs -->
            <v>${numbersToString(foo)}</v>
          </vertex_weights>
  
        </skin>
      </controller>
    </library_controllers>`
}

// visual scene in which mesh and skeleton are NOT CONNECTED
function colladaVisualScenes(scene: HumanMesh): string {
    const rootBone = scene.human.__skeleton.roots[0]
    return `
    <library_visual_scenes>
     <visual_scene id="Scene" name="Scene">
 
       <node id="skin" name="skin" type="NODE">
         <matrix sid="transform">
           -1 0 0 0
            0 0 1 0
            0 1 0 0
            0 0 0 1
         </matrix>
         <instance_geometry url="#skin-mesh" name="skin">
         </instance_geometry>
       </node>
 
       <node id="human" name="human" type="NODE">
         <matrix sid="transform">
           -1 0 0 0
            0 0 1 0
            0 1 0 0
            0 0 0 1
         </matrix>
 ${dumpBone(rootBone, 4)}
       </node>
     </visual_scene>
   </library_visual_scenes>`
}

// visual scene in which mesh and skeleton are CONNECTED
function colladaVisualScenes2(scene: HumanMesh): string {
    const rootBone = scene.human.__skeleton.roots[0]
    return `
    <library_visual_scenes>
      <visual_scene id="Scene" name="Scene">
  
        <node id="human" name="human" type="NODE">
          <matrix sid="transform">
             1 0 0 0
             0 1 0 0
             0 0 1 0
             0 0 0 1
          </matrix>
  ${dumpBone(rootBone, 4)}
          <node id="skin" name="skin" type="NODE">
            <matrix sid="transform">
              -1 0 0 0
              0 0 1 0
              0 1 0 0
              0 0 0 1
            </matrix>
            <instance_controller url="#human_human_body-skin">
              <skeleton>#human_${rootBone.name}</skeleton>
            </instance_controller>
          </node>
        </node>
      </visual_scene>
    </library_visual_scenes>`
}

function colladaScene(): string {
    return `
  <scene>
    <instance_visual_scene url="#Scene"/>
  </scene>`
}

export function dumpBone(bone: Bone, indent: number = 0): string {
    const name = bone.name
    const name0 = name.replace(".", "_")
    const indentStr = indentToString(indent)
    let result = `${indentStr}<node id="human_${name0}" name="${name}" sid="${name0}" type="JOINT">\n`
        + `  ${indentStr}<matrix sid="transform">${matrixToString(bone.matRestRelative!)}</matrix>\n`
    for (let child of bone.children) {
        result += dumpBone(child, indent + 1)
    }

    // the extra section allows the Blender Collada importer to get the bones right
    // without the Armature options Fix Leaf Bones, Find Bone CHains and Auto Connect being enabled.
    // (not sure if it replaces all those options...)
    const boneMat = bone.matRestGlobal!
    const boneHead = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), boneMat)
    const boneTail = vec4.transformMat4(vec4.create(), bone.yvector4!, boneMat)
    const boneVec = vec4.sub(vec4.create(), boneTail, boneHead)
    result += `    ${indentStr}<extra>
      ${indentStr}<technique profile="blender">
        ${indentStr}<layer sid="layer" type="string">0</layer>`

    result += `
        ${indentStr}<roll sid="roll" type="float">0</roll>
        ${indentStr}<tip_x sid="tip_x" type="float">${boneVec[0]}</tip_x>
        ${indentStr}<tip_y sid="tip_y" type="float">${boneVec[1]}</tip_y>
        ${indentStr}<tip_z sid="tip_z" type="float">${boneVec[2]}</tip_z>`

    // if (bone.children.length !== 0) {
    //     result += `
    //     ${indentStr}<roll sid="roll" type="float">0</roll>
    //     ${indentStr}<connect sid="connect" type="bool">1</connect>`
    // } else {
    //     result += `
    //     ${indentStr}<roll sid="roll" type="float">0</roll>
    //     ${indentStr}<tip_x sid="tip_x" type="float">${boneVec[0]}</tip_x>
    //     ${indentStr}<tip_y sid="tip_y" type="float">${boneVec[1]}</tip_y>
    //     ${indentStr}<tip_z sid="tip_z" type="float">${boneVec[2]}</tip_z>`
    // }
    result += `
      ${indentStr}</technique>
    ${indentStr}</extra>\n`

    result += `${indentStr}</node>\n`
    return result
}

function indentToString(indent: number): string {
    let indentStr = ""
    for (let i = 0; i < indent; ++i) {
        indentStr += "  "
    }
    return indentStr
}

function matrixToString(matrix: mat4): string {
    const map = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]
    let out = ""
    for (let i = 0; i < 16; ++i) {
        const x = matrix[map[i]]
        // const x = map[i]
        out += `${x} `
    }
    return out.trimEnd()
}

function numbersToString(array: number[]): string {
    return numberRangeToString(array, 0, array.length)
}

function numberRangeToString(array: number[], start: number, end: number): string {
    let result = ""
    for (let i = start; i < end; ++i) {
        result += `${array[i]} `
    }
    return result.trimEnd()
}
