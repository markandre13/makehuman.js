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

import { exportCollada, testCube } from "../../src/mesh/Collada"

import { parseXML, Tag, Text } from "./xml"

// what to do today:
// [ ] skeleton and mesh don't overlap
//   [X] find a collada file which i can use as reference
//       ~/Documents/Blender/objects/people/dariya/dariya.dae
//       but it is big and also contains a dress and empties for shoes
//       ~/Documents/Blender/experiments/rigged\ cube.dae
//       this one i've created just for writing this exporter
//   [X] export when mesh and skeleton are NOT CONNECTED
//       => OKAY body is upwards along z-axis, looking -y-axis towards the camera
//   [ ] export when mesh and skeleton are CONNECTED
//       => not okay
//       skeleton is correct but mesh with body upwards - y-axis
//   [ ] how does the test cube do right now which i can also export as collada?
//   [ ] find out how/where some mesh vertices and bones are placed in my and the reference file

/*

    okay, let's find out where 
      ~/Documents/Blender/objects/people/dariya/dariya.dae
    and what i currently export differ

    * both have <up_axis>Z_UP</up_axis>
    * to compare <library_geometries> i'll use dariya-separate.dae where the mesh
      is not a child of the skeleton

*/

describe("Collada", function () {

    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("load a valid collada and check it", function () {
        const data = FileSystemAdapter.getInstance().readFile("data/test.dae")
        checkCollada("data/test.dae", data)
    })

    it.only("test cube", function () {
        const xml = exportCollada(testCube)
        
        const document = parseXML("exportCollada()", xml)

        const collada = findTag(document, "COLLADA")
        expect(collada).to.not.be.undefined

        const scene = findTag(collada, "scene")
        const instance_visual_scene = findTag(scene, "instance_visual_scene")
        const sceneUrl = instance_visual_scene.attributes.get("url")
        expect(sceneUrl).to.not.be.undefined
        expect(sceneUrl?.charAt(0)).to.equal("#")
        const sceneName = sceneUrl!.substring(1)

        const library_visual_scenes = findTag(collada, "library_visual_scenes")
        const visual_scene = findTag(library_visual_scenes, "visual_scene")
        expect(visual_scene.attributes.get("id")).to.equal(sceneName)

        const node = findTag(visual_scene, "node")
        expect(node.attributes.get("type")).to.equal("NODE")

        const nodes = findTags(node, "node")
        expect(nodes).to.have.lengthOf(2)
        const skeletonNode = nodes[0]
        const meshNode = nodes[1]
        expect(skeletonNode.attributes.get("type")).to.equal("JOINT")
        expect(meshNode.attributes.get("type")).to.equal("NODE")

        const instance_controller = findTag(meshNode, "instance_controller") // url="#human_human_body-skin"
        const skinUrl = instance_controller.attributes.get("url")
        expect(skinUrl).to.not.be.undefined
        expect(skinUrl?.charAt(0)).to.equal("#")
        const skinControllerName = skinUrl!.substring(1)
        const skeleton = findTag(instance_controller, "skeleton") // text: #human_Bone

        const library_controllers = findTag(collada, "library_controllers")
        const controller = findTag(library_controllers, "controller")
        expect(controller.attributes.get("id")).to.equal(skinControllerName)

        const skin = findTag(controller, "skin")
        const skinSource = skin.attributes.get("source")
        expect(skinSource).to.not.be.undefined
        expect(skinSource?.charAt(0)).to.equal("#")
        const skinSourceName = skinSource!.substring(1) // skin-mesh

        const library_geometries = findTag(collada, "library_geometries")
        const geometry = findTag(library_geometries, "geometry")
        expect(geometry.attributes.get("id")).to.equal(skinSourceName)

        const mesh = findTag(geometry, "mesh")
        const meshSources = findTags(mesh, "source")
        expect(meshSources).to.have.lengthOf(2)

        const vertexSource = meshSources[0]
        const normalSource = meshSources[1]

        expect(vertexSource.attributes.get("id")).endsWith("-positions")
        expect(normalSource.attributes.get("id")).endsWith("-normals")

        const vertexValues = findTag(vertexSource, "float_array")
        expect(text(vertexValues)).to.equal("1 1 1 1 1 -1 1 -1 1 1 -1 -1 -1 1 1 -1 1 -1 -1 -1 1 -1 -1 -1 1 1 0 -1 -1 0 1 -1 0 -1 1 0")

        const vertices = findTag(mesh, "vertices")
        const verticesInput = findTag(vertices, "input")
        expect(verticesInput.attributes.get("semantic")).to.equal("POSITION")
        const verticesInputSource = verticesInput.attributes.get("source")
        expect(verticesInputSource).to.not.be.undefined
        expect(verticesInputSource?.charAt(0)).to.equal("#")
        const verticesInputSourceName = verticesInputSource!.substring(1)
        expect(vertexSource.attributes.get("id")).to.equal(verticesInputSourceName)

        const triangles = findTag(mesh, "triangles") // FIXME: the makehuman mesh has lot's of quads which look better when subsurfacing
        expect(triangles.attributes.get("count")).to.equal("20")
        const triangleInput = findTags(triangles, "input")
        expect(triangleInput).to.have.lengthOf(2)
        const vertexInput = triangleInput[0]
        const normalInput = triangleInput[1]
        expect(vertexInput.attributes.get("semantic")).to.equal("VERTEX")
        expect(normalInput.attributes.get("semantic")).to.equal("NORMAL")

        const vertexInputSource = vertexInput.attributes.get("source")
        expect(vertexInputSource).to.not.be.undefined
        expect(vertexInputSource?.charAt(0)).to.equal("#")
        const vertexInputSourceName = vertexInputSource!.substring(1)
        expect(vertices.attributes.get("id")).to.equal(vertexInputSourceName)

        const triangleP = findTag(triangles, "p")
        expect(text(triangleP)).to.equal("4 2 0 2 9 10 6 11 9 1 7 5 0 10 8 4 8 11 11 1 5 8 3 1 9 5 7 10 7 3 4 6 2 2 6 9 6 4 11 1 3 7 0 2 10 4 0 8 11 8 1 8 10 3 9 11 5 10 9 7")

        // console.log(xml)
    })

    it("exportCollada() does not crash", function () {
        const human = Human.getInstance()
        const obj = new WavefrontObj()
        obj.load('data/3dobjs/base.obj.z')
        human.meshData = obj
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton('data/rigs/default.mhskel.z')
        human.setBaseSkeleton(skeleton)

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
