import { Human } from '../Human'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { vec3, mat4 } from 'gl-matrix'
import { Skeleton } from './Skeleton'
import { HumanMesh } from '../mesh/HumanMesh'

export function loadSkeleton(scene: HumanMesh, filename: string) {
    const root = parseSkeleton(
        scene,
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
    console.log(`Loaded skeleton with ${root.bones.size} bones from file ${filename}`)
    return root
}

export function parseSkeleton(scene: HumanMesh, data: string, filename = 'memory') {
    let json
    try {
        json = JSON.parse(data)
    }
    catch (error) {
        console.log(`Failed to parse JSON in ${filename}:\n${data.substring(0, 256)}`)
        throw error
    }
    return new Skeleton(scene, filename, json)
}

export interface FileInformation {
    name: string
    version: string
    tags?: string[]
    description: string
    copyright: string
    license: string
}

function a2vec3(a: number[] | undefined) {
    if (a === undefined) {
        throw Error()
    }
    return vec3.fromValues(a[0], a[1], a[2])
}

export function getMatrix(head: vec3, tail: vec3, normal: vec3): mat4 {
    let bone_direction = vec3.subtract(vec3.create(), tail, head)
    vec3.normalize(bone_direction, bone_direction)
    const norm = vec3.normalize(vec3.create(), normal)
    const z_axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), norm, bone_direction))
    const x_axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), bone_direction, z_axis))
    return mat4.fromValues(
        x_axis[0], x_axis[1], x_axis[2], 0,                         // bone local X axis
        bone_direction[0], bone_direction[1], bone_direction[2], 0, // bone local Y axis
        z_axis[0], z_axis[1], z_axis[2], 0,                         // bone local Z axis
        head[0], head[1], head[2], 1                                // head position as translation
    )
}

// Return the normal of a triangle plane defined between three joint positions,
// using counter-clockwise winding order (right-handed).
export function get_normal(skel: Skeleton, plane_name: string, plane_defs: Map<string, Array<string>>, human: Human | undefined = undefined) {
    if (!plane_defs.has(plane_name)) {
        console.warn(`No plane with name ${plane_name} defined for skeleton.`)
        vec3.fromValues(0, 1, 0)
    }
    if (!human) {
        human = Human.getInstance()
    }
    const joint_names = plane_defs.get(plane_name)!
    const [j1, j2, j3] = joint_names
    const p1 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j1, human)), skel.scale)
    const p2 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j2, human)), skel.scale)
    const p3 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j3, human)), skel.scale)
    const pvec = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p2, p1))
    const yvec = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p3, p2))
    return vec3.normalize(vec3.create(), vec3.cross(vec3.create(), yvec, pvec))
}

// // line 1368
// // Get the position of a joint from the human mesh.
// // This position is determined by the center of the joint helper with the
// // specified name.
// // Note: you probably want to use Skeleton.getJointPosition()
// export function _getHumanJointPosition(human: Human, jointName: string, rest_coord = true): number[] {
//     throw Error(`NOT IMPLEMENTED: _getHumanJointPosition(..., jointName='${jointName}', rest_coord=${rest_coord})`)
//     // if (!jointName.startsWith("joint-")) {
//     //     jointName = "joint-" + jointName
//     // }
//     const fg = human.meshData.getFaceGroup(jointName)
//     if (fg === undefined) {
//         console.warn(`Cannot find position for joint ${jointName}`)
//         console.log(human.meshData)
//         return [0, 0, 0]
//     }
//     console.log(`found face group for joint ${jointName}`)
//     // human.obj.group.get()
//     // fg = human.meshData.getFaceGroup(jointName)
//     // if fg is None:
//     //     log.warning('Cannot find position for joint %s', jointName)
//     //     return np.asarray([0,0,0], dtype=np.float32)
//     // v_idx = human.meshData.getVerticesForGroups([fg.name])
//     // if rest_coord:
//     //     verts = human.getRestposeCoordinates()[v_idx]
//     // else:
//     //     verts = human.meshData.getCoords(v_idx)
//     // return verts.mean(axis=0)
// }