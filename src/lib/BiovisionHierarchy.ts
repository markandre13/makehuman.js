
// Import Biovision Hierarchy character animation file
// https://en.wikipedia.org/wiki/Biovision_Hierarchy

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { mat4 } from "gl-matrix"
import { StringToLine } from "./StringToLine"

export class BiovisionHierarchy {
    name: string
    bvhJoints: BVHJoint[] = [] // joints in order of definition, used for parsing the motion data
    joints = new Map<string, BVHJoint>() // joint name to joint
    // jointslist: BVHJoint[] // breadth-first list of all joints
    rootJoint!: BVHJoint
    frameCount!: number
    frameTime!: number

    lineNumber = 0

    constructor(filename: string, data?: string) {
        this.name = filename
        if (data === undefined) {
            data = FileSystemAdapter.getInstance().readFile(filename)
        }

        const reader = new StringToLine(data)
        let joint!: BVHJoint

        let state = 0

        for (let line of reader) {
            ++this.lineNumber
            line = line.trim()
            const tokens = line.split(/\s+/)
            // console.log(`state = ${state}, joint = ${joint?.name}`)
            // console.log(tokens)
            switch (state) {
                case 0:
                    this.expect(tokens, 'HIERARCHY', 0)
                    state = 1
                    break
                case 1:
                    this.expect(tokens, 'ROOT', 1)
                    joint = this.addRootJoint(tokens[1])
                    state = 2
                    break
                case 2: // start joint
                    this.expect(tokens, '{', 0)
                    state = 3
                    break
                case 3:
                    this.expect(tokens, 'OFFSET', 3)
                    this.__calcPosition(joint, [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
                    state = 4
                    break
                case 4:
                    this.expect(tokens, 'CHANNELS')
                    const nChannels = parseInt(tokens[1])
                    joint.channels = tokens.slice(2)
                    if (nChannels !== joint.channels.length) {
                        throw Error(`Expected ${nChannels} but got ${joint.channels.length} at line ${this.lineNumber}.`)
                    }
                    state = 5
                    break
                case 5:
                    switch (tokens[0]) {
                        case "JOINT": {
                            const child = new BVHJoint(tokens[1])
                            this.bvhJoints.push(child)
                            this.joints.set(child.name, child)
                            joint.children.push(child)
                            child.parent = joint
                            joint = child
                            state = 2
                        } break
                        case "End": // Site
                            state = 6
                            break
                        case "}":
                            if (joint.parent === undefined) {
                                state = 9
                            } else {
                                joint = joint.parent
                            }
                            break
                        default:
                            // console.log(tokens)
                            throw Error(`Expected keywords 'JOINT', 'End' or '}' in BVH file at line ${this.lineNumber}.`)
                    }
                    break
                case 6:
                    this.expect(tokens, '{', 0)
                    state = 7
                    break
                case 7: {
                    this.expect(tokens, 'OFFSET', 3)
                    const child = new BVHJoint("End effector")
                    this.bvhJoints.push(child)
                    joint.children.push(child)
                    child.parent = joint
                    child.channels = []
                    this.__calcPosition(child, [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
                    state = 8
                } break
                case 8:
                    this.expect(tokens, '}', 0)
                    state = 5
                    break
                // MOTION
                case 9:
                    this.expect(tokens, 'MOTION', 0)
                    state = 10
                    break
                case 10:
                    this.expect(tokens, 'Frames:', 1)
                    this.frameCount = parseInt(tokens[1])
                    state = 11
                    break
                case 11:
                    this.expect(tokens, 'Frame', 2) // Time:
                    this.frameTime = parseFloat(tokens[2])
                    state = 12
                    break
                case 12: {
                    if (tokens.length === 1 && tokens[0].length === 0) {
                        state = 13
                        break
                    }
                    if (tokens.length === 0) {
                        state = 13
                        break
                    }
                    let idx = 0
                    for(const joint of this.bvhJoints) {
                        for(let j = 0; j < joint.channels.length; ++j) {
                            if (idx >= tokens.length) {
                                throw Error(`Not enough MOTION entries in line ${this.lineNumber}.`)
                            }
                            joint.frames.push(parseFloat(tokens[idx++]))
                        }
                    }
                } break
                case 13:
                    break
                default:
                    throw Error(`Unexpected state ${state}`)
            }
        }
    }

    expect(tokens: string[], keyword: string, nargs: number | undefined = undefined) {
        if ((nargs === undefined && tokens.length < 1) || tokens[0] !== keyword) {
            throw Error(`Expected keyword '${keyword}' in BVH file at line ${this.lineNumber}.`)
        }
        if ((nargs !== undefined && tokens.length !== nargs + 1) || tokens[0] !== keyword) {
            throw Error(`Expected keyword '${keyword}' in BVH file at line ${this.lineNumber}.`)
        }
    }

    addRootJoint(name: string) {
        this.rootJoint = this.__addJoint(name)
        return this.rootJoint
    }

    addJoint(name: string) {
        return
    }

    __addJoint(name: string) {
        const joint = new BVHJoint(name)
        if (joint.name !== "End effector") {
            this.joints.set(name, joint)
        }
        this.bvhJoints.push(joint)
        return joint
    }

    __calcPosition(joint: BVHJoint, offset: number[]) {
        joint.offset = offset
        if (joint.parent === undefined) {
            joint.position = offset
        } else {
            joint.position = [...offset]
            joint.parent.position.forEach((v, i) => joint.position[i] += v)
        }
    }
}

class BVHJoint {
    name: string

    parent?: BVHJoint
    children: BVHJoint[] = []

    offset!: number[]
    position!: number[]
    matRestRelative!: mat4
    matRestGlobal!: mat4

    channels!: string[]
    frames: any[] = []

    constructor(name: string) {
        this.name = name
    }
}
