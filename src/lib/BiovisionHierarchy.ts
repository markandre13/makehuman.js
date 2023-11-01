// Import Biovision Hierarchy character animation file
// https://en.wikipedia.org/wiki/Biovision_Hierarchy

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { mat4, vec3 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { euler_matrix } from "./euler_matrix"
import { StringToLine } from "./StringToLine"
import { off } from "process"

export type TranslationType = "all" | "onlyroot" | "none"

export class BiovisionHierarchy {
    name: string = ""
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
    allowTranslation!: TranslationType

    lineNumber = 0

    constructor() {}

    fromFile(
        filename: string,
        convertFromZUp: "auto" | true | false = "auto",
        allowTranslation: TranslationType = "onlyroot",
        data?: string
    ): BiovisionHierarchy {
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
            data = FileSystemAdapter.readFile(filename)
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
                    this.expect(tokens, "HIERARCHY", 0)
                    state = 1
                    break
                case 1:
                    this.expect(tokens, "ROOT", 1)
                    joint = this.addRootJoint(tokens[1])
                    state = 2
                    break
                case 2: // start joint
                    this.expect(tokens, "{", 0)
                    state = 3
                    break
                case 3:
                    this.expect(tokens, "OFFSET", 3)
                    this.__calcPosition(joint, [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
                    state = 4
                    break
                case 4:
                    this.expect(tokens, "CHANNELS")
                    const nChannels = parseInt(tokens[1])
                    joint.channels = tokens.slice(2)
                    if (nChannels !== joint.channels.length) {
                        throw Error(
                            `Expected ${nChannels} but got ${joint.channels.length} at line ${this.lineNumber}.`
                        )
                    }
                    state = 5
                    break
                case 5:
                    switch (tokens[0]) {
                        case "JOINT":
                            {
                                const child = new BVHJoint(tokens[1], this)
                                this.bvhJoints.push(child)
                                this.joints.set(child.name, child)
                                joint.children.push(child)
                                child.parent = joint
                                joint = child
                                state = 2
                            }
                            break
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
                            throw Error(
                                `Expected keywords 'JOINT', 'End' or '}' in BVH file at line ${this.lineNumber}.`
                            )
                    }
                    break
                case 6:
                    this.expect(tokens, "{", 0)
                    state = 7
                    break
                case 7:
                    {
                        this.expect(tokens, "OFFSET", 3)
                        const child = new BVHJoint("End effector", this)
                        this.bvhJoints.push(child)
                        joint.children.push(child)
                        child.parent = joint
                        child.channels = []
                        this.__calcPosition(child, [
                            parseFloat(tokens[1]),
                            parseFloat(tokens[2]),
                            parseFloat(tokens[3]),
                        ])
                        state = 8
                    }
                    break
                case 8:
                    this.expect(tokens, "}", 0)
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
                    this.expect(tokens, "MOTION", 0)
                    state = 10
                    break
                case 10:
                    this.expect(tokens, "Frames:", 1)
                    this.frameCount = parseInt(tokens[1])
                    state = 11
                    break
                case 11:
                    this.expect(tokens, "Frame", 2) // Time:
                    this.frameTime = parseFloat(tokens[2])
                    state = 12
                    break
                case 12:
                    {
                        // one line per frame; each frame has ( number of bones x number of channel ) entries
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
                    }
                    break
                case 13:
                    break
                default:
                    throw Error(`Unexpected state ${state}`)
            }
        }

        this.__cacheGetJoints()

        // transform frame data into transformation matrices for all joints
        for (const joint of this.jointslist) {
            joint.calculateFrames() // TODO we don't need to calculate pose matrices for end effectors
        }

        return this
    }

    // this.jointslist := breadth first array of joints
    __cacheGetJoints() {
        this.jointslist = [this.rootJoint]
        let queueIdx = 0
        while (queueIdx < this.jointslist.length) {
            const joint = this.jointslist[queueIdx++]
            this.jointslist.push(...joint.children)
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

    addJoint(parentName: string, name: string) {
        const origName = name
        let i = 1
        while (name in this.joints.keys()) {
            name = `${origName}_${i}`
            i += 1
        }
        const parent = this.getJoint(parentName)
        const joint = this.__addJoint(name)
        parent!.addChild(joint)
        return joint
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
        const ref_names = ["head", "spine03", "spine02", "spine01", "upperleg02.L", "lowerleg02.L"]
        while (ref_joint === undefined && ref_names.length != 0) {
            const joint_name = ref_names.pop()!
            ref_joint = this.joints.get(joint_name)
            if (ref_joint === undefined) {
                ref_joint = this.joints.get(joint_name.substring(0, 1).toUpperCase() + joint_name.substring(1))
            }
            if (ref_joint !== undefined && ref_joint.children.length === 0) {
                console.log(
                    `Cannot use reference joint ${ref_joint.name} for determining axis system, it is an end-effector (has no children)`
                )
                ref_joint = undefined
            }
            if (ref_joint === undefined) {
                console.log(
                    `Could not auto guess axis system for BVH file ${this.name} because no known joint name is found. Using Y up as default axis orientation.`
                )
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
            joint.parent.position.forEach((v, i) => (joint.position[i] += v))
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

    getJoints(): BVHJoint[] {
        return this.jointslist
    }

    getJointByCanonicalName(canonicalName: string): BVHJoint | undefined {
        canonicalName = canonicalName.toLowerCase().replace(" ", "_").replace("-", "_")
        for (const jointName of this.joints.keys()) {
            if (canonicalName === jointName.toLowerCase().replace(" ", "_").replace("-", "_"))
                return this.getJoint(jointName)
        }
        return undefined
    }

    /**
     * Construct a BVH object from a skeleton structure and optionally an
     * animation track.
     *
     * NOTE: Make sure that the skeleton has only one root.
     *
     * @param skel
     * @param animationTrack If no animation track is specified, a dummy animation
     *        of one frame will be added.
     * @param dummyJoints
     *        If dummyJoints is true (the default) then extra dummy joints will be
     *        introduced when bones are not directly connected, but have their head
     *        position offset from their parent bone tail. This often happens when
     *        multiple bones are attached to one parent bones, for example in the
     *        shoulder, hip and hand areas.
     *
     *        When dummyJoints is set to false, for each bone in the skeleton, exactly
     *        one BVH joint will be created. How this is interpreted depends on the
     *        tool importing the BVH file. Some create only a bone between the parent
     *        and its first child joint, and create empty offsets to the other childs.
     *        Other tools create one bone, with the tail position being the average
     *        of all the child joints.
     *
     *        Dummy joints are introduced to prevent
     *        ambiguities between tools. Dummy joints carry the same name as the bone
     *        they parent, with "__" prepended.
     */
    fromSkeleton(skel: Skeleton, animationTrack?: mat4[], dummyJoints: boolean = true): BiovisionHierarchy {
        for (const jointName of skel.getJointNames()) {
            const bone = skel.getBone(jointName)
            let parentName: string | undefined
            let offset: vec3
            let joint: BVHJoint

            if (
                dummyJoints &&
                bone.parent !== undefined &&
                !vec3.equals(bone.getRestHeadPos(), bone.parent.getRestTailPos())
            ) {
                // Introduce a dummy joint to cover the offset between two not-connected bones
                const joint = this.addJoint(bone.parent!.name, `__${jointName}`)
                joint.channels = ["Zrotation", "Xrotation", "Yrotation"]
                parentName = joint.name
                offset = vec3.sub(vec3.create(), bone.parent.getRestTailPos(), bone.parent.getRestHeadPos())
                this.__calcPosition(joint, [offset[0], offset[1], offset[2]])
                vec3.sub(offset, bone.getRestHeadPos(), bone.parent.getRestTailPos())
            } else {
                parentName = bone.parent?.name
                offset = bone.getRestOffset()
            }

            if (bone.parent !== undefined) {
                joint = this.addJoint(parentName!, jointName)
                joint.channels = ["Zrotation", "Xrotation", "Yrotation"]
            } else {
                // Root bones have translation channels
                joint = this.addRootJoint(bone.name)
                joint.channels = ["Xposition", "Yposition", "Zposition", "Zrotation", "Xrotation", "Yrotation"]
            }

            this.__calcPosition(joint, [offset[0], offset[1], offset[2]])
            if (!bone.hasChildren()) {
                const endJoint = this.addJoint(jointName, "End effector")
                endJoint.channels = []
                offset = vec3.sub(vec3.create(), bone.getRestTailPos(), bone.getRestHeadPos())
                this.__calcPosition(endJoint, [offset[0], offset[1], offset[2]])
            }
        }
        this.__cacheGetJoints()
        const nonEndJoints = this.getJoints().filter((joint) => !joint.isEndConnector())

        if (animationTrack !== undefined) {
            throw Error("not implemented yet")
        } else {
            this.frameCount = 1
            this.frameTime = 1.0
            nonEndJoints.forEach((joint, index) => {
                if (joint.channels.length === 6) {
                    joint.frames.push(...[0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
                } else {
                    joint.frames.push(...[0.0, 0.0, 0.0])
                }
            })
        }

        for (let joint of this.getJoints()) {
            joint.calculateFrames()
        }

        return this
    }

    getJointsBVHOrder() {
        return this.bvhJoints
    }

    writeToFile() {
        let out = ""

        // write structure
        out += `HIERARCHY\n`
        out += this._writeJoint(this.rootJoint)

        // write animation
        out += 'MOTION\n'
        out += `Frames: ${this.frameCount}\n`
        out += `Frame Time: ${this.frameTime}\n`

        const allJoints = this.getJointsBVHOrder().filter(joint => !joint.isEndConnector())
        // const jointsData = allJoints.map(joint => joint.matrixPoses).flat()
        // const nJoints = jointsData.length
        // const nFrames = jointsData[0].length
        // const totalChannels = allJoints.map(joint => joint.channels.length).reduce((a,b) => a + b)
        for(let fIdx=0; fIdx<this.frameCount; ++fIdx) {
            let frameData = []
            for(const joint of allJoints) {
                console.log(joint.name)
                const offset = fIdx * joint.channels.length
                for(let i = offset ; i < offset + joint.channels.length; ++i) {
                    frameData.push(joint.frames[i])
                }
            }
            out += frameData.join(" ") + "\n"
        }

        return out
    }

    _writeJoint(joint: BVHJoint, ident: number = 0) {
        let out = ""
        if (joint.name === "End effector") {
            const offset = joint.offset
            out += "\t".repeat(ident + 1) + "End Site\n"
            out += "\t".repeat(ident + 1) + "{\n"
            out += "\t".repeat(ident + 2) + `OFFSET\t${offset[0]}\t${offset[1]}\t${offset[2]}\n`
            out += "\t".repeat(ident + 1) + "}\n"
        } else {
            if (joint.isRoot()) {
                out += `ROOT ${joint.name}\n`
                out += `{\n`
            } else {
                out += "\t".repeat(ident) + `JOINT ${joint.name}\n`
                out += "\t".repeat(ident) + "{\n"
            }
            const offset = joint.offset
            out += "\t".repeat(ident + 1) + `OFFSET\t${offset[0]}  ${offset[0]}  ${offset[0]}\n`
            out += "\t".repeat(ident + 1) + `CHANNELS ${joint.channels.length} ${joint.channels.join(" ")}\n`

            for (const child of joint.children) {
                out += this._writeJoint(child, ident + 1)
            }
            out += "\t".repeat(ident) + "}\n"
        }
        return out
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
    frames: number[] = []

    constructor(name: string, skeleton: BiovisionHierarchy) {
        this.name = name
        this.skeleton = skeleton
    }

    addChild(joint: BVHJoint) {
        this.children.push(joint)
        joint.parent = this
    }

    hasParent(): boolean {
        return this.parent != undefined
    }

    isRoot(): boolean {
        return !this.hasParent()
    }

    hasChildren() {
        return this.children.length > 0
    }

    isEndConnector() {
        return !this.hasChildren()
    }

    calculateFrames() {
        if (this.channels === undefined) {
            throw Error(`no channels in ${this.name}`)
        }

        const nChannels = this.channels.length
        const nFrames = this.skeleton.frameCount
        const dataLen = nFrames * nChannels
        if (this.frames.length < dataLen) {
            console.log(`Frame data: ${this.frames}`)
            throw new Error(
                `Expected frame data length for joint ${this.name} is ${dataLen} found ${this.frames.length}`
            )
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
        this.channels.forEach((channel, chanIdx) => {
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
                    this.matrixPoses[frameIdx] = euler_matrix(
                        rotAngles[2][frameIdx],
                        rotAngles[1][frameIdx],
                        rotAngles[0][frameIdx],
                        rotOrder
                    )
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
                m[12] = rXs![i]
                m[13] = rYs![i]
                m[14] = rZs![i]
            })
        }
    }
}
