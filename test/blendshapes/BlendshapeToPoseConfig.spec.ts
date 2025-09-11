// import { expect, use } from 'chai'
// import { chaiAlmost } from "../chai/chaiAlmost"
// use(chaiAlmost())

// import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
// import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

// import { BlendShapeEditor } from '../../src/blendshapes/BlendShapeEditor'
// import { Application } from "../../src/Application"
// import { html } from 'toad.js'

// import { style as txBase } from "toad.js/style/tx"
// import { style as txStatic } from "toad.js/style/tx-static"
// import { style as txDark } from "toad.js/style/tx-dark"

// document.head.replaceChildren(txBase, txStatic, txDark)

// describe("BlendshapeToPoseConfig", function () {

//     // let human: MorphManager
//     // let obj: WavefrontObj
//     // let humanMesh: HumanMesh
//     // let skeleton: Skeleton

//     this.beforeAll(function () {
//         FileSystemAdapter.setInstance(new HTTPFSAdapter())
//         document.head.replaceChildren(txBase, txStatic, txDark)
//     //     human = new MorphManager()
//     //     obj = new WavefrontObj('data/3dobjs/base.obj')
//     //     humanMesh = new HumanMesh(human, obj)
//     //     skeleton = loadSkeleton(humanMesh, "data/rigs/default.mhskel")
//     })

//     // it("makeDefaultBlendshapeToPoseConfig()", function() {
//     //     const blendshapeToPoseConfig = makeDefaultBlendshapeToPoseConfig(skeleton)

//     //     const l = blendshapeToPoseConfig.get("cheekSquintLeft")
//     //     expect(l).to.not.be.undefined
//     //     const lw = l!.poseUnitWeight.get("LeftCheekUp")
//     //     expect(lw).to.equal(1)

//     //     const r = blendshapeToPoseConfig.get("cheekSquintRight")
//     //     expect(r).to.not.be.undefined
//     //     const rw = r!.poseUnitWeight.get("RightCheekUp")
//     //     expect(rw).to.equal(1)

//     //     // blendshape weights from backend (e.g. mediapipe, live link)
//     //     const blendshapeModel = new BlendshapeModel()

//     //     // load makehumans original face pose units
//     //     const faceposeunits = new MHFacePoseUnits(skeleton)

//     //     // load makehuman.js user editable blendshape to pose configuration

//     //     // convert user editable pose configuration to optimized blendshape to pose set
//     //     const blendshape2pose = new BlendshapeToPose()
//     //     blendshapeToPoseConfig.convert(faceposeunits, blendshape2pose)
//     // })
    
//     it("Application", function() {
//         const app = new Application()
//         const editor = BlendShapeEditor.getInstance(app)
//         editor.blendshape.value = "cheekSquintLeft"
//         app.updateManager.updateIt()
//         editor.blendshape.value = "cheekSquintRight"
//         app.updateManager.updateIt()

//         // console.log("cheekSquintLeft")
//         // console.log(app.blendshapeToPoseConfig.get("cheekSquintLeft")?.poseUnitWeight.get("LeftCheekUp"))
//         // console.log(app.blendshapeToPoseConfig.get("cheekSquintLeft")?.poseUnitWeight.value)
//         // console.log("cheekSquintRight")
//         // console.log(app.blendshapeToPoseConfig.get("cheekSquintRight")?.poseUnitWeight.get("RightCheekUp"))
//         // console.log(app.blendshapeToPoseConfig.get("cheekSquintRight")?.poseUnitWeight)

//     })
// })
