import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { RenderList } from "render/RenderList"
import { ModelReason } from "toad.js/model/Model"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"
import { Application } from "Application"
import { mat4, quat2, vec3 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { IBlendshapeConverter } from "blendshapes/IBlendshapeConverter"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { quaternion_slerp } from "lib/quaternion_slerp"

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
            const getVec = (index: number) => {
                const i = index * 3
                const p = this.app.frontend._poseLandmarks!!
                return vec3.fromValues(p[i], p[i + 1], p[i + 2])
            }

            // root
            const hipA = getVec(23)
            const hipB = getVec(24)
            const hipDirection = vec3.sub(vec3.create(), hipB, hipA)
            vec3.normalize(hipDirection, hipDirection)
            const hipRY = Math.atan2(hipDirection[0], hipDirection[2]) + Math.PI / 2
            const rootPoseGlobal = mat4.fromYRotation(mat4.create(), -hipRY)

            const rootBone = this.skeleton.getBone("root")

            // convert from global to bone's relative coordinates
            const rootInv = mat4.invert(mat4.create(), rootBone.matRestGlobal!!)
            const rootPoseLocal = mat4.mul(mat4.create(), rootInv, rootPoseGlobal)
            mat4.mul(rootPoseLocal, rootPoseLocal, rootBone.matRestGlobal!)

            rootBone.matPose = rootPoseLocal

            const mi = mat4.invert(mat4.create(), rootPoseGlobal)

            // right leg
            const rlegA = getVec(24)
            const rlegB = getVec(26)
            const rlegDirection = vec3.sub(vec3.create(), rlegB, rlegA)
            vec3.normalize(rlegDirection, rlegDirection)

            // (try to) remove root rotation from the leg
            // vec3.transformMat4(rlegDirection, rlegDirection, mi)

            const rlegRZ = Math.atan2(rlegDirection[0], rlegDirection[1]) + Math.PI
            const rlegPoseGlobal = mat4.fromZRotation(mat4.create(), -rlegRZ)

            const rlegBone = this.skeleton.getBone("upperleg01.R")
            // const rlegBone = this.skeleton.getBone("pelvis.R")

            const rlegInv = mat4.invert(mat4.create(), rlegBone.matRestGlobal!!)
            const rlegPoseLocal = mat4.mul(mat4.create(), rlegInv, rlegPoseGlobal)
            mat4.mul(rlegPoseLocal, rlegPoseLocal, rlegBone.matRestGlobal!)

            rlegBone.matPose = rlegPoseLocal

            // left leg
            const llegA = getVec(23)
            const llegB = getVec(25)
            const llegDirection = vec3.sub(vec3.create(), llegB, llegA)
            vec3.normalize(llegDirection, llegDirection)

            // (try to) remove root rotation from the leg
            // vec3.transformMat4(llegDirection, llegDirection, mi)

            const llegRZ = Math.atan2(llegDirection[0], llegDirection[1]) + Math.PI
            const legPoseGlobal = mat4.fromZRotation(mat4.create(), -llegRZ)

            const llegBone = this.skeleton.getBone("upperleg01.L")
            // const llegBone = this.skeleton.getBone("pelvis.L")

            const llegInv = mat4.invert(mat4.create(), llegBone.matRestGlobal!!)
            const llegPoseLocal = mat4.mul(mat4.create(), llegInv, legPoseGlobal)
            mat4.mul(llegPoseLocal, llegPoseLocal, llegBone.matRestGlobal!)

            llegBone.matPose = llegPoseLocal
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
