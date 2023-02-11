import { HumanMesh } from './HumanMesh'
import { Mesh } from '../Mesh'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'
import { vec4, mat4 } from 'gl-matrix'

// COLLAborative Design Activity
// https://en.wikipedia.org/wiki/COLLADA
// https://docs.fileformat.com/3d/dae/
// https://github.com/blender/blender/blob/master/source/blender/io/collada/MeshImporter.cpp

// not all dae files i have, have a good skeleton when imported into blender
// this ones good: (exported with blender from a makehuman import)
// /Users/mark/Documents/Blender/objects/people/dariya/dariya.dae

// the <extra>...</extra> will allow blender to render the bone as a viewport shape

export function exportCollada(scene: HumanMesh) {
    return colladaHead() +
        colladaGeometries(scene) + // mesh
        colladaControllers(scene) + // weights
        colladaVisualScenes(scene) + // skeleton
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
    let e = scene.groups[Mesh.SKIN].startIndex + scene.groups[0].length
    let polygons = " "
    let maxIndex = Number.MIN_VALUE
    let minIndex = Number.MAX_VALUE
    for (let i = scene.groups[Mesh.SKIN].startIndex; i < e; ++i) {
        const index = scene.indices[i]
        if (maxIndex < index) {
            maxIndex = index
        }
        if (minIndex > index) {
            minIndex = index
        }
        polygons += `${index} `
    }
    ++maxIndex // TODO: this looks like we're compensating for an error somewhere?
    //       also, in some cases '1' is the first element. could this be it?
    //       should minIndex also be incremented?
    //       we could load our test cube from an obj file to be sure!
    minIndex = minIndex * 3
    maxIndex = maxIndex * 3

    const normals = calculateNormals(scene.vertex, scene.indices)

    return `<library_geometries>
    <geometry id="skin-mesh" name="skin">
      <mesh>

        <source id="skin-mesh-positions">
          <float_array id="skin-mesh-positions-array" count="${scene.vertex.length}">
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

        <triangles count="${scene.groups[Mesh.SKIN].length}">
          <input semantic="VERTEX" source="#skin-mesh-vertices" offset="0"/>
          <input semantic="NORMAL" source="#skin-mesh-normals" offset="0"/>
          <p>${polygons}</p>
        </triangles>

        </mesh>
    </geometry>
  </library_geometries>`
}

function colladaControllers(scene: HumanMesh): string {
    return `
    <library_controllers>
      <controller id="human_human_body-skin" name="human">
        <skin source="#skin-mesh">
          <bind_shape_matrix>1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1</bind_shape_matrix>
  
          <!-- JOINTS: list all 124 joints in the skeleton by name -->
          <source id="dariya_dariya_body-skin-joints">
            <Name_array id="dariya_dariya_body-skin-joints-array" count="124">...</Name_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-joints-array" count="124" stride="1">
                <param name="JOINT" type="name"/>
              </accessor>
            </technique_common>
          </source>
          
          <!-- BIND MATRIX: one bind pose 4x4 matrix for each of the 124 joints (124 x 16 = 1984 floats) -->
          <!-- inverse of rest matrix? -->
          <!-- 'bind matrix': convert global coordinate to a joint's local coordinate? -->
          <source id="dariya_dariya_body-skin-bind_poses">
            <float_array id="dariya_dariya_body-skin-bind_poses-array" count="1984">...</float_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-bind_poses-array" count="124" stride="16">
                  <param name="TRANSFORM" type="float4x4"/>
              </accessor>
            </technique_common>
          </source>
  
          <!-- JOINT + BIND MATRIX -->
          <joints>
            <input semantic="JOINT" source="#dariya_dariya_body-skin-joints"/>
            <input semantic="INV_BIND_MATRIX" source="#dariya_dariya_body-skin-bind_poses"/>
          </joints>
  
          <!-- WEIGHTS -->
          <source id="dariya_dariya_body-skin-weights">
            <float_array id="dariya_dariya_body-skin-weights-array" count="40912">...</float_array>
            <technique_common>
              <accessor source="#dariya_dariya_body-skin-weights-array" count="40912" stride="1">
                <param name="WEIGHT" type="float"/>
              </accessor>
            </technique_common>
          </source>
  
          <!-- associate a set of joint-weight pairs with each vertex in the base mesh -->
          <vertex_weights count="13380">
            <input semantic="JOINT" source="#dariya_dariya_body-skin-joints" offset="0"/>
            <input semantic="WEIGHT" source="#dariya_dariya_body-skin-weights" offset="1"/>
            <!-- number of joint-weight pairs per vertex in the base mesh -->
            <vcount>...</vcount>
            <!-- list of joint-index weight-index pairs -->
            <v>...</v>
          </vertex_weights>
  
        </skin>
      </controller>
    </library_controllers>`
}

function colladaVisualScenes(scene: HumanMesh): string {
    return `
    <library_visual_scenes>
     <visual_scene id="Scene" name="Scene">
 
       <node id="skin" name="skin" type="NODE">
         <matrix sid="transform">-1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1</matrix>
         <instance_geometry url="#skin-mesh" name="skin">
         </instance_geometry>
       </node>
 
       <node id="human" name="human" type="NODE">
         <matrix sid="transform">-1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1</matrix>
 ${dumpBone(scene.human.__skeleton.roots[0], 4)}
       </node>
     </visual_scene>
   </library_visual_scenes>`
}

function colladaVisualScenes2(scene: HumanMesh): string {
    const rootBone = scene.human.__skeleton.roots[0]
    return `
    <library_visual_scenes>
      <visual_scene id="Scene" name="Scene">
  
        <!-- if we have an armature, with the mesh as a child, the it is this -->
        <node id="human" name="human" type="NODE">
          <matrix sid="transform">-1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1</matrix>
  ${dumpBone(rootBone, 4)}
          <node id="skin" name="skin" type="NODE">
            <matrix sid="transform">1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1</matrix>
            <!-- #dariya_dariya_body-skin references a controller -->
            <instance_controller url="#human_human_body-skin">
            <skeleton>#human_${rootBone.name}</skeleton>
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
    result += `${indentStr}<extra>
  ${indentStr}<technique profile="blender">
    ${indentStr}<layer sid="layer" type="string">0</layer>
    ${indentStr}<roll sid="roll" type="float">0</roll>
    ${indentStr}<tip_x sid="tip_x" type="float">${boneVec[0]}</tip_x>
    ${indentStr}<tip_y sid="tip_y" type="float">${boneVec[1]}</tip_y>
    ${indentStr}<tip_z sid="tip_z" type="float">${boneVec[2]}</tip_z>
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
        out += `${x} `
    }
    return out.trimEnd()
}

function numberRangeToString(array: number[], start: number, end: number): String {
    let result = ""
    for (let i = start; i <= end; ++i) {
        result += `${array[i]} `
    }
    return result
}
