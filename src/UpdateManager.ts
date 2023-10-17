import { ExpressionManager } from "expression/ExpressionManager"
import { NumberRelModel } from "expression/NumberRelModel"
import { PoseNode } from "expression/PoseNode"
import { SliderNode } from "modifier/loadSliders"
import { RenderList } from "render/RenderList"

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

        // TODO: attach to SliderNodes (aka. MorphNodes, MorphParameters, MorphSettings, ...)
        // expressionManager.skeleton.scene.human.modifiers.forEach( modifier => {
        //     this.modifiedMorphNodes.add(modifier)
        // })

        function forEachSliderPoseNode(node: SliderNode | undefined, cb: (node: SliderNode) => void) {
            if (node === undefined) {
                return
            }
            cb(node)
            forEachSliderPoseNode(node.next, cb)
            forEachSliderPoseNode(node.down, cb)
        }
        forEachSliderPoseNode(sliderNodes, node => node.model?.modified.add( () => this.modifiedMorphNodes.add(node)))
       

        // console.log(`UpdateManager: observe ${expressionManager.model.poseUnit.length} pose units`)
        expressionManager.model.poseUnits.forEach( poseUnit => {
            poseUnit.modified.add( () => {
                // console.log(`UpdateManager: face pose unit '${poseUnit.label}' has changed to ${poseUnit.value}`)
                this.modifiedPoseUnits.add(poseUnit)
            })
        })


        function forEachPoseNode(node: PoseNode | undefined, cb: (node: PoseNode) => void) {
            if (node === undefined) {
                return
            }
            cb(node)
            forEachPoseNode(node.next, cb)
            forEachPoseNode(node.down, cb)
        }
        forEachPoseNode(expressionManager.skeleton.poseNodes, poseNode => {

        // expressionManager.model.bone.forEach( poseNode => {
            // FIXME: x,y,z should trigger PoseNode.modified and we just listen to that one
            poseNode.x.modified.add( () => {
                this.modifiedPoseNodes.add(poseNode)
            })
            poseNode.y.modified.add( () => {
                this.modifiedPoseNodes.add(poseNode)
            })
            poseNode.z.modified.add( () => {
                this.modifiedPoseNodes.add(poseNode)
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
            this.modifiedMorphNodes.forEach( n => {
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
            this.modifiedPoseNodes.forEach( poseNode => poseNode.updateBonesMatPose() )
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
