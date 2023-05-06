
// Import Biovision Hierarchy character animation file
// https://en.wikipedia.org/wiki/Biovision_Hierarchy

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { mat4 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { StringToLine } from "./StringToLine"

export type TranslationType = "all" | "onlyroot" | "none"

export class BiovisionHierarchy {
    name: string
    bvhJoints: BVHJoint[] = [] // joints in order of definition, used for parsing the motion data
    joints = new Map<string, BVHJoint>() // joint name to joint
    jointslist: BVHJoint[] = [] // breadth-first list of all joints
    rootJoint!: BVHJoint
    frameCount!: number
    frameTime!: number

    // Set to true to convert the coordinates from a Z-is-up coordinate system.
    // Most motion capture data uses Y-is-up, though.
    convertFromZUp: boolean = false // TODO: set during load
    // joints to accept translation animation data for
    allowTranslation: TranslationType

    lineNumber = 0

    constructor(filename: string, convertFromZUp: "auto" | true | false = "auto", allowTranslation: TranslationType = "onlyroot", data?: string) {
        this.name = filename
        this.allowTranslation = allowTranslation

        let autoAxis
        if (convertFromZUp === "auto") {
            autoAxis = true
        } else {
            autoAxis = false
            this.convertFromZUp = convertFromZUp
        }

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
                            const child = new BVHJoint(tokens[1], this)
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
                    const child = new BVHJoint("End effector", this)
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
                    if (autoAxis) {
                        this.convertFromZUp = this._autoGuessCoordinateSystem()
                        // if (this.convertFromZUp) {
                        //     // Conversion needed: convert from Z-up to Y-up
                        //     throw Error(`Conversion needed: convert from Z-up to Y-up`)
                        // }
                    }
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
                    for (const joint of this.bvhJoints) {
                        for (let j = 0; j < joint.channels.length; ++j) {
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

        // create breadth first array of joints
        this.jointslist = [this.rootJoint]
        let queueIdx = 0
        while (queueIdx < this.jointslist.length) {
            const joint = this.jointslist[queueIdx++]
            this.jointslist.push(...joint.children)
        }

        // transform frame data into transformation matrices for all joints
        for (const joint of this.jointslist) {
            joint.calculateFrames() // TODO we don't need to calculate pose matrices for end effectors
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
        const joint = new BVHJoint(name, this)
        if (joint.name !== "End effector") {
            this.joints.set(name, joint)
        }
        this.bvhJoints.push(joint)
        return joint
    }

    /**
     *  Guesses whether this BVH rig uses a Y-up or Z-up axis system, using the
     * joint offsets of this rig (longest direction is expected to be the height).
     * Requires joints of this BVH skeleton to be initialized.
     * Returns False if no conversion is needed (BVH file uses Y-up coordinates),
     * returns True if BVH uses Z-up coordinates and conversion is needed.
     * Note that coordinate system is expected to be right-handed.
     */
    _autoGuessCoordinateSystem() {
        let ref_joint = undefined
        const ref_names = ['head', 'spine03', 'spine02', 'spine01', 'upperleg02.L', 'lowerleg02.L']
        while(ref_joint === undefined && ref_names.length != 0) {
            const joint_name = ref_names.pop()!
            ref_joint = this.joints.get(joint_name)
            if (ref_joint === undefined) {
                ref_joint = this.joints.get(joint_name.substring(0,1).toUpperCase() + joint_name.substring(1))
            }
            if (ref_joint !== undefined && ref_joint.children.length === 0) {
                console.log(`Cannot use reference joint ${ref_joint.name} for determining axis system, it is an end-effector (has no children)`)
                ref_joint = undefined
            }
            if (ref_joint === undefined) {
                console.log(`Could not auto guess axis system for BVH file ${this.name} because no known joint name is found. Using Y up as default axis orientation.`)
                return false
            }
            const tail_joint = ref_joint.children[0]
            const direction = [
                0,
                tail_joint.position[1] - ref_joint.position[1],
                tail_joint.position[2] - ref_joint.position[2],
            ]
            if (Math.abs(direction[1]) > Math.abs(direction[2])) {
                // Y-up
                return false
            } else {
                // Z-up
                return true
            }
        }
        return true
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

    createAnimationTrack(skel?: string[] | Skeleton, name?: string): mat4[] {

        function _bvhJointName(boneName: string | undefined) {
            // Remove the tail from duplicate bone names (added by the BVH parser)
            if (boneName === undefined) {
                return boneName
            }
            const r = boneName.match(/(.*)_\d+$/)
            if (r !== null) {
                return r[1]
            }
            return boneName
        }

        function _createAnimation(jointsData: mat4[], name: string, frameTime: number, nFrames: number) {
            const nJoints = jointsData.length / nFrames
            const result: mat4[] = Array(jointsData.length)
            let outIdx = 0
            for (let f = 0; f < nFrames; ++f) {
                for (let j = 0; j < nJoints; ++j) {
                    result[outIdx] = jointsData[f + j * nFrames]
                    ++outIdx
                }
            }
            return result
        }

        if (name === undefined) {
            name = this.name
        }
        if (skel === undefined) {
            throw Error(`skel === undefined: not implemented yet`)
        }
        if (skel instanceof Array) {
            throw Error(`skel === string[]: not implemented yet`)
        }

        // map matrixPoses to skel's breadth-first order bones list, one frame after another
        let jointsData: mat4[] = []
        for (const bone of skel.getBones()) {
            if (bone.reference_bones.length > 0) {
                throw Error(`bone with reference_bones not implemented yet`)
            } else {
                // Map bone to joint by bone name
                const jointName = _bvhJointName(bone.name)!
                const joint = this.getJointByCanonicalName(jointName)
                if (joint !== undefined) {
                    if (joint.matrixPoses.length !== this.frameCount) {
                        throw Error("yikes")
                    }
                    jointsData.push(...joint.matrixPoses)
                } else {
                    const emptyTrack = new Array(this.frameCount)
                    emptyTrack.fill(mat4.create())
                    jointsData.push(...emptyTrack)
                }
            }
        }
        return _createAnimation(jointsData, name, this.frameTime, this.frameCount)
    }

    getJoint(name: string): BVHJoint | undefined {
        return this.joints.get(name)
    }

    getJointByCanonicalName(canonicalName: string): BVHJoint | undefined {
        canonicalName = canonicalName.toLowerCase().replace(' ', '_').replace('-', '_')
        for (const jointName of this.joints.keys()) {
            if (canonicalName === jointName.toLowerCase().replace(' ', '_').replace('-', '_'))
                return this.getJoint(jointName)
        }
        return undefined
    }
}

export class BVHJoint {
    name: string

    skeleton: BiovisionHierarchy
    parent?: BVHJoint
    children: BVHJoint[] = []

    offset!: number[]
    position!: number[]

    rotOrder!: string
    // matRestRelative!: mat4
    // matRestGlobal!: mat4
    matrixPoses: mat4[] = [] // list of 4x4 pose matrices for n frames, relative parent and own rest pose

    channels!: string[]
    frames: any[] = []

    constructor(name: string, skeleton: BiovisionHierarchy) {
        this.name = name
        this.skeleton = skeleton
    }

    calculateFrames() {
        const nChannels = this.channels.length
        const nFrames = this.skeleton.frameCount
        const dataLen = nFrames * nChannels
        if (this.frames.length < dataLen) {
            console.log(`Frame data: ${this.frames}`)
            throw new Error(`Expected frame data length for joint ${this.name} is ${dataLen} found ${this.frames.length}`)
        }

        let rotOrder = ""
        let rotAngles: number[][] = []
        let rXs: number[] | undefined, rYs: number[] | undefined, rZs: number[] | undefined

        function sub(array: number[], offset: number, total: number, width: number): number[] {
            const arrayOut = new Array<number>(total / width)
            for (let idxIn = offset, idxOut = 0; idxIn < total; idxIn += width, ++idxOut) {
                arrayOut[idxOut] = array[idxIn]
            }
            return arrayOut
        }
        function neg(array: number[]): number[] {
            for (let i = 0; i < array.length; ++i) {
                array[i] = -array[i]
            }
            return array
        }
        function mul(a: number, array: number[]): number[] {
            for (let i = 0; i < array.length; ++i) {
                array[i] = a * array[i]
            }
            return array
        }

        const D = Math.PI / 180
        this.channels.forEach((channel, chanIdx,) => {
            switch (channel) {
                case "Xposition":
                    rXs = sub(this.frames, chanIdx, dataLen, nChannels)
                    break
                case "Yposition":
                    if (this.skeleton.convertFromZUp) {
                        rZs = neg(sub(this.frames, chanIdx, dataLen, nChannels))
                    } else {
                        rYs = sub(this.frames, chanIdx, dataLen, nChannels)
                    }
                    break
                case "Zposition":
                    if (this.skeleton.convertFromZUp) {
                        rYs = sub(this.frames, chanIdx, dataLen, nChannels)
                    } else {
                        rZs = sub(this.frames, chanIdx, dataLen, nChannels)
                    }
                    break
                case "Xrotation":
                    const aXs = mul(D, sub(this.frames, chanIdx, dataLen, nChannels))
                    rotOrder = "x" + rotOrder
                    rotAngles.push(aXs)
                    break
                case "Yrotation":
                    let aYs
                    if (this.skeleton.convertFromZUp) {
                        aYs = mul(-D, sub(this.frames, chanIdx, dataLen, nChannels))
                        rotOrder = "z" + rotOrder
                    } else {
                        aYs = mul(D, sub(this.frames, chanIdx, dataLen, nChannels))
                        rotOrder = "y" + rotOrder
                    }
                    rotAngles.push(aYs)
                    break
                case "Zrotation":
                    const aZs = mul(D, sub(this.frames, chanIdx, dataLen, nChannels))
                    if (this.skeleton.convertFromZUp) {
                        rotOrder = "y" + rotOrder
                    } else {
                        rotOrder = "z" + rotOrder
                    }
                    rotAngles.push(aZs)
                    break
            }
        })
        rotOrder = "s" + rotOrder
        this.rotOrder = rotOrder

        this.matrixPoses = new Array(nFrames)

        if (rotAngles.length > 0 && rotAngles.length < 3) {
            // pass
        } else {
            if (rotAngles.length >= 3) {
                for (let frameIdx = 0; frameIdx < nFrames; ++frameIdx) {
                    this.matrixPoses[frameIdx] = euler_matrix(rotAngles[2][frameIdx], rotAngles[1][frameIdx], rotAngles[0][frameIdx], rotOrder)
                    // if (this.name === "shoulder01.L" && frameIdx === 0) {
                    //     console.log(`this.skeleton.convertFromZUp=${this.skeleton.convertFromZUp}`)
                    //     console.log(`possible screw up for euler_matrix(${rotAngles[2][frameIdx]}, ${rotAngles[1][frameIdx]}, ${rotAngles[0][frameIdx]}, ${rotOrder})?`)
                    //     console.log(this.matrixPoses[frameIdx])
                    // }
                }
            }
        }

        // Add translations to pose matrices
        // Allow partial transformation channels too
        let poseTranslate: boolean
        switch (this.skeleton.allowTranslation) {
            case "all":
                poseTranslate = true
                break
            case "onlyroot":
                poseTranslate = this.parent === undefined
                break
            case "none":
                poseTranslate = false
        }

        if (poseTranslate && (rXs !== undefined || rYs !== undefined || rZs !== undefined)) {
            if (rXs === undefined) {
                rXs = new Array(nFrames)
                rXs.fill(0)
            }
            if (rYs === undefined) {
                rYs = new Array(nFrames)
                rYs.fill(0)
            }
            if (rZs === undefined) {
                rZs = new Array(nFrames)
                rZs.fill(0)
            }
            this.matrixPoses.forEach((m, i) => {
                m[3] = rXs![i]
                m[7] = rYs![i]
                m[11] = rZs![i]
            })
        }
    }
}

// converted from
// https://github.com/cgohlke/transformations/blob/master/transformations/transformations.py
// Copyright (c) 2006-2022, Christoph Gohlke

export function euler_matrix(ai: number, aj: number, ak: number, axes: string = 'sxyz'): mat4 {
    // Return homogeneous rotation matrix from Euler angles and axis sequence.

    // ai, aj, ak : Euler's roll, pitch and yaw angles
    // axes : One of 24 axis sequences as string or encoded tuple

    // >>> R = euler_matrix(1, 2, 3, 'syxz')
    // >>> numpy.allclose(numpy.sum(R[0]), -1.34786452)
    // True
    // >>> R = euler_matrix(1, 2, 3, (0, 1, 0, 1))
    // >>> numpy.allclose(numpy.sum(R[0]), -0.383436184)
    // True
    // >>> ai, aj, ak = (4*math.pi) * (numpy.random.random(3) - 0.5)
    // >>> for axes in _AXES2TUPLE.keys():
    // ...    R = euler_matrix(ai, aj, ak, axes)
    // >>> for axes in _TUPLE2AXES.keys():
    // ...    R = euler_matrix(ai, aj, ak, axes)

    // try:
    // console.log(`euler_matrix(ai=${ai}, aj=${aj}, ak=${ak}, axes=${axes}`)

    const tmp = _AXES2TUPLE.get(axes)
    if (tmp === undefined) {
        throw Error(`invalid axes of '{axes}'`)
    }
    const [firstaxis, parity, repetition, frame] = tmp

    let i = firstaxis
    let j = _NEXT_AXIS[i + parity]
    let k = _NEXT_AXIS[i - parity + 1]

    // console.log(`i=${i}, j=${j}, k=${k}`)

    if (frame) {
        [ai, ak] = [ak, ai]
    }
    if (parity) {
        [ai, aj, ak] = [-ai, -aj, -ak]
    }

    // console.log(`ai=${ai}, aj=${aj}, ak=${ak}`)

    let [si, sj, sk] = [Math.sin(ai), Math.sin(aj), Math.sin(ak)]
    let [ci, cj, ck] = [Math.cos(ai), Math.cos(aj), Math.cos(ak)]
    let [cc, cs] = [ci * ck, ci * sk]
    let [sc, ss] = [si * ck, si * sk]

    const M = mat4.create()

    function set(row: number, col: number, v: number) {
        M[col * 4 + row] = v
    }
    if (repetition) {
        // console.log("repetition")
        set(i, i, cj)
        set(i, j, sj * si)
        set(i, k, sj * ci)
        set(j, i, sj * sk)
        set(j, j, -cj * ss + cc)
        set(j, k, -cj * cs - sc)
        set(k, i, -sj * ck)
        set(k, j, cj * sc + cs)
        set(k, k, cj * cc - ss)
    } else {
        // console.log("no repetition")
        set(i, i, cj * ck)
        set(i, j, sj * sc - cs)
        set(i, k, sj * cc + ss)
        set(j, i, cj * sk)
        set(j, j, sj * ss + cc)
        set(j, k, sj * cs - sc)
        set(k, i, -sj)
        set(k, j, cj * si)
        set(k, k, cj * ci)
    }
    return M
}

// axis sequences for Euler angles
const _NEXT_AXIS = [1, 2, 0, 1]

// map axes strings to/from tuples of inner axis, parity, repetition, frame
const _AXES2TUPLE = new Map([
    ['sxyz', [0, 0, 0, 0]],
    ['sxyx', [0, 0, 1, 0]],
    ['sxzy', [0, 1, 0, 0]],
    ['sxzx', [0, 1, 1, 0]],
    ['syzx', [1, 0, 0, 0]],
    ['syzy', [1, 0, 1, 0]],
    ['syxz', [1, 1, 0, 0]],
    ['syxy', [1, 1, 1, 0]],
    ['szxy', [2, 0, 0, 0]],
    ['szxz', [2, 0, 1, 0]],
    ['szyx', [2, 1, 0, 0]],
    ['szyz', [2, 1, 1, 0]],

    ['rzyx', [0, 0, 0, 1]],
    ['rxyx', [0, 0, 1, 1]],
    ['ryzx', [0, 1, 0, 1]],
    ['rxzx', [0, 1, 1, 1]],
    ['rxzy', [1, 0, 0, 1]],
    ['ryzy', [1, 0, 1, 1]],
    ['rzxy', [1, 1, 0, 1]],
    ['ryxy', [1, 1, 1, 1]],
    ['ryxz', [2, 0, 0, 1]],
    ['rzxz', [2, 0, 1, 1]],
    ['rxyz', [2, 1, 0, 1]],
    ['rzyz', [2, 1, 1, 1]],
])
