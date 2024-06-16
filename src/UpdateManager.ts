import { ExpressionManager } from "expression/ExpressionManager"
import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { PoseModel } from "pose/PoseModel"
import { RenderList } from "render/RenderList"
import { ModelReason } from "toad.js/model/Model"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"
import { Application } from "Application"
import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { euler_from_matrix, euler_matrix } from "lib/euler_matrix"
import { BlendshapeConverter } from "blendshapes/BlendshapeConverter"

export const REST_QUAT = quat2.create()

/**
 * All presentation models report changes to the update manager
 * which will the update the domain model.
 */
export class UpdateManager {
    app: Application
    expressionManager: ExpressionManager
    poseModel: PoseModel
    modifiedMorphNodes = new Set<SliderNode>()
    modifiedExpressionPoseUnits = new Set<NumberRelModel>()
    modifiedPosePoseUnits = new Set<NumberRelModel>()
    modifiedPoseNodes = new Set<PoseNode>()
    blendshapeConverter?: BlendshapeConverter

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
        // expressionManager: ExpressionManager, poseModel: PoseModel, sliderNodes: SliderNode) {
        this.expressionManager = app.expressionManager
        this.poseModel = app.poseModel
        const sliderNodes = app.sliderNodes
        const expressionManager = app.expressionManager
        const poseModel = app.poseModel

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

        // observe expression pose units
        expressionManager.model.poseUnits.forEach((poseUnit) => {
            poseUnit.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseUnit.label}' has changed to ${poseUnit.value}`)
                    this.invalidateView()
                    this.modifiedExpressionPoseUnits.add(poseUnit)
                }
            })
        })

        // observe pose units
        poseModel.poseUnits.forEach((poseUnit) => {
            poseUnit.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: body pose unit '${poseUnit.label}' has changed to ${poseUnit.value}`)
                    this.invalidateView()
                    this.modifiedPosePoseUnits.add(poseUnit)
                }
            })
        })

        // observe bone pose nodes
        function forEachBonePoseNode(node: PoseNode | undefined, cb: (node: PoseNode) => void) {
            if (node === undefined) {
                return
            }
            cb(node)
            forEachBonePoseNode(node.next, cb)
            forEachBonePoseNode(node.down, cb)
        }
        forEachBonePoseNode(expressionManager.skeleton.poseNodes, (poseNode) => {
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

            this.expressionManager.skeleton.humanMesh.calculateVertexMorphed()
            this.expressionManager.skeleton.updateJoints()
            this.expressionManager.skeleton.build()

            skeletonChanged = true
        }

        // SET_POSE_UNITS
        if (this.blendshapeConverter === undefined) {
            this.blendshapeConverter = new BlendshapeConverter(this.app.frontend.blendshapeModel, this.app.expressionManager)
        }
        this.blendshapeConverter.convert()

        // experimental head rotation
        // real neck and head positioning would actually require two transforms: neck AND head.
        // as an approximation, this just evenly distributes the head rotation over neck and head joints
        if (this.app.frontend.transform) {
            const neck1 = this.expressionManager.skeleton.getBone("neck01")
            const neck2 = this.expressionManager.skeleton.getBone("neck02")
            const neck3 = this.expressionManager.skeleton.getBone("neck03")
            const head = this.expressionManager.skeleton.getBone("head")

            const t = this.app.frontend.transform
            let m = mat4.fromValues(t[0], t[1], t[2], 0, t[4], t[5], t[6], 0, t[8], t[9], t[10], 0, 0, 0, 0, 1)
            let q = quat2.create()
            quat2.fromMat4(q, m)
            q = quaternion_slerp(REST_QUAT, q, .25)
            mat4.fromQuat2(head.matPose, q)
            mat4.fromQuat2(neck1.matPose, q)
            mat4.fromQuat2(neck2.matPose, q)
            mat4.fromQuat2(neck3.matPose, q)
        }


        skeletonChanged = true
        // }

        // UPDATE_SKINNING_MATRIX
        if (this._chordataChanged !== undefined) {
            this._chordataChanged.update()
            this.expressionManager.skeleton.updateChordata(this._chordataChanged)
            skinChanged = true
            this._chordataChanged = undefined
        } else {
            if (skeletonChanged) {
                // console.log(`UpdateManager::update(): skeleton has changed -> update skinning matrix`)
                this.expressionManager.skeleton.update()
                skinChanged = true
            }
        }

        // UPDATE SKIN MESH AND OPENGL BUFFERS
        if (this.renderList !== undefined) {
            if (skinChanged) {
                // console.log(`UpdateManager::update(): skin has changed`)
                this.expressionManager.skeleton.humanMesh.calculateVertexRigged()
                this.renderList.update()
            }
        }
    }
}
