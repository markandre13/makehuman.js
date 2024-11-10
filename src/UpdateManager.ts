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
import { BlazePoseConverter } from "mediapipe/pose/BlazePoseConverter"
import { BlazePoseLandmarks } from "mediapipe/pose/BlazePoseLandmarks"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { euler_from_matrix, euler_matrix } from "lib/euler_matrix"

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
            // this.blendshapeConverter!.applyToSkeleton(this.blendshapeModel!, this.skeleton)
            this.blendshapeModelChanged = false

            // // experimental head rotation
            // // real neck and head positioning would actually require two transforms: neck AND head.
            // // as an approximation, this just evenly distributes the head rotation over neck and head joints
            // if (this.app.frontend.blendshapeModel.transform) {
            //     const neck1 = this.skeleton.getBone("neck01")
            //     const neck2 = this.skeleton.getBone("neck02")
            //     const neck3 = this.skeleton.getBone("neck03")
            //     const head = this.skeleton.getBone("head")

            //     const t = this.app.frontend.blendshapeModel.transform
            //     let m = mat4.fromValues(t[0], t[1], t[2], 0, t[4], t[5], t[6], 0, t[8], t[9], t[10], 0, 0, 0, 0, 1)
            //     let q = quat2.create()
            //     quat2.fromMat4(q, m)
            //     q = quaternion_slerp(REST_QUAT, q, 0.25)
            //     mat4.fromQuat2(head.matPose, q)
            //     mat4.fromQuat2(neck1.matPose, q)
            //     mat4.fromQuat2(neck2.matPose, q)
            //     mat4.fromQuat2(neck3.matPose, q)
            // }

            skeletonChanged = true
        }

        if (
            this.app.frontend._poseLandmarks !== undefined &&
            this._poseLandmarksTS != this.app.frontend._poseLandmarksTS.value
        ) {
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

                bone.matPose = local
            }

            this._poseLandmarksTS = this.app.frontend._poseLandmarksTS.value
            skeletonChanged = true

            // neck01, neck02, neck03, head
            // shoulder01.R, shoulder01.L
            // lowerarm01.L

            this.bpl.data = this.app.frontend._poseLandmarks
            const hip = this.bpc.getHip(this.bpl)
            const invHip = mat4.invert(mat4.create(), hip)
            const hipWithTranslation = mat4.fromTranslation(mat4.create(), this.bpc.getHipCenter(this.bpl))
            mat4.multiply(hipWithTranslation, hipWithTranslation, hip)
            setPose("root", hipWithTranslation)

            const leftUpperLeg = this.bpc.getLeftUpperLegWithAdjustment(this.bpl)
            const invLeftUpperLeg = mat4.invert(mat4.create(), leftUpperLeg)
            setPose("upperleg01.L", mat4.mul(mat4.create(), invHip, leftUpperLeg))

            const leftLowerLeg = this.bpc.getLeftLowerLeg(this.bpl)
            const invLeftLowerLeg = mat4.invert(mat4.create(), leftLowerLeg)
            setPose("lowerleg01.L", mat4.mul(mat4.create(), invLeftUpperLeg, leftLowerLeg))

            const leftFoot = this.bpc.getLeftFoot(this.bpl)
            setPose("foot.L", mat4.mul(mat4.create(), invLeftLowerLeg, leftFoot))

            const rightUpperLeg = this.bpc.getRightUpperLegWithAdjustment(this.bpl)
            const invRightUpperLeg = mat4.invert(mat4.create(), rightUpperLeg)
            setPose("upperleg01.R", mat4.mul(mat4.create(), invHip, rightUpperLeg))

            const rightLowerLeg = this.bpc.getRightLowerLeg(this.bpl)
            const invRightLowerLeg = mat4.invert(mat4.create(), rightLowerLeg)
            setPose("lowerleg01.R", mat4.mul(mat4.create(), invRightUpperLeg, rightLowerLeg))

            const rightFoot = this.bpc.getRightFoot(this.bpl)
            setPose("foot.R", mat4.mul(mat4.create(), invRightLowerLeg, rightFoot))

            const shoulder = this.bpc.getShoulder(this.bpl)
            const invShoulder = mat4.invert(mat4.create(), shoulder)
            const relShoulder =  mat4.mul(mat4.create(), invHip, shoulder)
            const shoulderQuat = quat2.fromMat4(quat2.create(), relShoulder)
            const shoulderDelta = quaternion_slerp(REST_QUAT, shoulderQuat, 0.25)
            mat4.fromQuat2(relShoulder, shoulderDelta)
            // only spine04 & spine05???
            setPose("spine01", relShoulder)
            setPose("spine02", relShoulder)
            setPose("spine04", relShoulder)
            setPose("spine05", relShoulder)

            const head = this.bpc.getHead(this.bpl)
            const relHead =  mat4.mul(mat4.create(), invShoulder, head)
            const headQuat = quat2.fromMat4(quat2.create(), relHead)
            const headDelta = quaternion_slerp(REST_QUAT, headQuat, 0.25)
            mat4.fromQuat2(relHead, headDelta)
            setPose("neck01", relHead)
            setPose("neck02", relHead)
            setPose("neck03", relHead)
            setPose("head", relHead)

            const leftUpperArm = this.bpc.getLeftUpperArmWithAdjustment(this.bpl)
            mat4.mul(leftUpperArm, euler_matrix(0,deg2rad(30),deg2rad(-30)), leftUpperArm)
            const invLeftUpperArm = mat4.invert(mat4.create(), leftUpperArm)

            const relLeftUpperArm =  mat4.mul(mat4.create(), invShoulder, leftUpperArm)
            const leftUpperArmQuat = quat2.fromMat4(quat2.create(), relLeftUpperArm)
            let leftUpperArmDelta = quaternion_slerp(REST_QUAT, leftUpperArmQuat, 0.25)
            mat4.fromQuat2(relLeftUpperArm, leftUpperArmDelta)
            setPose("clavicle.L", relLeftUpperArm)
            leftUpperArmDelta = quaternion_slerp(REST_QUAT, leftUpperArmQuat, 0.75)
            mat4.fromQuat2(relLeftUpperArm, leftUpperArmDelta)
            setPose("shoulder01.L", relLeftUpperArm)

            const leftLowerArm = this.bpc.getLeftLowerArm(this.bpl)
            mat4.mul(leftLowerArm, leftLowerArm, euler_matrix(deg2rad(40), 0, 0))
            const invLeftLowerArm = mat4.invert(mat4.create(), leftLowerArm)
            setPose("lowerarm01.L", mat4.mul(mat4.create(), invLeftUpperArm, leftLowerArm))

            const leftHand = this.bpc.getLeftHand(this.bpl)
            setPose("wrist.L", mat4.mul(mat4.create(), invLeftLowerArm, leftHand))
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
