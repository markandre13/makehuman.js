import { expect, use } from '@esm-bundle/chai'
// @ts-ignore
import { chaiString } from '../chaiString'
use(chaiString)

import { Human } from '../../src//Human'
import { HumanMesh } from '../../src/mesh/HumanMesh'
import { WavefrontObj } from '../../src/mesh/WavefrontObj'
import { loadSkeleton } from '../../src/skeleton/loadSkeleton'

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

import { exportCollada } from "../../src/mesh/Collada"
import { testCube } from "../../src/mesh/testCube"


import { parseXML, Tag, Text } from "./xml"

// TODO: have a look at BVH files (blender can export them, try that 1st)
// TODO: this only works for meshId 0 because
//   first index is 0
//   first vertex is 0
// TODO: the the other meshes/proxy meshes
// TODO: export material
// TODO: export normals
// TODO: export UV

describe("Collada", function () {

    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("load a valid collada and check it", function () {
        const data = FileSystemAdapter.getInstance().readFile("data/test.dae")
        checkCollada("data/test.dae", data)
    })

    it("create weights", function() {
        const scene = testCube
        const out = new Array<Array<Array<number>>>(scene.vertex.length/3)
        for(let i=0; i<out.length; ++i) {
            out[i] = new Array()
        }

        const allBoneNames: string[] = []
        const allWeights: number[] = []

        scene.human.__skeleton.vertexWeights!._data.forEach((data, boneName) => {
            const boneIndex = allBoneNames.length
            allBoneNames.push(boneName)
            const indices = data[0] as number[]
            const weights = data[1] as number[]
            for(let i=0; i<indices.length; ++i) {
                const index = indices[i]
                const weight = weights[i]
                const weightIndex = allWeights.length
                allWeights.push(weight)
                out[index].push([boneIndex, weightIndex])
            }
        })

        // boneNames
        console.log(allBoneNames.join(" "))
        // allWeights
        console.log(allWeights.join(" "))
        // vcount
        console.log(out.map(e => e.length).join(" "))
        // v
        const o: number[] = []
        out.forEach( x => {
            x.forEach( y =>
                y.forEach( z => 
                    o.push(z)
                )
            )
        })
        console.log(o.join(" "))

    })

    it("test cube", function () {
        const xml = exportCollada(testCube)
        
        const document = parseXML("exportCollada()", xml)

        const collada = findTag(document, "COLLADA")
        expect(collada).to.not.be.undefined

        // scene
        //     instance_visual_scene.url=#{sceneId}
        const scene = findTag(collada, "scene")
        const instance_visual_scene = findTag(scene, "instance_visual_scene")
        const sceneId = reference(instance_visual_scene.attributes.get("url"))

        // library_visual_scenes
        //     visual_scene id={sceneId}
        //         node type=NODE
        //             node type=JOINT id={skeletonId}
        //                 ...more joints...
        //             node type=NODE
        //                 instance_controller.url=#{controllerId}
        //                     skeleton -> #{skeletonId}
        const library_visual_scenes = findTag(collada, "library_visual_scenes")
        const visual_scene = findTag(library_visual_scenes, "visual_scene")
        expect(visual_scene.attributes.get("id")).to.equal(sceneId)

        const rootNode = findTag(visual_scene, "node")
        expect(rootNode.attributes.get("type")).to.equal("NODE")
        const nodes = findTags(rootNode, "node")
        expect(nodes).to.have.lengthOf(2)

        const controllerNode = nodes[1]
        expect(controllerNode.attributes.get("type")).to.equal("NODE")
        const instance_controller = findTag(controllerNode, "instance_controller")
        const constollerId = reference(instance_controller.attributes.get("url"))
        const skeleton = findTag(instance_controller, "skeleton")
        const skeletonId = reference(text(skeleton))

        const skeletonNode = nodes[0]
        expect(skeletonNode.attributes.get("type")).to.equal("JOINT")
        expect(skeletonNode.attributes.get("id")).to.equal(skeletonId)

        // COLLADA 1.4.1 p. 4-7
        // A skinning <controller> associates a geometry with a skeleton.
        // The skeleton is considered to be in it's resting position. or bind pose.
        // The bind pose is the world-space position and orientation of each joint
        // when the skeleton was bound to the geometry.
        // This world space is also called the bind-pose space to distinguish it
        // from other world-space coordinates systems.

        // library_controllers
        //     controller id={controllerId}
        //         skin source=#${skinId}
        //             source ; jointName to jointIndex
        //             source ; jointIndex to InvBindMatrix
        //             source ; jointIndex to weights
        //             joints
        //                 input ; jointIndex
        //                 input ; invBindMatrixIndex
        //             vertex_weights
        //                 input ; jointIndex
        //                 input ; weightIndex
        //                 vcount
        //                 v
        const library_controllers = findTag(collada, "library_controllers")
        const controller = findTag(library_controllers, "controller")
        expect(controller.attributes.get("id")).to.equal(constollerId)

        const skin = findTag(controller, "skin")
        const skinId = reference(skin.attributes.get("source"))

        const jointsNode = findTag(skin, "joints")
        const jointInputs = findTags(jointsNode, "input")
        expect(jointInputs).to.have.lengthOf(2)
        expect(jointInputs[0].attributes.get("semantic")).to.equal("JOINT")
        const jointsJointId = reference(jointInputs[0].attributes.get("source"))
        expect(jointInputs[1].attributes.get("semantic")).to.equal("INV_BIND_MATRIX")
        const jointsInvBindMatrixId = reference(jointInputs[1].attributes.get("source"))

        const vertexWeights = findTag(skin, "vertex_weights")
        expect(vertexWeights.getAttribute("count")).to.equal("12")
        const vertexWeightInputs = findTags(vertexWeights, "input")
        expect(vertexWeightInputs).to.have.lengthOf(2)
        expect(vertexWeightInputs[0].attributes.get("semantic")).to.equal("JOINT")
        const vertexWeightsJointsId = reference(vertexWeightInputs[0].attributes.get("source"))
        expect(vertexWeightInputs[1].attributes.get("semantic")).to.equal("WEIGHT")
        const vertexWeightsWeightId = reference(vertexWeightInputs[1].attributes.get("source"))
        const vertexWeightVCount = findTag(vertexWeights, "vcount")
        expect(parseNumbers(vertexWeightVCount)).to.have.lengthOf(12)
        const vertexWeightV = findTag(vertexWeights, "v")
        expect(parseNumbers(vertexWeightV)).to.have.lengthOf(32)

        const skinSources = findTags(skin, "source")
        expect(skinSources).to.have.lengthOf(3)

        const skinSourceJointNames = skinSources[0]
        expect(skinSourceJointNames.attributes.get("id")).to.equal(jointsJointId)
        expect(skinSourceJointNames.attributes.get("id")).to.equal(vertexWeightsJointsId)
        const jointNames = findTag(skinSourceJointNames, "Name_array")

        const skinSourcesBindPoses = skinSources[1]
        expect(skinSourcesBindPoses.getAttribute("id")).to.equal(jointsInvBindMatrixId)
        const invBindMatrix = findTag(skinSourcesBindPoses, "float_array")
        expect(parseNumbers(invBindMatrix)).to.have.lengthOf(2 * 16)

        const skinSourcesWeights = skinSources[2]
        expect(skinSourcesWeights.getAttribute("id")).to.equal(vertexWeightsWeightId)
        const weights = findTag(skinSourcesWeights, "float_array")
        expect(weights.getAttribute("count")).to.equal("16")
        expect(parseNumbers(weights)).to.be.lengthOf(16)

        // library_geometries
        //     geometry
        //         mesh
        //             source ; position
        //             source ; normal
        //             vertices
        //             triangles
        const library_geometries = findTag(collada, "library_geometries")
        const geometry = findTag(library_geometries, "geometry")
        expect(geometry.attributes.get("id")).to.equal(skinId)

        const mesh = findTag(geometry, "mesh")

        const triangles = findTag(mesh, "triangles") // FIXME: the makehuman mesh has lot's of quads which look better when subsurfacing
        expect(triangles.attributes.get("count")).to.equal("20")
        const triangleInput = findTags(triangles, "input")
        expect(triangleInput).to.have.lengthOf(2)

        const vertexInput = triangleInput[0]
        expect(vertexInput.attributes.get("semantic")).to.equal("VERTEX")
        const triangleVertexSource = reference(vertexInput.getAttribute("source"))

        const normalInput = triangleInput[1]
        expect(normalInput.attributes.get("semantic")).to.equal("NORMAL")
        const triangleNormalSource = reference(normalInput.getAttribute("source"))

        const triangleP = findTag(triangles, "p")
        expect(text(triangleP)).to.equal("4 2 0 2 9 10 6 11 9 1 7 5 0 10 8 4 8 11 11 1 5 8 3 1 9 5 7 10 7 3 4 6 2 2 6 9 6 4 11 1 3 7 0 2 10 4 0 8 11 8 1 8 10 3 9 11 5 10 9 7")

        const vertices = findTag(mesh, "vertices")
        expect(vertices.getAttribute("id")).to.equal(triangleVertexSource)
        const verticesInput = findTag(vertices, "input")
        expect(verticesInput.attributes.get("semantic")).to.equal("POSITION")
        const verticesPositionSource = reference(verticesInput.attributes.get("source"))

        const meshSources = findTags(mesh, "source")
        expect(meshSources).to.have.lengthOf(2)

        const vertexPositionSource = meshSources[0]
        expect(vertexPositionSource.attributes.get("id")).to.equal(verticesPositionSource)
        const vertexPositionValues = findTag(vertexPositionSource, "float_array")
        expect(text(vertexPositionValues)).to.equal("1 1 1 1 1 -1 1 -1 1 1 -1 -1 -1 1 1 -1 1 -1 -1 -1 1 -1 -1 -1 1 1 0 -1 -1 0 1 -1 0 -1 1 0")

        const normalSource = meshSources[1]
        expect(normalSource.attributes.get("id")).to.equal(triangleNormalSource)

        // console.log(xml)
    })

    it.only("exportCollada() with real world data", function () {
        const human = Human.getInstance()
        const obj = new WavefrontObj()
        obj.load('data/3dobjs/base.obj.z')
        human.meshData = obj
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton('data/rigs/default.mhskel.z')
        human.setBaseSkeleton(skeleton)

        exportCollada(scene)

        // console.log(dumpBone(skeleton.roots[0])

        // checkCollada("exportCollada()", exportCollada(scene))
    })

    function checkCollada(filename: string, data: string) {
        const document = parseXML(filename, data)
        // console.log(document)

        const collada = findTag(document, "COLLADA")
        expect(collada).to.not.be.undefined
        const library_geometries = findTag(collada, "library_geometries")
        expect(library_geometries).to.not.be.undefined

        const geometries = findTags(library_geometries, "geometry")
        console.log(geometries)
        expect(geometries).to.be.not.empty

        const geometry = geometries[0]
        // geometries.forEach( geometry => {
        const mesh = findTag(geometry, "mesh")
        expect(mesh).to.be.not.undefined
        const polylist = findTag(mesh, "polylist")
        expect(polylist).to.be.not.undefined
        const polylistCount = parseInt(polylist!.getAttribute("count"))

        const vcount = findTag(polylist, "vcount")
        expect(vcount).to.be.not.undefined
        const vcountData = parseNumbers(vcount!)
        expect(vcountData).to.have.lengthOf(polylistCount)

        const polygons = findTag(polylist, "vcount")
        expect(polygons).to.be.not.undefined
        const polygonsData = parseNumbers(polygons!)
        expect(polygonsData).to.have.lengthOf(polylistCount)
    }
})

function parseNumbers(node: Tag) {
    return text(node)
        .split(" ")
        .map(n => parseFloat(n))
        .filter(n => !isNaN(n))
}

function findTag(node: Tag | undefined, name: string): Tag {
    const tags = findTags(node, name)
    if (tags.length !== 1) {
        throw Error(`failed to find exactly one <${name}>`)
    }
    return tags[0]
}

function findTags(node: Tag | undefined, name: string): Tag[] {
    if (node === undefined) {
        return []
    }
    return node
        .children
        .filter(
            c => c instanceof Tag && c.name === name
        ) as Tag[]
}

function text(tag: Tag): string {
    if (tag.children.length !== 1) {
        throw Error()
    }
    if (!(tag.children[0] instanceof Text)) {
        throw Error()
    }
    return (tag.children[0] as Text).text.trim()
}

function reference(ref: string | undefined): string {
    if (ref === undefined) {
        throw Error(`reference is not defined`)
    }
    if (ref.length === 0 || ref.charAt(0) !== '#') {
        throw Error(`'${ref}' must begin with '#'`)
    }
    return ref.substring(1)
}