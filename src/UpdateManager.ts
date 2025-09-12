import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { RenderList } from "render/RenderList"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"
import { Application } from "Application"
import { mat4, quat2, vec3 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { IBlendshapeConverter } from "blendshapes/IBlendshapeConverter"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { quaternion_slerp } from "gl/algorithms/quaternion_slerp"
import { BlazePoseConverter } from "mediapipe/pose/BlazePoseConverter"
import { BlazePoseLandmarks } from "mediapipe/pose/BlazePoseLandmarks"
import { deg2rad } from "gl/algorithms/deg2rad"
import { VALUE } from "toad.js/model/ValueModel"
import { ALL } from "toad.js/model/Model"

export const REST_QUAT = quat2.create()

/**
 * All presentation models report changes to the update manager
 * which will the update the domain model.
 */
export class UpdateManager {
    app: Application
    skeleton: Skeleton
    /**
     * Morph settings changed since the last update
     */
    modifiedMorphSettings = new Set<SliderNode>()
    modifiedExpressionPoseUnits = new Set<NumberRelModel>()
    modifiedPosePoseUnits = new Set<NumberRelModel>()
    modifiedPoseNodes = new Set<PoseNode>()

    private blendshapeModel?: BlendshapeModel

    setBlendshapeModel(blendshapeModel?: BlendshapeModel) {
        if (this.blendshapeModel) {
            this.blendshapeModel.signal.remove(this)
        }
        this.blendshapeModel = blendshapeModel
        if (this.blendshapeModel) {
            this.blendshapeModel.signal.add(() => {
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
    skeletonChanged = false
    skinChanged = false

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

    invalidateView() {
        this.app.glview?.invalidate()
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
            node.model?.signal.add((event) => {
                switch (event.type) {
                    case ALL:
                    case VALUE:
                        this.invalidateView()
                        this.modifiedMorphSettings.add(node) // keep track of what has changed
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
            poseNode.x.signal.add((event) => {
                switch (event.type) {
                    case ALL:
                    case VALUE:
                        // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                        this.invalidateView()
                        this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.y.signal.add((event) => {
                switch (event.type) {
                    case ALL:
                    case VALUE:
                        // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                        this.invalidateView()
                        this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.z.signal.add((event) => {
                switch (event.type) {
                    case ALL:
                    case VALUE:
                        // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                        this.invalidateView()
                        this.modifiedPoseNodes.add(poseNode)
                }
            })
        })

        this.app.blendshapeToPoseConfig.signal.add(() => {
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

    /**
     * To be called before rendering the makehuman mesh.
     * 
     * Will update the morph and pose 
     * 
     * the nice thing is, this method also serves as an overview of the data flow
     * @returns true when the mesh has changed
     */
    updateIt(): boolean {
        this.skeletonChanged = false
        this.skinChanged = false

        this.updateMorphManager()

        this.updateFacePoseFromBlendShapes()
        this.updateBodyPoseFromBlazePose()

        // UPDATE_SKINNING_MATRIX
        if (this._chordataChanged !== undefined) {
            this._chordataChanged.update()
            this.skeleton.updateChordata(this._chordataChanged)
            this.skinChanged = true
            this._chordataChanged = undefined
        } else {
            if (this.skeletonChanged) {
                // console.log(`UpdateManager::update(): skeleton has changed -> update skinning matrix`)
                this.skeleton.update()
                this.skinChanged = true
            }
        }

        // UPDATE SKIN MESH AND OPENGL BUFFERS
        if (this.renderList !== undefined) {
            if (this.skinChanged) {
                // console.log(`UpdateManager::update(): skin has changed`)
                this.skeleton.humanMesh.calculateVertexRigged()
                this.renderList.update()
            }
        }
        return this.skinChanged
    }

    /**
     * Update mesh from morph and pose sliders without updating GL resources
     * @returns true when the mesh has changed
     */
    updateFromLocalSettingsWithoutGL(): boolean {
        this.skeletonChanged = false
        this.skinChanged = false
        this.updateMorphManager()
        // update pose
        if (this.skeletonChanged) {
            // console.log(`UpdateManager::update(): skeleton has changed -> update skinning matrix`)
            this.skeleton.update()
            this.skinChanged = true
        }
        if (this.skinChanged) {
            // console.log(`UpdateManager::update(): skin has changed`)
            this.skeleton.humanMesh.calculateVertexRigged()
        }
        return this.skinChanged
    }

    /**
     * If morph settings have changed, copy them to the update manager, recalculate
     * the mesh and skeleton.
     */
    private updateMorphManager(): void {
        if (this.modifiedMorphSettings.size === 0) {
            return
        }

        this.modifiedMorphSettings.forEach((slider) => {
            slider.modifier!.updateValue(slider.model!.value)
        })
        this.modifiedMorphSettings.clear()

        this.skeleton.humanMesh.calculateVertexMorphed()
        this.skeleton.updateJoints()
        this.skeleton.build()
        this.skeletonChanged = true
    }

    updateFacePoseFromBlendShapes() {
        // this converts the blendshape parameters to MakeHuman's face pose units
        // the outcome isn't very convincing:
        // * because both are different
        // * MH's face rig can not mimic ARKits blendshapes as needed

        if (this.blendshapeToPoseConfigChanged) {
            this.app.blendshapeToPoseConfig.convert(this.app.makehumanFacePoseUnits, this.app.blendshape2pose)
            this.blendshapeToPoseConfigChanged = false
            this.blendshapeModelChanged = true
        }

        if (!this.blendshapeModelChanged) {
            return
        }

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

        this.skeletonChanged = true
    }

    /**
     * Set pose from blaze pose
     * 
     * The blaze pose lacks some information to properly pose the makehuman skeleton.
     * 
     * * interpolates neck, spine and hip rotation
     * * guesses upper arm/leg y-rotation based on lower arm/leg, which of course fails
     *   when they are both in a straight line.
     * 
     *   this can be improved later during export, when we can look at start and end of the
     *   interval in which upper and lower arm/leg are in a straight line.
     */
    private updateBodyPoseFromBlazePose() {
        if (
            this.app.frontend._poseLandmarks === undefined ||
            this._poseLandmarksTS === this.app.frontend._poseLandmarksTS.value
        ) {
            return
        }
        const setPose = (boneName: string, m: mat4) => {
            // get bone
            const bone = this.skeleton.getBone(boneName)

            // convert from global to bone's relative coordinates
            const restRotation = mat4.clone(bone.matRestGlobal!)
            restRotation[12] = restRotation[13] = restRotation[14] = 0

            const inv = mat4.invert(mat4.create(), restRotation)!
            const local = mat4.mul(mat4.create(), inv, m)
            mat4.mul(local, local, restRotation)

            bone.matUserPoseRelative = local
        }

        const setPoseX = (boneName: string, m: mat4) => {
            const bone = this.skeleton.getBone(boneName)
            bone.matUserPoseGlobal = m
            switch (boneName) {
                case "upperarm01.L":
                case "lowerarm01.L":
                case "wrist.L":
                case "upperarm01.R":
                case "lowerarm01.R":
                case "wrist.R":
                    mat4.rotate(
                        bone.matUserPoseGlobal,
                        bone.matUserPoseGlobal,
                        deg2rad(180),
                        vec3.fromValues(0, 0, 1)
                    )
                    break
                case "upperleg01.L":
                case "upperleg01.R":
                    mat4.rotate(
                        bone.matUserPoseGlobal,
                        bone.matUserPoseGlobal,
                        deg2rad(175 - 10 + 2.5),
                        vec3.fromValues(1, 0, 0)
                    )
                    break
                case "lowerleg01.L":
                case "lowerleg01.R":
                    mat4.rotate(
                        bone.matUserPoseGlobal,
                        bone.matUserPoseGlobal,
                        deg2rad(180 - 4.5),
                        vec3.fromValues(1, 0, 0)
                    )
                    break
                case "foot.L":
                case "foot.R":
                    mat4.rotate(
                        bone.matUserPoseGlobal,
                        bone.matUserPoseGlobal,
                        deg2rad(115),
                        vec3.fromValues(1, 0, 0)
                    )
                    break
            }
        }

        this._poseLandmarksTS = this.app.frontend._poseLandmarksTS.value
        this.skeletonChanged = true

        this.bpl.data = this.app.frontend._poseLandmarks!
        const hip = this.bpc.getHipWithAdjustment(this.bpl)
        const invHip = mat4.invert(mat4.create(), hip)!
        const hipWithTranslation = mat4.fromTranslation(mat4.create(), this.bpc.getHipCenter(this.bpl))
        mat4.multiply(hipWithTranslation, hipWithTranslation, hip)
        setPose("root", hipWithTranslation)
        // setPose("root", hip)

        setPoseX("upperleg01.L", this.bpc.getLeftUpperLegWithAdjustment(this.bpl))
        setPoseX("lowerleg01.L", this.bpc.getLeftLowerLeg(this.bpl))
        setPoseX("foot.L", this.bpc.getLeftFoot(this.bpl))

        setPoseX("upperleg01.R", this.bpc.getRightUpperLegWithAdjustment(this.bpl))
        setPoseX("lowerleg01.R", this.bpc.getRightLowerLeg(this.bpl))
        setPoseX("foot.R", this.bpc.getRightFoot(this.bpl))

        // FRAME 1864 looks wrong, try to fine tune against the video recprdings
        // FRAME 1953 looks wrong (head more bend forward)
        // getting up from the ground looks wrong

        // const spine = this.bpc.getSpine(this.bpl)
        // mat4.mul(spine, spine, hip)
        const spine = this.bpc.getSpine(this.bpl)
        const invSpine = mat4.invert(mat4.create(), spine)!
        const relSpine = mat4.mul(mat4.create(), invHip, spine)
        const spineQuat = quat2.fromMat4(quat2.create(), relSpine)
        const spineDelta = quaternion_slerp(REST_QUAT, spineQuat, 0.5) // FIXME
        mat4.fromQuat2(relSpine, spineDelta)
        // only spine04 & spine05???
        // setPose("spine01", relShoulder)
        // setPose("spine02", relShoulder)
        setPose("spine04", relSpine)
        setPose("spine05", relSpine)

        const shoulder = this.bpc.getShoulder(this.bpl)
        const invShoulder = mat4.invert(mat4.create(), shoulder)!
        const relShoulder = mat4.mul(mat4.create(), invSpine, shoulder)
        setPose("spine01", relShoulder) // FIXME: better to add this to the clavicle?

        const head = this.bpc.getHead(this.bpl)
        const relHead = mat4.mul(mat4.create(), invShoulder, head)
        const headQuat = quat2.fromMat4(quat2.create(), relHead)
        const headDelta = quaternion_slerp(REST_QUAT, headQuat, 0.25)
        mat4.fromQuat2(relHead, headDelta)
        setPose("neck01", relHead)
        setPose("neck02", relHead)
        setPose("neck03", relHead)
        setPose("head", relHead)

        setPoseX("upperarm01.L", this.bpc.getLeftUpperArmWithAdjustment(this.bpl))
        setPoseX("lowerarm01.L", this.bpc.getLeftLowerArm(this.bpl))
        setPoseX("wrist.L", this.bpc.getLeftHand(this.bpl))
        setPoseX("upperarm01.R", this.bpc.getRightUpperArmWithAdjustment(this.bpl))
        setPoseX("lowerarm01.R", this.bpc.getRightLowerArm(this.bpl))
        setPoseX("wrist.R", this.bpc.getRightHand(this.bpl))
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
