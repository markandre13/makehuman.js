import { mat4, vec4 } from 'gl-matrix'
import { EnumModel } from 'toad.js'
import { BaseMeshGroup } from '../mesh/BaseMeshGroup'
import { HumanMesh, Update } from '../mesh/HumanMesh'
import { RenderMode } from './RenderMode'
import { RGBAShader } from "./shader/RGBAShader"
import { TextureShader } from "./shader/TextureShader"
import { Buffers } from './Buffers'
import { RenderMesh } from './RenderMesh'

let cubeRotation = 0.0

export function render(canvas: HTMLCanvasElement, scene: HumanMesh, mode: EnumModel<RenderMode>): void {
    const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    if (gl == null) {
        throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    }
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const programRGBA = new RGBAShader(gl)
    const programTex = new TextureShader(gl)

    const buffers = createAllBuffers(gl, scene)
    const texture = loadTexture(gl, "data/cubetexture.png")!

    let then = 0

    // Draw the scene repeatedly
    function render(now: number) {
        now *= 0.001  // convert to seconds
        const deltaTime = now - then
        then = now

        if (scene.updateRequired !== Update.NONE) {
            updateBuffers(scene, buffers)
        }

        drawScene(gl, programRGBA, programTex, texture, buffers, deltaTime, scene, mode.value)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

function drawScene(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    programTex: TextureShader,
    texture: WebGLTexture,
    buffers: Buffers,
    deltaTime: number,
    scene: HumanMesh,
    renderMode: RenderMode): void {

    const canvas = gl.canvas as HTMLCanvasElement
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const modelViewMatrix = mat4.create()
    if (renderMode === RenderMode.DEBUG) {
        mat4.translate(modelViewMatrix, modelViewMatrix, [1.0, -7.0, -5.0])
        mat4.rotate(modelViewMatrix, modelViewMatrix, -Math.PI / 2, [0, 1, 0])
    } else {
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]) // move the model (cube) away
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0])
    }

    const fieldOfView = 45 * Math.PI / 180    // in radians
    const aspect = canvas.width / canvas.height
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

    buffers.base.bind(programRGBA)
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

        programRGBA.color(rgba)
        let offset = scene.baseMesh.groups[idx].startIndex * 2 // index is a word, hence 2 bytes
        let length = scene.baseMesh.groups[idx].length

        buffers.base.drawSubset(mode, offset, length)
    }

    // SKELETON
    if (renderMode !== RenderMode.POLYGON) {
        programRGBA.color([1, 1, 1, 1])
        const offset = buffers.skeletonIndex
        const count = scene.skeleton.boneslist!.length * 2
        buffers.base.drawSubset(gl.LINES, offset, count)
    }

    // JOINTS
    if (renderMode !== RenderMode.POLYGON) {
        programRGBA.color([1, 1, 1, 1])
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
        programRGBA.color(rgba)
        renderMesh.draw(programRGBA, glMode)
    })

    // texture
    programTex.init(projectionMatrix, modelViewMatrix, normalMatrix)
    programTex.texture(texture)
    buffers.texCube.draw(programTex, gl.TRIANGLES)

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

function createAllBuffers(gl: WebGL2RenderingContext, scene: HumanMesh): Buffers {
    const { vx, ix, skeletonIndex } = buildBase(scene)
    const base = new RenderMesh(gl, vx, ix)
    const texCube = createTexturedCubeRenderer(gl)

    let proxies = new Map<string, RenderMesh>()
    scene.proxies.forEach((proxy, name) => {
        proxies.set(name, new RenderMesh(gl, proxy.getCoords(scene.vertexRigged), proxy.mesh.indices))
    })

    return { base, texCube, skeletonIndex, proxies }
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

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl: WebGLRenderingContext, url: string) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0
    const internalFormat = gl.RGBA
    const width = 1
    const height = 1
    const border = 0
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const pixel = new Uint8Array([0, 0, 255, 255]) // opaque blue
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    )

    const image = new Image()
    image.onload = () => {
        console.log(`texture "${url}" has been loaded`)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image
        )

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D)
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        }
    }
    image.src = url

    return texture
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0
}

function createTexturedCubeRenderer(gl: WebGL2RenderingContext): RenderMesh {
    const positions = [
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ]

    const indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ]

    return new RenderMesh(gl, positions, indices, [
        // Front
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Back
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Top
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Bottom
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Right
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ])

}
