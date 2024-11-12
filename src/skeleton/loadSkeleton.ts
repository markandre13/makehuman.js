import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { Skeleton } from './Skeleton'
import { HumanMesh } from '../mesh/HumanMesh'

export function loadSkeleton(humanMesh: HumanMesh, filename: string) {
    const root = parseSkeleton(
        humanMesh,
        FileSystemAdapter.readFile(filename),
        filename)
    console.log(`Loaded skeleton with ${root.bones.size} bones from file ${filename}`)
    return root
}

export function parseSkeleton(humanMesh: HumanMesh, data: string, filename = 'memory') {
    let json
    try {
        json = JSON.parse(data)
    }
    catch (error) {
        console.log(`Failed to parse JSON in ${filename}:\n${data.substring(0, 256)}`)
        throw error
    }
    return new Skeleton(humanMesh, filename, json)
}

export interface FileInformation {
    name: string
    version: string
    tags?: string[]
    description: string
    copyright: string
    license: string
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