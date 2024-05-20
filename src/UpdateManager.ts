import { ExpressionManager } from "expression/ExpressionManager"
import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { PoseModel } from "pose/PoseModel"
import { RenderList } from "render/RenderList"
import { ModelReason } from "toad.js/model/Model"
import { Skeleton as ChordataSkeleton } from "chordata/Skeleton"

/**
 * All presentation models report changes to the update manager
 * which will the update the domain model.
 */
export class UpdateManager {
    expressionManager: ExpressionManager
    poseModel: PoseModel
    modifiedMorphNodes = new Set<SliderNode>()
    modifiedExpressionPoseUnits = new Set<NumberRelModel>()
    modifiedPosePoseUnits = new Set<NumberRelModel>()
    modifiedPoseNodes = new Set<PoseNode>()

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

    constructor(expressionManager: ExpressionManager, poseModel: PoseModel, sliderNodes: SliderNode) {
        this.expressionManager = expressionManager
        this.poseModel = poseModel

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

        // observe pose pose units
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
        // from all pose units to PoseNode.(x|y|z)
        if (this.modifiedExpressionPoseUnits.size > 0) {
            // console.log(`UpdateManager::update(): pose units have changed`)
            this.expressionManager.poseUnitsToPoseNodes()
            this.modifiedExpressionPoseUnits.clear()
        }

        if (this.modifiedPosePoseUnits.size > 0) {
            // console.log(`UpdateManager::update(): pose units have changed`)
            this.poseModel.poseUnitsToPoseNodes()
            this.modifiedPosePoseUnits.clear()
        }

        // SET_POSE_MATRIX
        // from PoseUnit.(x|y|z) to Bone.matPose
        if (this.modifiedPoseNodes.size > 0) {
            // console.log(`UpdateManager::update(): pose nodes have changed -> set Bone.matPose`)
            // this.expressionManager.skeleton.poseNodes.copyAllToSkeleton()
            this.modifiedPoseNodes.forEach((poseNode) => poseNode.copyEulerToBoneMatPose())
            this.modifiedPoseNodes.clear()
            skeletonChanged = true
        }

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
