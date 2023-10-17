import { ExpressionManager } from "expression/ExpressionManager"
import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { RenderList } from "render/RenderList"
import { ModelReason } from "toad.js/model/Model"

/**
 * All presentation models report changes to the update manager
 * which will the update the domain model.
 */
export class UpdateManager {
    expressionManager: ExpressionManager
    modifiedMorphNodes = new Set<SliderNode>()
    modifiedPoseUnits = new Set<NumberRelModel>()
    modifiedPoseNodes = new Set<PoseNode>()

    constructor(expressionManager: ExpressionManager, sliderNodes: SliderNode) {
        this.expressionManager = expressionManager

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
                    // console.log(`UpdateManager: face pose unit '${node.model?.label}' has changed to ${node.model?.value}`)
                    this.modifiedMorphNodes.add(node)
                }
            })
        )

        // observe expression pose units
        expressionManager.model.poseUnits.forEach((poseUnit) => {
            poseUnit.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.trace(`UpdateManager: face pose unit '${poseUnit.label}' has changed to ${poseUnit.value}`)
                    this.modifiedPoseUnits.add(poseUnit)
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
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.y.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
            poseNode.z.modified.add((reason) => {
                if (reason === ModelReason.ALL || reason === ModelReason.VALUE) {
                    // console.log(`UpdateManager: face pose unit '${poseNode.bone.name}' has changed}`)
                    this.modifiedPoseNodes.add(poseNode)
                }
            })
        })
    }

    renderList?: RenderList

    setRenderList(renderList?: RenderList) {
        this.renderList = renderList
    }

    // the nice thing is, this method also serves as an overview of the data flow
    updateIt() {
        let skeletonChanged = false
        let skinChanged = false

        if (this.modifiedMorphNodes.size > 0) {
            // console.log(`UpdateManager::update(): morph nodes have changed -> set modifiers, morph & update skeleton`)
            // if (this.update === UpdateSteps.SET_MORPH_MODIFIERS) {
            this.modifiedMorphNodes.forEach((n) => {
                n.modifier!.updateValue(n.model!.value)
                // scene.updateRequired = Update.MORPH
            })
            this.modifiedMorphNodes.clear()
            // }

            // if (this.update <= UpdateSteps.UPDATE_MORPHED_MESH) {
            this.expressionManager.skeleton.scene.calculateVertexMorphed()
            // }

            // if (this.update <= UpdateSteps.UPDATE_SKELETON) {
            this.expressionManager.skeleton.updateJoints()
            this.expressionManager.skeleton.build()

            skeletonChanged = true
        }

        // SET_POSE_UNITS
        // from all pose units to PoseNode.(x|y|z)
        if (this.modifiedPoseUnits.size > 0) {
            // console.log(`UpdateManager::update(): pose units have changed`)
            this.expressionManager.poseUnitsToPoseNodes()
            this.modifiedPoseUnits.clear()
        }

        // SET_POSE_MATRIX
        // from PoseUnit.(x|y|z) to Bone.matPose
        if (this.modifiedPoseNodes.size > 0) {
            // console.log(`UpdateManager::update(): pose nodes have changed -> set Bone.matPose`)
            this.modifiedPoseNodes.forEach((poseNode) => poseNode.updateBonesMatPose())
            this.modifiedPoseNodes.clear()
            skeletonChanged = true
        }

        // UPDATE_SKINNING_MATRIX
        if (skeletonChanged) {
            // console.log(`UpdateManager::update(): skeleton has changed -> update skinning matrix`)
            this.expressionManager.skeleton.update()
            skinChanged = true
        }

        // UPDATE SKIN MESH AND OPENGL BUFFERS
        if (this.renderList !== undefined) {
            if (skinChanged) {
                // console.log(`UpdateManager::update(): skin has changed`)
                this.expressionManager.skeleton.scene.calculateVertexRigged()
                this.renderList.update()
            }
        }
    }
}
