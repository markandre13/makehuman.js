import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { RenderList } from "render/RenderList"
import { ModelReason } from "toad.js/model/Model"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"
import { Application } from "Application"
import { mat3, mat4, quat2, vec3, vec4 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { IBlendshapeConverter } from "blendshapes/IBlendshapeConverter"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { Blaze, BlazePoseConverter, BlazePoseLandmarks } from "mediapipe/pose/BlazePoseConverter"

export const REST_QUAT = quat2.create()

/**
 * All presentation models report changes to the update manager
 * which will the update the domain model.
 */
export class UpdateManager {
    app: Application
    skeleton: Skeleton
    modifiedMorphNodes = new Set<SliderNode>()
    modifiedExpressionPoseUnits = new Set<NumberRelModel>()
    modifiedPosePoseUnits = new Set<NumberRelModel>()
    modifiedPoseNodes = new Set<PoseNode>()

    private blendshapeModel?: BlendshapeModel

    setBlendshapeModel(blendshapeModel?: BlendshapeModel) {
        if (this.blendshapeModel) {
            this.blendshapeModel.modified.remove(this)
        }
        this.blendshapeModel = blendshapeModel
        if (this.blendshapeModel) {
            this.blendshapeModel.modified.add(() => {
                this.blendshapeModelChanged = true
            }, this)
        }
    }
    getBlendshapeModel() {
        return this.blendshapeModel
    }

    blendshapeConverter?: IBlendshapeConverter

    //
    // flags for change detection
    //

    // approach 1: these are updated via a registered TSignal
    // there is a lot of overhead involved in this and in case of the blendshape
    // editor, we even have a changing model, meaning that we have to register/unregister
    // a call back on the signal
    blendshapeToPoseConfigChanged = false
    blendshapeModelChanged = false
    // approach 2:
    // this appraoch is more lightweight than approach 1. since we already just tell
    // the update manager that something has changed via invalidateView(), when it is
    // actually time to update, we could just compare the timestamp.
    // there will be no need to register/unregister on a signal.
    // does this mean the signal is a bad approach? i'm not sure. the animated
    // human, using different input sources (morph, blendshapes, pose) might be
    // a different situation
    _poseLandmarksTS: bigint = 0n

    bpl = new BlazePoseLandmarks()
    bpc = new BlazePoseConverter()

    render?: () => void

    private invalidated = false
    invalidateView() {
        if (this.invalidated) {
            return
        }
        this.invalidated = true
        requestAnimationFrame(() => {
            this.invalidated = false
            if (this.render !== undefined) {
                this.render()
            }
        })
    }

    constructor(app: Application) {
        this.app = app
        this.skeleton = app.skeleton
        this.blendshapeModel = app.blendshapeModel
        this.blendshapeConverter = app.blendshapeConverter
        const sliderNodes = app.sliderNodes

        // observe morph slider
        function forEachMorphSliderNode(node: SliderNode | undefined, cb: (node: SliderNode) => void) {
            if (node === undefined) {
                return
            }
            cb(node)
            forEachMorphSliderNode(node.next, cb)
            forEachMorphSliderNode(node.down, cb)
        }
        forEachMorphSliderNode(sliderNodes, (node) =>
            node.model?.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: morph slider '${node.label}' has changed to ${node.model?.value}`)
                    this.invalidateView()
                    this.modifiedMorphNodes.add(node) // keep track of what has changed
                }
            })
        )

        // observe bone pose nodes
        function forEachBonePoseNode(node: PoseNode | undefined, cb: (node: PoseNode) => void) {
            if (node === undefined) {
                return
            }
            cb(node)
            forEachBonePoseNode(node.next, cb)
            forEachBonePoseNode(node.down, cb)
        }
        forEachBonePoseNode(this.skeleton.poseNodes, (poseNode) => {
            poseNode.x.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                    this.invalidateView()
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.y.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                    this.invalidateView()
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.z.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                    this.invalidateView()
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
        })

        this.app.blendshapeToPoseConfig.modified.add(() => {
            this.blendshapeToPoseConfigChanged = true
        }, this)
        this.setBlendshapeModel(app.blendshapeModel)
    }

    renderList?: RenderList

    setRenderList(renderList?: RenderList) {
        this.renderList = renderList
    }

    protected _chordataChanged?: ChordataSkeleton
    chordataChanged(skeleton: ChordataSkeleton) {
        this.invalidateView()
        this._chordataChanged = skeleton
    }

    mediapipeData?: Float32Array
    timestamp_ms?: bigint
    mediapipe(data: Float32Array, timestamp_ms: bigint) {
        this.invalidateView()
        this.mediapipeData = data
        this.timestamp_ms = timestamp_ms
    }

    // the nice thing is, this method also serves as an overview of the data flow
    updateIt() {
        let skeletonChanged = false
        let skinChanged = false

        if (this.modifiedMorphNodes.size > 0) {
            // console.log(`UpdateManager::update(): morph nodes have changed -> set modifiers, morph & update skeleton`)
            this.modifiedMorphNodes.forEach((n) => {
                n.modifier!.updateValue(n.model!.value)
            })
            this.modifiedMorphNodes.clear()

            this.skeleton.humanMesh.calculateVertexMorphed()
            this.skeleton.updateJoints()
            this.skeleton.build()

            skeletonChanged = true
        }

        if (this.blendshapeToPoseConfigChanged) {
            this.app.blendshapeToPoseConfig.convert(this.app.makehumanFacePoseUnits, this.app.blendshape2pose)
            this.blendshapeToPoseConfigChanged = false
            this.blendshapeModelChanged = true
        }

        if (this.blendshapeModelChanged) {
            this.blendshapeConverter!.applyToSkeleton(this.blendshapeModel!, this.skeleton)
            this.blendshapeModelChanged = false

            // experimental head rotation
            // real neck and head positioning would actually require two transforms: neck AND head.
            // as an approximation, this just evenly distributes the head rotation over neck and head joints
            if (this.app.frontend.blendshapeModel.transform) {
                const neck1 = this.skeleton.getBone("neck01")
                const neck2 = this.skeleton.getBone("neck02")
                const neck3 = this.skeleton.getBone("neck03")
                const head = this.skeleton.getBone("head")

                const t = this.app.frontend.blendshapeModel.transform
                let m = mat4.fromValues(t[0], t[1], t[2], 0, t[4], t[5], t[6], 0, t[8], t[9], t[10], 0, 0, 0, 0, 1)
                let q = quat2.create()
                quat2.fromMat4(q, m)
                q = quaternion_slerp(REST_QUAT, q, 0.25)
                mat4.fromQuat2(head.matPose, q)
                mat4.fromQuat2(neck1.matPose, q)
                mat4.fromQuat2(neck2.matPose, q)
                mat4.fromQuat2(neck3.matPose, q)
            }

            skeletonChanged = true
        }

        if (
            this.app.frontend._poseLandmarks !== undefined &&
            this._poseLandmarksTS != this.app.frontend._poseLandmarksTS
        ) {
            this._poseLandmarksTS = this.app.frontend._poseLandmarksTS
            skeletonChanged = true

            // OpenGL coordinate system is a right hand coordinate system with Z
            // pointing towards the observer
            // Y
            // ^
            // |
            // Z-->X

            // rotate 90d right
            const preRotation = mat4.create()
            // const preRotation = mat4.fromYRotation(mat4.create(), Math.PI/2)

            const getVec = (index: number) => {
                const i = index * 3
                const p = this.app.frontend._poseLandmarks!!
                // revert the minus i added for direct opengl rendering
                const v = vec3.fromValues(p[i], -p[i + 1], p[i + 2])
                vec3.transformMat4(v, v, preRotation)
                return v
            }

            const setPose = (boneName: string, m: mat4) => {
                // get bone
                const bone = this.skeleton.getBone(boneName)
                // convert from global to bone's relative coordinates

                const restRotation = mat4.clone(bone.matRestGlobal!!)
                restRotation[12] = 0
                restRotation[13] = 0
                restRotation[14] = 0

                const inv = mat4.invert(mat4.create(), restRotation)
                const local = mat4.mul(mat4.create(), inv, m)
                mat4.mul(local, local, restRotation)
                // set pose
                bone.matPose = local
            }

            const setPoseRaw = (boneName: string, m: mat4) => {
                // get bone
                const bone = this.skeleton.getBone(boneName)
                // convert from global to bone's relative coordinates

                // set pose
                bone.matPose = m
            }

            this.bpl.data = this.app.frontend._poseLandmarks!!
            // root
            const rootPoseGlobal = mat4.fromYRotation(mat4.create(), this.bpc.getRootY(this.bpl))

            const rootPose = this.bpc.getRoot(this.bpl)
            setPose("root", rootPose)

            // setPose("root", rootPoseGlobal)

            // const invRootPoseGlobal = mat4.invert(mat4.create(), rootPoseGlobal) // nope
            // const invRootPoseGlobal = mat4.invert(mat4.create(), preRotation) // ok
            // const invRootPoseGlobal = mat4.fromYRotation(mat4.create(), -Math.PI/2) // ok
            const invRootPoseGlobal = rootPoseGlobal // ok

            // right leg
            const rlegA = getVec(Blaze.RIGHT_HIP)
            const rlegB = getVec(Blaze.RIGHT_KNEE)
            const rlegDirection = vec3.sub(vec3.create(), rlegB, rlegA)

            vec3.transformMat4(rlegDirection, rlegDirection, invRootPoseGlobal)

            const rlegRZ = Math.atan2(rlegDirection[0], rlegDirection[1])
            const rlegRX = Math.atan2(rlegDirection[2], rlegDirection[1])
            const rlegPoseGlobal = mat4.fromZRotation(mat4.create(), rlegRZ)
            mat4.rotateX(rlegPoseGlobal, rlegPoseGlobal, rlegRX)

            setPose("upperleg01.R", rlegPoseGlobal)

            // left leg
            const llegA = getVec(Blaze.LEFT_HIP)
            const llegB = getVec(Blaze.LEFT_KNEE)
            const llegDirection = vec3.sub(vec3.create(), llegB, llegA)
            vec3.normalize(llegDirection, llegDirection)

            vec3.transformMat4(llegDirection, llegDirection, invRootPoseGlobal)

            const llegRZ = Math.atan2(llegDirection[0], llegDirection[1])
            const llegRX = Math.atan2(llegDirection[2], llegDirection[1])
            const llegPoseGlobal = mat4.fromZRotation(mat4.create(), llegRZ)
            mat4.rotateX(llegPoseGlobal, llegPoseGlobal, llegRX)

            setPose("upperleg01.L", llegPoseGlobal)

            // right arm
            // const rsa = mat4.fromZRotation(mat4.create(), Math.PI - this.bpc.getRightShoulderAngle(this.bpl))
            // setPoseRaw("shoulder01.R", rsa)

            const rarmA = getVec(12)
            const rarmB = getVec(14)
            const rarmDirection = vec3.sub(vec3.create(), rarmB, rarmA)
            vec3.normalize(rarmDirection, rarmDirection)

            vec3.transformMat4(rarmDirection, rarmDirection, invRootPoseGlobal)

            const rarmRZ = Math.atan2(rarmDirection[0], rarmDirection[1]) + 0.7
            // const rarmRY = Math.atan2(rarmDirection[0], rarmDirection[2])
            const rarmPoseGlobal = mat4.fromZRotation(mat4.create(), rarmRZ)
            // mat4.rotateY(rarmPoseGlobal, rarmPoseGlobal, rarmRY)

            setPose("shoulder01.R", rarmPoseGlobal)

            // left arm
            // const lsa = mat4.fromZRotation(mat4.create(), Math.PI - this.bpc.getLeftShoulderAngle(this.bpl))
            // setPoseRaw("shoulder01.L", lsa)

            const larmA = getVec(11)
            const larmB = getVec(13)
            const larmDirection = vec3.sub(vec3.create(), larmB, larmA)
            vec3.normalize(larmDirection, larmDirection)

            vec3.transformMat4(larmDirection, larmDirection, invRootPoseGlobal)

            const larmRZ = Math.atan2(larmDirection[0], larmDirection[1]) - 0.7
            const larmPoseGlobal = mat4.fromZRotation(mat4.create(), larmRZ)

            setPose("shoulder01.L", larmPoseGlobal)

            // left arm elbow
            const lae = mat4.fromXRotation(mat4.create(), Math.PI - this.bpc.getLeftArmAngle(this.bpl) - 0.7)
            setPoseRaw("lowerarm01.L", lae)

            // left arm elbow
            const rae = mat4.fromXRotation(mat4.create(), Math.PI - this.bpc.getRightArmAngle(this.bpl) - 0.7)
            setPoseRaw("lowerarm01.R", rae)

            const lll = mat4.fromXRotation(mat4.create(), Math.PI - this.bpc.getLeftLegAngle(this.bpl) - 0.4)
            setPoseRaw("lowerleg01.L", lll)

            const rll = mat4.fromXRotation(mat4.create(), Math.PI - this.bpc.getRightLegAngle(this.bpl) - 0.4)
            setPoseRaw("lowerleg01.R", rll)

        }

        // UPDATE_SKINNING_MATRIX
        if (this._chordataChanged !== undefined) {
            this._chordataChanged.update()
            this.skeleton.updateChordata(this._chordataChanged)
            skinChanged = true
            this._chordataChanged = undefined
        } else {
            if (skeletonChanged) {
                // console.log(`UpdateManager::update(): skeleton has changed -> update skinning matrix`)
                this.skeleton.update()
                skinChanged = true
            }
        }

        // UPDATE SKIN MESH AND OPENGL BUFFERS
        if (this.renderList !== undefined) {
            if (skinChanged) {
                // console.log(`UpdateManager::update(): skin has changed`)
                this.skeleton.humanMesh.calculateVertexRigged()
                this.renderList.update()
            }
        }
    }
}

// https://stackoverflow.com/questions/18558910/direction-vector-to-rotation-matrix
const up = vec3.fromValues(0, 1, 0)
function matFromDirection(direction: vec3) {
    const zaxis = vec3.normalize(vec3.create(), direction)
    const xaxis = vec3.cross(vec3.create(), up, zaxis)
    vec3.normalize(xaxis, xaxis)
    const yaxis = vec3.cross(vec3.create(), zaxis, xaxis)
    vec3.normalize(yaxis, yaxis)
    return mat4.fromValues(
        xaxis[0],
        xaxis[1],
        xaxis[2],
        0,
        yaxis[0],
        yaxis[1],
        yaxis[2],
        0,
        zaxis[0],
        zaxis[1],
        zaxis[2],
        0,
        0,
        0,
        0,
        1
    )
}

// https://de.mathworks.com/matlabcentral/answers/2092961-how-to-calculate-the-angle-between-two-3d-vectors
// % most robust, most accurate, recovers tiny angles very well, slowest
// atan2(norm(cross(u,v)), dot(u,v))
// % robust, does not recover tiny angles, faster
// max(min(dot(u,v)/(norm(u)*norm(v)),1),-1)
// % not robust (may get domain error), does not recover tiny angles, fasterer
// acos(dot(u,v)/(norm(u)*norm(v)))
// % not robust (may get domain error), does not recover tiny angles, fasterer
// acos(dot(u/norm(u),v/norm(v)))
// % not robust (may get domain error), does not recover tiny angles, fastest
// acos(dot(u,v)/sqrt(dot(u,u)*dot(v,v)))
function angle(u: vec3, v: vec3) {
    const cross = vec3.cross(vec3.create(), u, v)
    const norm = vec3.length(cross)
    const dot = vec3.dot(u, v)
    return Math.atan2(norm, dot)
}
