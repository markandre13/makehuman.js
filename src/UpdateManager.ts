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
import { Bone } from "skeleton/Bone"
import { blendshape2poseUnit } from "net/Frontend_impl"

let em2: ExpressionManager2 | undefined

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
        // from all pose units to PoseNode.(x|y|z)
        // if (this.modifiedExpressionPoseUnits.size > 0) {
        //     // console.log(`UpdateManager::update(): pose units have changed`)
        //     this.expressionManager.poseUnitsToPoseNodes()
        //     this.modifiedExpressionPoseUnits.clear()
        // }

        // if (this.modifiedPosePoseUnits.size > 0) {
        //     // console.log(`UpdateManager::update(): pose units have changed`)
        //     this.poseModel.poseUnitsToPoseNodes()
        //     this.modifiedPosePoseUnits.clear()
        // }

        // SET_POSE_MATRIX
        // from PoseUnit.(x|y|z) to Bone.matPose
        // if (this.modifiedPoseNodes.size > 0) {
        //     // console.log(`UpdateManager::update(): pose nodes have changed -> set Bone.matPose`)
        //     // this.expressionManager.skeleton.poseNodes.copyAllToSkeleton()
        //     this.modifiedPoseNodes.forEach((poseNode) => poseNode.copyEulerToBoneMatPose())
        //     this.modifiedPoseNodes.clear()
        //     skeletonChanged = true
        // }

        // experimental head rotation
        // data we do not have: head moving forward, backwards (when camera is not mounted to head,
        // we could extrapolate that from the z translation

        const REST_QUAT = quat2.create()

        if (this.app.frontend.transform) {
            const neck1 = this.expressionManager.skeleton.getBone("neck01")
            const neck2 = this.expressionManager.skeleton.getBone("neck02")
            const neck3 = this.expressionManager.skeleton.getBone("neck03")
            const head = this.expressionManager.skeleton.getBone("head")

            const t = this.app.frontend.transform
            let m = mat4.fromValues(t[0], t[1], t[2], 0, t[4], t[5], t[6], 0, t[8], t[9], t[10], 0, 0, 0, 0, 1)
            const { x, y, z } = euler_from_matrix(m)
            head.matPose = euler_matrix(0, 0, z)
            const neckXY = euler_matrix(x, y, 0)

            let q = quat2.create()
            quat2.fromMat4(q, neckXY)
            q = quaternion_slerp(REST_QUAT, q, 0.3333333333)
            mat4.fromQuat2(neck1.matPose, q)
            mat4.fromQuat2(neck2.matPose, q)
            mat4.fromQuat2(neck3.matPose, q)
            // mat4.fromQuat2(head.matPose, q)
            // mat4.multiply(head.matPose, headZ, head.matPose)

            // for(let i of [0,1,2, 4,5,6, 8,9,10]) {
            //     head.matPose[i] = m1[i]
            // }
        }
        // experimental jawOpen
        // TODO: extend to handle all blendshape weights:
        // 1: have places for quat2s of all bones (inside the bone would be fastest)
        // 2: fill them
        // 3: copy them to matPose
        // when done:
        // tweak copying values to ExpressionManager2 to better resemble the ARKit blendshapes
        {
            if (em2 === undefined) {
                em2 = new ExpressionManager2(this.expressionManager)
            }
            const weight = this.app.frontend.getBlendshapeWeight("jawOpen")
            const a = em2.blendshapes.get("jawOpen")!
            for(let b of a) {
                const q = quaternion_slerp(REST_QUAT, b.q, weight)
                mat4.fromQuat2(b.bone.matPose, q)
            }
        }
        skeletonChanged = true

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

interface BQ {
    bone: Bone
    q: quat2
}

class ExpressionManager2 {
    blendshapes = new Map<string, BQ[]>()
    constructor(expressionManager: ExpressionManager) {
        // convert the BVH file data in ExpressionManager into a simplified data structure with quaternions
        const identity = mat4.create()
        const skeleton =  expressionManager.skeleton
        const base_anim = expressionManager.base_anim
        const nBones = skeleton.boneslist!.length
        for(let [name, frame] of expressionManager.poseUnitName2Frame) {
            const list: BQ[] = []
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m = base_anim[frame * nBones + b_idx]
                if (!mat4.equals(identity, m)) {
                    list.push({
                        bone: skeleton.boneslist![b_idx],
                        q:  quat2.fromMat4(quat2.create(), m)
                    })
                }
            }
            if (list.length !== 0) {
                for(let pair of blendshape2poseUnit) {
                    if (pair[1] === name) {
                        this.blendshapes.set(pair[0], list)
                    }
                }
            }
        }
    }
}
