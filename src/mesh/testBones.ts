import { vec3, vec4, mat4 } from 'gl-matrix'

interface Bone {
    name: string,
    matRestGlobal: mat4
    matRestRelative: mat4
    length: number
    yvector4: vec4
    parent: Bone | undefined
    children: Bone[]
}

function makeBone(
    name: string,
    headPos: number[],
    tailPos: number[],
    parent: Bone | undefined = undefined
): Bone {
    const head3 = vec3.fromValues(headPos[0], headPos[1], headPos[2])
    const tail3 = vec3.fromValues(tailPos[0], tailPos[1], tailPos[2])
    const normal = vec3.fromValues(1, 0, 0) // TODO: not sure why 1,0,0 when the other code says 0,1,0 but, whatever...
    let matRestGlobal = getMatrix(head3, tail3, normal)
    const length = vec3.distance(head3, tail3)
    const yvector4 = vec4.fromValues(0, length, 0, 1)
    let matRestRelative: mat4
    if (parent === undefined) {
        matRestRelative = matRestGlobal
    } else {
        matRestRelative =
            mat4.mul(
                mat4.create(),
                mat4.invert(mat4.create(), parent.matRestGlobal),
                matRestGlobal
            )
    }
    const bone = {
        name, matRestGlobal, matRestRelative, length, yvector4, parent, children: []
    }
    if (parent !== undefined) {
        parent.children.push(bone)
    }
    return bone
}

function getMatrix(head: vec3, tail: vec3, normal: vec3): mat4 {
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

const b0 = makeBone("Bone", [0, 0, 0], [0, 0, 1])
const b1 = makeBone("Bone.001", [0, 0, 1], [0, 0, 2], b0)
const b2 = makeBone("Bone.002", [0, 0, 2], [0, 0, 3], b1)

export const testBones = {
    vertex: [
        0, 0.5, 3,
        0, -0.5, 3,
        0, -0.6, 2,
        0, 0.6, 2,
        0, 0.8, 1,
        0, 1, 0,
        0, -0.8, 1,
        0, -1, 0,
    ],
    groups: [{ startIndex: 0, length: 3 * 6 }],
    indices: [
        6, 3, 4,
        6, 5, 7,
        2, 0, 3,
        6, 2, 3,
        6, 4, 5,
        2, 1, 0,
    ],
    human: {
        __skeleton: {
            roots: [b0],
            bones: new Map([
                [b0.name, b0],
                [b1.name, b1],
                [b2.name, b2]
            ]),
            vertexWeights: {
                _data: new Map([
                    [b0.name, [
                        [4, 6],
                        [1, 1]
                    ]],
                    [b1.name, [
                        [2, 3],
                        [.9, .9]
                    ]],
                    [b2.name, [
                        [0, 1],
                        [.8, .8]
                    ]],
                ])
            }
        }
    }
}