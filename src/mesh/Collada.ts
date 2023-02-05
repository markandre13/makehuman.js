import { HumanMesh } from '../../src/mesh/HumanMesh'
import { Mesh } from '../../src/Mesh'
import { calculateNormals } from '../../src/lib/calculateNormals'

// COLLAborative Design Activity
// https://en.wikipedia.org/wiki/COLLADA
// https://docs.fileformat.com/3d/dae/
// https://github.com/blender/blender/blob/master/source/blender/io/collada/MeshImporter.cpp

export function exportCollada(scene: HumanMesh) {

    let e = scene.groups[Mesh.SKIN].startIndex + scene.groups[0].length
    let polygons = " "
    for (let i = scene.groups[Mesh.SKIN].startIndex; i < e; ++i) {
        polygons += `${scene.indices[i]} `
    }

    const normals = calculateNormals(scene.vertex, scene.indices)
    let header = `<?xml version="1.0" encoding="utf-8"?>
<COLLADA version="1.4.1" xmlns="http://www.collada.org/2005/11/COLLADASchema">
  <asset>
    <contributor>
      <author>https://github.com/markandre13/makehuman.js</author>
    </contributor>
    <created>${new Date().toISOString()}</created>
    <modified>${new Date().toISOString()}</modified>
    <unit meter="0.1000" name="decimeter"/>
    <up_axis>Y_UP</up_axis>
  </asset>
  <library_geometries>
    <geometry id="skin" name="skin">
      <mesh>
        <source id="skin-position">
          <float_array count="${scene.vertex.length}" id="skin-position-array">
            ${scene.vertex.map(v => `${v}`).join(" ")}
          </float_array>
          <technique_common>
            <accessor count="${scene.vertex.length / 3}" source="#skin-position-array" stride="3">
              <param type="float" name="X"></param>
              <param type="float" name="Y"></param>
              <param type="float" name="Z"></param>
            </accessor>
          </technique_common>
        </source>
        <source id="skin-normals">
          <float_array count="${normals.length}" id="skin-normals-array">
            ${normals.map(v => `${v}`).join(" ")}
          </float_array>
          <technique_common>
            <accessor count="${normals.length / 3}" source="#skin-normals-array" stride="3">
              <param type="float" name="X"></param>
              <param type="float" name="Y"></param>
              <param type="float" name="Z"></param>
            </accessor>
          </technique_common>
        </source>
        <vertices id="skin-vertex">
          <input semantic="POSITION" source="#skin-position"/>
        </vertices>
        <polylist count="${scene.groups[Mesh.SKIN].length}">
          <input offset="0" semantic="VERTEX" source="#skin-vertex"/>
          <input offset="1" semantic="NORMAL" source="#skin-normals"/>
          <vcount>${`3 `.repeat(scene.groups[Mesh.SKIN].length)}</vcount>
          <p>${polygons}</p>
        </polylist>
      </mesh>
    </geometry>
  </library_geometries>
</COLLADA>
`
    return header
}

// we could just create json and then dump it as xml?

// mesh     <library_geometries>
// mesh-skeleton relation <library_controllers>
// skeleton <library_visual_scenes>
