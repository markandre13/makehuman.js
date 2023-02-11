import { HumanMesh } from './HumanMesh'
import { Mesh } from '../Mesh'
import { Bone } from '../skeleton/Bone'
import { calculateNormals } from '../lib/calculateNormals'

// COLLAborative Design Activity
// https://en.wikipedia.org/wiki/COLLADA
// https://docs.fileformat.com/3d/dae/
// https://github.com/blender/blender/blob/master/source/blender/io/collada/MeshImporter.cpp

// not all dae files i have, have a good skeleton when imported into blender
// this ones good: (exported with blender from a makehuman import)
// /Users/mark/Documents/Blender/objects/people/dariya/dariya.dae

// the <extra>...</extra> will allow blender to render the bone as a viewport shape

export function exportCollada(scene: HumanMesh) {

    // todo:
    // [X] export just the skin vertices
    // [X] export normals
    // [ ] export rig

    // skeleton:
    // <library_visual_scenes>
    //   <visual_scene>
    //    <node name=...>
    //      matrix,translate,rotate
    // mesh-skeleton relation
    // <library_controllers>
    //   <controller>
    //     <skin>
    //       <bind_shape_matrix>

    // a test cube

    // const scene = {
    //     vertex: [
    //          1,  1,  1,
    //          1,  1, -1,
    //          1, -1,  1,
    //          1, -1, -1,
    //         -1,  1,  1,
    //         -1,  1, -1,
    //         -1, -1,  1,
    //         -1, -1, -1
    //     ],
    //     indices: [
    //         4, 2, 0,
    //         2, 7, 3,
    //         6, 5, 7,
    //         1, 7, 5,
    //         0, 3, 1,
    //         4, 1, 5,
    //         4, 6, 2,
    //         2, 6, 7,
    //         6, 4, 5,
    //         1, 3, 7,
    //         0, 2, 3,
    //         4, 0, 1
    //     ],
    //     groups: [{
    //         startIndex: 0,
    //         length: 3 * 12
    //     }]
    // }

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

    function numberRangeToString(array: number[], start: number, end: number) {
        let result = ""
        for (let i = start; i <= end; ++i) {
            result += `${array[i]} `
        }
        return result
    }

    const normals = calculateNormals(scene.vertex, scene.indices)
    let header = `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<!---
    SKIN: startIndex=${scene.groups[Mesh.SKIN].startIndex}, length=${scene.groups[Mesh.SKIN].length}
    min: ${minIndex}
    max: ${maxIndex}
-->
  <asset>
    <contributor>
      <author>makehuman.js user</author>
      <authoring_tool>https://github.com/markandre13/makehuman.js</authoring_tool>
    </contributor>
    <created>${new Date().toISOString()}</created>
    <modified>${new Date().toISOString()}</modified>
    <unit name="meter" meter="1"/>
    <up_axis>Z_UP</up_axis>
  </asset>

  <!-- MESH -->

  <library_geometries>
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
  </library_geometries>
  <library_visual_scenes>
    <visual_scene id="Scene" name="Scene">

      <!-- if we just wanna display the mesh, then it is this -->
<!--
      <node id="skin" name="skin" type="NODE">
        <matrix sid="transform">-1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1</matrix>
        <instance_geometry url="#skin-mesh" name="skin">
        </instance_geometry>
      </node>
-->

      <!-- if we have an armature, with the mesh as a child, the it is this -->
      <node id="human" name="human" type="NODE">
        <matrix sid="transform">0.115475 0 0 0 0 0.115475 0 0 0 0 0.115475 0 0 0 0 1</matrix>
${dumpBone(scene.human.__skeleton.roots[0], 4)}
      </node>
    </visual_scene>
  </library_visual_scenes>
  <scene>
    <instance_visual_scene url="#Scene"/>
  </scene>
</COLLADA>
`
    return header
}

export function dumpBone(bone: Bone, indent: number = 0) {
    const name = bone.name
    const name0 = name.replace(".", "_")

    const map = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]
    let matrix = ""
    for (let i = 0; i < 16; ++i) {
        const x = bone.matRestRelative![map[i]]
        matrix = `${matrix}${x} `
    }
    matrix = matrix.trimEnd()

    let indentStr = ""
    for (let i = 0; i < indent; ++i) {
        indentStr += "  "
    }

    let result = `${indentStr}<node id="dariya_${name0}" name="${name}" sid="${name0}" type="JOINT">\n`
        + `  ${indentStr}<matrix sid="transform">${matrix}</matrix>\n`
    for (let child of bone.children) {
        result += dumpBone(child, indent + 1)
    }
    result += `${indentStr}</node>\n`
    return result
}