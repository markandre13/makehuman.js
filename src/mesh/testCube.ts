import { HumanMesh } from './HumanMesh'
import { vec3, vec4, mat4 } from 'gl-matrix'

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
    vertexMorphed: [
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

    baseMesh: {
        groups: [{ startIndex: 0, length: 3 * 20 }],
        indices: [
            4, 2, 0,  // top    1/2
            // 2, 9, 10, // front  2/4
            // 6, 11, 9, // left   2/4
            // 1, 7, 5,  // bottom 1/2 
            // 0, 10, 8, // right  2/4
            // 4, 8, 11, // back   2/4
            // 11, 1, 5, // back   4/4
            // 8, 3, 1,  // right  4/4
            // 9, 5, 7,  // left   4/4
            // 10, 7, 3, // front  4/4
            4, 6, 2,  // top    2/2
            // 2, 6, 9,  // front  1/4
            // 6, 4, 11, // left   1/4
            // 1, 3, 7,  // bottom 2/2
            // 0, 2, 10, // right  1/4
            // 4, 0, 8,  // back   1/4
            // 11, 8, 1, // back   3/4
            // 8, 10, 3, // right  3/4
            // 9, 11, 5, // left   3/4
            // 10, 9, 7  // front  3/4
        ]
    },
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
