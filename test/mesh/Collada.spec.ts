import { expect, use } from '@esm-bundle/chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { Human } from '../../src/modifier/Human'
import { HumanMesh } from '../../src/mesh/HumanMesh'
import { loadSkeleton } from '../../src/skeleton/loadSkeleton'

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

import {
    exportCollada, Geometry, Material,
    prepareControllerAddBoneWeights,
    prepareControllerFlatWeightMap,
    prepareControllerInit,
    prepareControllers,
    prepareMesh,
    toEuler
} from "../../src/mesh/Collada"
import { testCube } from "../../src/mesh/testCube"

import { parseXML, Tag, Text } from "./xml"
import { VertexBoneWeights } from '../../src/skeleton/VertexBoneWeights'
import { Bone } from '../../src/skeleton/Bone'
import { mat4, vec3, vec4 } from 'gl-matrix'
import { WavefrontObj } from '../../src/mesh/WavefrontObj'

export function prepareGeometry(materials: Material[], geometry: Geometry) {
    for (let m = 0; m < materials.length; ++m) {
        prepareMesh(materials[m].xyz, materials[m].uv, materials[m].fxyz, materials[m].fuv, materials[m].start, materials[m].length, geometry)
    }
}

describe("Collada", function () {

    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("load a valid collada and check it", function () {
        const data = FileSystemAdapter.getInstance().readFile("data/test.dae")
        checkCollada("data/test.dae", data)
    })

    xit("test cube", function () {
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

    xit("exportCollada() with real world data", function () {
        const human = new Human()
        const obj = new WavefrontObj('data/3dobjs/base.obj')
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton(scene, 'data/rigs/default.mhskel.z')
        scene.skeleton = skeleton

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

    describe("helper functions", () => {
        const boneMap: Map<string, Bone> = new Map()
        boneMap.set("b0", { index: 0 } as Bone)
        boneMap.set("b1", { index: 1 } as Bone)

        // BASE MESH

        const vertexWeights0 = {
            _data: new Map()
        } as VertexBoneWeights
        vertexWeights0._data.set("b0", [
            [0, 1, 2, 3],
            [0, 0, .5, .5]
        ])
        vertexWeights0._data.set("b1", [
            [2, 3, 4, 5],
            [.5, .5, 1, 1]
        ])

        //  0   2   4
        //
        //  1   3   5
        const xyz0 = new Float32Array([
            0, 0, 0,
            0, 1, 0,
            1, 0, 0,
            1, 1, 0,
            2, 0, 0,
            2, 1, 0
        ])
        const fxyz0 = [
            0, 2, 3, 1,
            2, 4, 5, 3,
        ]
        const uv0 = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])
        const fuv0: number[] = [
            0, 1, 2, 3,
            0, 1, 2, 3
        ]

        // PROXY MESH

        const vertexWeights1 = {
            _data: new Map()
        } as VertexBoneWeights
        vertexWeights1._data.set("b0", [
            [0, 1, 2, 3],
            [1, 1, .3, .3]
        ])
        vertexWeights1._data.set("b1", [
            [2, 3, 4, 5],
            [.7, .7, 1, 1]
        ])

        const xyz1 = new Float32Array([
            0, 0, 1,
            0, 1, 1,
            1, 0, 1,
            1, 1, 1,
            2, 0, 1,
            2, 1, 1,
        ])
        const fxyz1 = [
            0, 2, 3, 1,
            2, 4, 5, 3,
        ]
        const uv1 = new Float32Array([
            0.2, 0.9,
            0.8, 0.9,
            0.8, 0.1,
            0.2, 0.1,
        ])
        const fuv1: number[] = [
            3, 2, 1, 0,
            3, 2, 1, 0,
        ]

        // TODO: replace with RenderMesh or it's base class
        const materials: Material[] = [
            { xyz: xyz0, fxyz: fxyz0, uv: uv0, fuv: fuv0, vertexWeights: vertexWeights0, start: 0, length: 4, name: "ONE", r: 1, g: 0, b: 0 },
            { xyz: xyz0, fxyz: fxyz0, uv: uv0, fuv: fuv0, vertexWeights: vertexWeights0, start: 4, length: 4, name: "TWO", r: 0, g: 1, b: 0 }
        ]

        describe("prepareGeometry()", () => {
            it("single mesh", () => {
                const geometry = new Geometry()
                prepareGeometry(materials, geometry)
                expect(geometry.indices.length).to.equal(2)
                expect(geometry.xyz).to.have.lengthOf(6 * 3)
                expect(geometry.uv).to.have.lengthOf(4 * 2)
                expect(geometry.getQuadXYZ(0, 0)).to.deep.equal([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]])
                expect(geometry.getQuadUV(0, 0)).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 1]])
                expect(geometry.getQuadXYZ(1, 0)).to.deep.equal([[1, 0, 0], [2, 0, 0], [2, 1, 0], [1, 1, 0]])
                expect(geometry.getQuadUV(1, 0)).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 1]])
            })
            it("two meshes", () => {
                const geometry = new Geometry()
                prepareGeometry([
                    materials[0], materials[1],
                    { xyz: xyz1, fxyz: fxyz1, uv: uv1, fuv: fuv1, vertexWeights: vertexWeights0, start: 0, length: 4, name: "THREE", r: 0, g: 0, b: 1 }
                ], geometry)

                expect(geometry.indices.length).to.equal(3)
                expect(geometry.getQuadXYZ(0, 0)).to.deep.equal([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]])
                expect(geometry.getQuadUV(0, 0)).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 1]])
                expect(geometry.getQuadXYZ(1, 0)).to.deep.equal([[1, 0, 0], [2, 0, 0], [2, 1, 0], [1, 1, 0]])
                expect(geometry.getQuadUV(1, 0)).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 1]])
                expect(geometry.getQuadXYZ(2, 0)).to.deep.equal([[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]])
                expect(geometry.getQuadUV(2, 0)).to.deep.almost.equal([[0.2, 0.1], [0.8, 0.1], [0.8, 0.9], [0.2, 0.9]])
            })
        })
        describe("prepareControllers()", () => {
            it("single mesh", () => {
                const geometry = new Geometry()

                prepareGeometry(materials, geometry)
                const { weights, boneWeightPairs } = prepareControllers(xyz0, vertexWeights0, boneMap, geometry)

                expect(weights.length, 'weights.length').to.equal(3)
                expect(boneWeightPairs.length, 'boneWeightPairs.length').to.equal(6)
                // console.log(getBoneWeight([vertex0], geometry, weights, boneWeightPairs))
                expect(getBoneWeight([xyz0], geometry, weights, boneWeightPairs)).to.deep.equal([
                    [[0], [0]],
                    [[0], [0]],
                    [[0, 1], [0.5, 0.5]],
                    [[0, 1], [0.5, 0.5]],
                    [[1], [1]],
                    [[1], [1]]
                ])
            })
            it("two meshes", () => {
                const geometry = new Geometry()
                prepareGeometry([
                    materials[0], materials[1],
                    { xyz: xyz1, fxyz: fxyz1, uv: uv0, fuv: fuv0, vertexWeights: vertexWeights0, start: 0, length: 8, name: "THREE", r: 0, g: 0, b: 1 }
                ], geometry)

                const { boneWeightPairs, weightMap } = prepareControllerInit(geometry)
                prepareControllerAddBoneWeights(xyz0, vertexWeights0, boneMap, geometry, boneWeightPairs, weightMap)
                prepareControllerAddBoneWeights(xyz1, vertexWeights1, boneMap, geometry, boneWeightPairs, weightMap)
                const weights = prepareControllerFlatWeightMap(weightMap)

                // console.log(getBoneWeight([vertex0, vertex1], geometry, weights, boneWeightPairs))

                expect(getBoneWeight([xyz0, xyz1], geometry, weights, boneWeightPairs)).to.deep.equal([
                    [[0], [0]],
                    [[0], [0]],
                    [[0, 1], [0.5, 0.5]],
                    [[0, 1], [0.5, 0.5]],
                    [[1], [1]],
                    [[1], [1]],
                    [[0], [1]],
                    [[0], [1]],
                    [[0, 1], [0.3, 0.7]],
                    [[0, 1], [0.3, 0.7]],
                    [[1], [1]],
                    [[1], [1]]
                ])
            })
        })
        describe("Geometry collects the data for output in Collada files", () => {
            describe("addQuad()", () => {
                it("can copy a single quad", () => {
                    const xyz = [
                        1, 2, 3,
                        4, 5, 6,
                        7, 8, 9,
                        10, 11, 12,
                    ]
                    const fxyz = [
                        0, 1, 2, 3,
                    ]
                    const uv = [
                        0, 0,
                        1, 0,
                        1, 1,
                        0, 1
                    ]
                    const fuv = [
                        0, 1, 2, 3
                    ]
                    const geometry = new Geometry()
                    const binXyz = new Float32Array(xyz)
                    const binUv = new Float32Array(uv)
                    geometry.addMesh()
                    geometry.addQuad(binXyz, binUv, fxyz, fuv, 0)

                    expect(geometry.indices[0].fxyz).to.deep.equal(fxyz)
                    expect(geometry.xyz).to.deep.equal(xyz)
                    expect(geometry.indices[0].fuv).to.deep.equal(fuv)
                    expect(geometry.uv).to.deep.equal(uv)
                })
                it("two quads with overlapping points will share those points", () => {
                    const xyz = [
                        1, 2, 3,
                        4, 5, 6,
                        7, 8, 9,
                        10, 11, 12,
                        13, 14, 15,
                        16, 17, 18
                    ]
                    const fxyz = [
                        0, 1, 2, 3,
                        2, 3, 4, 5,
                    ]
                    const uv = [
                        1, 2,
                        2, 3,
                        4, 5,
                        6, 7,
                        8, 9,
                        10, 11
                    ]
                    const fuv = [
                        0, 1, 2, 3,
                        2, 3, 4, 5,
                    ]
                    const geometry = new Geometry()
                    const binXyz = new Float32Array(xyz)
                    const binUv = new Float32Array(uv)
                    geometry.addMesh()
                    geometry.addQuad(binXyz, binUv, fxyz, fuv, 0)
                    geometry.addQuad(binXyz, binUv, fxyz, fuv, 4)

                    expect(geometry.indices[0].fxyz).to.deep.equal(fxyz)
                    expect(geometry.xyz).to.deep.equal(xyz)
                    expect(geometry.indices[0].fuv).to.deep.equal(fuv)
                    expect(geometry.uv).to.deep.equal(uv)
                })
                it("when overlapping points are from different sources, they won't be shared", () => {
                    const xyz0 = [
                        1, 2, 3,
                        4, 5, 6,
                        7, 8, 9,
                        10, 11, 12,
                        13, 14, 15,
                        16, 17, 18
                    ]
                    const uv0 = [
                        1, 2,
                        3, 4,
                        5, 6,
                        7, 8,
                        9, 10,
                        11, 12
                    ]
                    const uv1 = [...uv0]
                    const xyz1 = [...xyz0]
                    const fxyz0 = [0, 1, 2, 3]
                    const fxyz1 = [2, 3, 4, 5]
                    const fuv0 = [0, 1, 2, 3]
                    const fuv1 = [2, 3, 4, 5]
                    const geometry = new Geometry()
                    const binXyz0 = new Float32Array(xyz0)
                    const binXyz1 = new Float32Array(xyz1)
                    const binUv0 = new Float32Array(uv0)
                    const binUv1 = new Float32Array(uv1)
                    geometry.addMesh()
                    geometry.addQuad(binXyz0, binUv0, fxyz0, fuv0, 0)
                    geometry.addQuad(binXyz1, binUv1, fxyz1, fuv1, 0)

                    expect(geometry.indices[0].fxyz).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7])
                    expect(geometry.indices[0].fuv).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7])
                    expect(geometry.xyz).to.deep.equal([
                        1, 2, 3,
                        4, 5, 6,
                        7, 8, 9,
                        10, 11, 12,

                        7, 8, 9,
                        10, 11, 12,
                        13, 14, 15,
                        16, 17, 18
                    ])
                    expect(geometry.uv).to.deep.equal([
                        1, 2,
                        3, 4,
                        5, 6,
                        7, 8,

                        5, 6,
                        7, 8,
                        9, 10,
                        11, 12
                    ])
                })
                it("addMesh() will start a new list of indices", () => {
                    const xyz = [
                        1, 2, 3,
                        4, 5, 6,
                        7, 8, 9,
                        10, 11, 12,
                        13, 14, 15,
                        16, 17, 18
                    ]
                    const fxyz = [
                        0, 1, 2, 3,
                        2, 3, 4, 5,
                    ]
                    const uv = [
                        1, 2,
                        2, 3,
                        4, 5,
                        6, 7,
                        8, 9,
                        10, 11
                    ]
                    const fuv = [
                        0, 1, 2, 3,
                        2, 3, 4, 5,
                    ]
                    const geometry = new Geometry()
                    const binXyz = new Float32Array(xyz)
                    const binUv = new Float32Array(uv)
                    geometry.addMesh()
                    geometry.addQuad(binXyz, binUv, fxyz, fuv, 0)
                    geometry.addMesh()
                    geometry.addQuad(binXyz, binUv, fxyz, fuv, 4)

                    expect(geometry.indices[0].fxyz).to.deep.equal([0, 1, 2, 3])
                    expect(geometry.indices[1].fxyz).to.deep.equal([2, 3, 4, 5])
                    expect(geometry.indices[0].fuv).to.deep.equal([0, 1, 2, 3])
                    expect(geometry.indices[1].fuv).to.deep.equal([2, 3, 4, 5])
                    expect(geometry.xyz).to.deep.equal(xyz)
                    expect(geometry.uv).to.deep.equal(uv)
                })
            })
        })
    })

    function printMat4(m: mat4) {
        console.log(`\n${m[0]} ${m[1]} ${m[2]} ${m[3]}\n${m[4]} ${m[5]} ${m[6]} ${m[7]}\n${m[8]} ${m[9]} ${m[10]} ${m[11]}\n${m[12]} ${m[13]} ${m[14]} ${m[15]}`)
    }

    describe("matrix", () => {
        it("toEuler", () => {
            for (const v of [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 0],
                [0, 1, 1],
                [1, 1, 1]
            ]) {
                const m = mat4.fromRotation(mat4.create(), 1, vec3.normalize(vec3.create(), vec3.fromValues(v[0], v[1], v[2])))

                const { x, y, z } = toEuler(m)

                const m0 = mat4.create()
                mat4.rotateX(m0, m0, x)
                mat4.rotateY(m0, m0, y)
                mat4.rotateZ(m0, m0, z)
                const vY = vec4.fromValues(0, 1, 0, 1)
                expect(vec4.equals(
                    vec4.transformMat4(vec4.create(), vY, m),
                    vec4.transformMat4(vec4.create(), vY, m0),
                ))
            }
        })
    })
})

function origIndexToGeoIndex(vertex: Float32Array, vertIdx: number, geometry: Geometry) {
    vertIdx *= 3
    for (let j = 0; j < geometry.xyz.length; j += 3) {
        if (vertex[vertIdx] === geometry.xyz[j] &&
            vertex[vertIdx + 1] === geometry.xyz[j + 1] &&
            vertex[vertIdx + 2] === geometry.xyz[j + 2]) {
            return j / 3
        }
    }
    throw Error(`couldn't find [${vertex[vertIdx]}, ${vertex[vertIdx + 1]}, ${vertex[vertIdx + 2]}] in geometry.vertex`)
}

function getBoneWeight(vertexList: Float32Array[], geometry: Geometry, weights: number[], boneWeightPairs: Array<Array<Array<number>>>) {
    const r: number[][][] = []
    for (let vertex of vertexList) {
        for (let vertIdx = 0; vertIdx < vertex.length / 3; ++vertIdx) {
            const idx = origIndexToGeoIndex(vertex, vertIdx, geometry)
            r.push(
                [
                    boneWeightPairs[idx].map(e => e[0]),
                    boneWeightPairs[idx].map(e => weights[e[1]]),
                ]
            )
        }
    }

    return r
}

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