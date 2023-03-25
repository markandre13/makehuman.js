import { mat4, vec4 } from 'gl-matrix'
import { EnumModel } from 'toad.js'
import { BaseMeshGroup } from '../mesh/BaseMeshGroup'
import { HumanMesh, Update } from '../mesh/HumanMesh'
import { RenderMode } from './RenderMode'
import { Bone } from "../skeleton/Bone"
import { ProgramRGBA } from './ProgramInfo'
import { Buffers } from './Buffers'
import { RenderMesh } from './RenderMesh'

let cubeRotation = 0.0

export function render(canvas: HTMLCanvasElement, scene: HumanMesh, mode: EnumModel<RenderMode>): void {

    console.log(`NUMBER OF BONES ${scene.skeleton.bones.size}`)

    const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    if (!gl) {
        throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    }

    const buffers = createAllBuffers(gl, scene)
    const programInfo = new ProgramRGBA(gl)

    let then = 0
    function render(now: number) {
        now *= 0.001  // convert to seconds
        const deltaTime = now - then
        then = now

        if (scene.updateRequired !== Update.NONE) {
            updateBuffers(scene, buffers)
        }

        drawScene(gl, programInfo, buffers, deltaTime, scene, mode.value)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

function drawScene(gl: WebGL2RenderingContext, programInfo: ProgramRGBA, buffers: Buffers, deltaTime: number, scene: HumanMesh, renderMode: RenderMode): void {

    const modelViewMatrix = mat4.create()
    if (renderMode === RenderMode.DEBUG) {
        mat4.translate(modelViewMatrix, modelViewMatrix, [1.0, -7.0, -5.0])
        mat4.rotate(modelViewMatrix, modelViewMatrix, -Math.PI / 2, [0, 1, 0])
    } else {
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]) // move the model (cube) away
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0])
    }

    programInfo.init(modelViewMatrix)
    buffers.base.bind(programInfo)

    let skin
    switch (renderMode) {
        case RenderMode.POLYGON:
            skin = [BaseMeshGroup.SKIN, [1.0, 0.8, 0.7, 1], gl.TRIANGLES]
            break
        case RenderMode.DEBUG:
        case RenderMode.WIREFRAME:
            skin = [BaseMeshGroup.SKIN, [1.0 / 5, 0.8 / 5, 0.7 / 5, 1], gl.LINES]
            break
        default:
            throw Error(`Illegal render mode ${renderMode}`)
    }

    for (let x of [
        skin,
        [BaseMeshGroup.EYEBALL0, [0.0, 0.5, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.EYEBALL1, [0.0, 0.5, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_TOP, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_BOTTOM, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [BaseMeshGroup.TOUNGE, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [BaseMeshGroup.CUBE, [1.0, 0.0, 0.5, 1], gl.LINE_STRIP],
    ]) {
        const idx = x[0] as number
        const rgba = x[1] as number[]
        const mode = x[2] as number

        if (idx === BaseMeshGroup.SKIN && buffers.proxies.has("Proxymeshes")) {
            continue
        }
        if ((idx === BaseMeshGroup.EYEBALL0 || idx === BaseMeshGroup.EYEBALL1) && buffers.proxies.has("Eyes")) {
            continue
        }
        if ((idx === BaseMeshGroup.TEETH_TOP || idx === BaseMeshGroup.TEETH_BOTTOM) && buffers.proxies.has("Teeth")) {
            continue
        }
        if (idx === BaseMeshGroup.TOUNGE && buffers.proxies.has("Tongue")) {
            continue
        }

        programInfo.color(rgba)
        let offset = scene.baseMesh.groups[idx].startIndex * 2 // index is a word, hence 2 bytes
        let length = scene.baseMesh.groups[idx].length

        buffers.base.drawSubset(mode, offset, length)
    }

    // SKELETON
    if (renderMode !== RenderMode.POLYGON) {
        programInfo.color([1, 1, 1, 1])
        const offset = buffers.skeletonIndex
        const count = scene.skeleton.boneslist!.length * 2
        buffers.base.drawSubset(gl.LINES, offset, count)
    }

    // JOINTS
    if (renderMode !== RenderMode.POLYGON) {
        programInfo.color([1, 1, 1, 1])
        const offset = scene.baseMesh.groups[2].startIndex * 2
        const count = scene.baseMesh.groups[2].length * 124
        buffers.base.drawSubset(gl.TRIANGLES, offset, count)
    }

    let glMode: number
    switch (renderMode) {
        case RenderMode.POLYGON:
            glMode = gl.TRIANGLES
            break
        case RenderMode.WIREFRAME:
        case RenderMode.DEBUG:
            glMode = gl.LINES
            break
    }

    buffers.proxies.forEach((renderMesh, name) => {
        let rgba: number[] = [0.5, 0.5, 0.5, 1]
        switch (name) {
            case "Proxymeshes":
                rgba = [1.0, 0.8, 0.7, 1]
                if (renderMode === RenderMode.WIREFRAME) {
                    rgba = [rgba[0] / 5, rgba[1] / 5, rgba[2] / 5, 1]
                }
                break
            case "Eyes":
                rgba = [0.0, 0.5, 1, 1]
                break
            case "Teeth":
                rgba = [1.0, 1.0, 1.0, 1]
                break
            case "Tongue":
                rgba = [1.0, 0.0, 0, 1]
                break
        }
        programInfo.color(rgba)

        renderMesh.draw(programInfo, glMode)
    })
    cubeRotation += deltaTime
}

// render the skeleton using matRestGlobal
function renderSkeletonGlobal(scene: HumanMesh) {
    const skel = scene.skeleton
    const v = vec4.fromValues(0, 0, 0, 1)
    const vertex = new Array<number>(skel.boneslist!.length * 6)
    const indices = new Array<number>(skel.boneslist!.length * 2)
    skel.boneslist!.forEach((bone, index) => {
        const m = bone.matPoseGlobal ? bone.matPoseGlobal : bone.matRestGlobal!
        const a = vec4.transformMat4(vec4.create(), v, m)
        const b = vec4.transformMat4(vec4.create(), bone.yvector4!, m)
        const vi = index * 6
        const ii = index * 2
        vertex[vi] = a[0]
        vertex[vi + 1] = a[1]
        vertex[vi + 2] = a[2]
        vertex[vi + 3] = b[0]
        vertex[vi + 4] = b[1]
        vertex[vi + 5] = b[2]
        indices[ii] = index * 2
        indices[ii + 1] = index * 2 + 1
    })
    return { vertex, indices }
}

// render the skeleton using matRestRelative
function renderSkeletonRelative(scene: HumanMesh) {
    const skel = scene.skeleton
    const v = vec4.fromValues(0, 0, 0, 1)
    const vertex: number[] = []
    const indices: number[] = []
    const rootBone = skel.roots[0]!

    mat4.identity(mat4.create())
    renderSkeletonRelativeHelper(
        mat4.identity(mat4.create()),
        rootBone,
        vertex,
        indices
    )
    return { vertex, indices }
}

function renderSkeletonRelativeHelper(m: mat4, bone: Bone, vertex: number[], indices: number[]) {
    const v = vec4.fromValues(0, 0, 0, 1)

    const a = vec4.transformMat4(vec4.create(), v, bone.matRestGlobal!)
    const b = vec4.transformMat4(vec4.create(), bone.yvector4!, bone.matRestGlobal!)

    const index = vertex.length / 3
    vertex.push(a[0], a[1], a[2], b[0], b[1], b[2])
    indices.push(index, index + 1)

    const m0 = m
    const m1 = mat4.multiply(mat4.create(), m0, bone.matRestRelative!)
    bone.children.forEach(childBone => {
        renderSkeletonRelativeHelper(m1, childBone, vertex, indices)
    })
}

function createAllBuffers(gl: WebGL2RenderingContext, scene: HumanMesh): Buffers {
    const { vx, ix, skeletonIndex } = buildBase(scene)
    const base = new RenderMesh(gl, vx, ix)

    let proxies = new Map<string, RenderMesh>()
    scene.proxies.forEach((proxy, name) => {
        proxies.set(name, new RenderMesh(gl, proxy.getCoords(scene.vertexRigged), proxy.mesh.indices))
    })

    return {
        base,
        skeletonIndex,
        proxies
    }
}

function updateBuffers(scene: HumanMesh, buffers: Buffers) {
    scene.update()

    const { vx, ix } = buildBase(scene)
    buffers.base.update(vx, ix)

    buffers.proxies.forEach((renderMesh, name) => {
        const proxy = scene.proxies.get(name)!
        const vertexMorphed = proxy.getCoords(scene.vertexMorphed)
        const vertexWeights = proxy.getVertexWeights(scene.skeleton.vertexWeights!)
        const vertexRigged = scene.skeleton.skinMesh(vertexMorphed, vertexWeights!._data)
        renderMesh.update(vertexRigged, proxy.mesh.indices)
    })
}

function buildBase(scene: HumanMesh) {
    let skeleton = renderSkeletonGlobal(scene)

    let vx = scene.vertexRigged
    let ix = scene.baseMesh.indices

    const skeletonIndex = ix.length * 2

    const vertexOffset = scene.vertexRigged.length / 3
    vx = vx.concat(skeleton.vertex)
    ix = ix.concat(skeleton.indices.map(v => v + vertexOffset))
    return { vx, ix, skeletonIndex }
}