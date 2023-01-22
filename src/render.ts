import { mat4, vec4 } from 'gl-matrix'
import { calculateNormals } from './lib/calculateNormals'
import { Mesh } from './Mesh'
import { HumanMesh, Update } from './mesh/HumanMesh'
import { Mode } from './Mode'
import { Bone } from "./skeleton/Bone"

let cubeRotation = 0.0

interface ProgramInfo {
    program: WebGLProgram
    attribLocations: {
        vertexPosition: number
        vertexNormal: number
        // vertexColor: number
    }
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation
        modelViewMatrix: WebGLUniformLocation
        normalMatrix: WebGLUniformLocation
        color: WebGLUniformLocation
    }
}

interface Buffers {
    vertex: WebGLBuffer
    normal: WebGLBuffer
    indices: WebGLBuffer

    skeletonIndex: number

    proxyOffset: number
    proxyCount: number
}

export function render(canvas: HTMLCanvasElement, scene: HumanMesh): void {

    // for(let i=0; i<10; ++i) {
    //     console.log(`draw group '${scene.groups[i].name}, offset=${scene.groups[i].startIndex}, length=${scene.groups[i].length}'`)
    // }

    console.log(`NUMBER OF BONES ${scene.human.__skeleton.bones.size}`)

    const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    if (!gl) {
        throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    }

    const buffers = createAllBuffers(gl, scene)

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSharderSrc)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc)
    const programInfo = linkProgram(gl, vertexShader, fragmentShader)

    let then = 0
    function render(now: number) {
        now *= 0.001  // convert to seconds
        const deltaTime = now - then
        then = now

        if (scene.updateRequired !== Update.NONE) {
            scene.update()
            let skeleton = renderSkeletonGlobal(scene)
            // let skeleton = renderSkeletonRelative(scene)

            let vx = scene.vertex
            let ix = scene.indices

            const vertexOffset = scene.vertex.length / 3
            vx = vx.concat(skeleton.vertex)
            ix = ix.concat(skeleton.indices.map(v => v + vertexOffset))
        
            // append proxy
            if (scene.proxy) {
                const offset = vx.length / 3
                vx = vx.concat(scene.proxy.getCoords(scene.vertex))
                ix = ix.concat(scene.proxyMesh!.indices.map( v => v + offset))
            }

            buffers.vertex = createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, vx)
            buffers.normal = createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(vx, ix))
        }

        drawScene(gl, programInfo, buffers, deltaTime, scene)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

function drawScene(gl: WebGL2RenderingContext, programInfo: ProgramInfo, buffers: Buffers, deltaTime: number, scene: HumanMesh): void {

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

    // gl.enable(gl.BLEND)
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const fieldOfView = 45 * Math.PI / 180    // in radians
    const aspect = canvas.width / canvas.height
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]) // move the model (cube) away
    // mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation, [0, 0, 1])
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0])

    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    {
        const numComponents = 3
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }

    {
        const numComponents = 3
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset)
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal)
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram(programInfo.program)

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix)

    let skin
    switch (scene.mode) {
        case Mode.MORPH:
            skin = [Mesh.SKIN, [1.0, 0.8, 0.7, 1], gl.TRIANGLES]
            break
        case Mode.POSE:
            skin = [Mesh.SKIN, [1.0 / 5, 0.8 / 5, 0.7 / 5, 1], gl.LINES]
            break
    }

    for (let x of [
        skin,
        [Mesh.EYEBALL0, [0.0, 0.5, 1, 1], gl.TRIANGLES],
        [Mesh.EYEBALL1, [0.0, 0.5, 1, 1], gl.TRIANGLES],
        [Mesh.MOUTH_GUM_TOP, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [Mesh.MOUTH_GUM_BOTTOM, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [Mesh.TOUNGE, [1.0, 0.0, 0, 1], gl.TRIANGLES],
        [Mesh.CUBE, [1.0, 0.0, 0.5, 1], gl.LINE_STRIP],
    ]) {
        const idx = x[0] as number
        const mode = x[2] as number

        gl.uniform4fv(programInfo.uniformLocations.color, x[1] as number[])
        const type = gl.UNSIGNED_SHORT
        let offset = scene.groups[idx].startIndex * 2
        let count = scene.groups[idx].length

        // in case there is a proxy mesh, draw that instead of the base model's skin
        if (scene.proxy !== undefined && idx == Mesh.SKIN) {
            offset = buffers.proxyOffset!
            count = buffers.proxyCount!
        }

        // console.log(`draw group '${scene.groups[i].name}, offset=${offset}, length=${count}'`)
        gl.drawElements(mode, count, type, offset)
    }

    // SKELETON
    if (scene.mode === Mode.POSE) {
        gl.uniform4fv(programInfo.uniformLocations.color, [1, 1, 1, 1])
        const offset = buffers.skeletonIndex
        const mode = gl.LINES
        const count = scene.human.__skeleton.boneslist!.length * 2
        gl.drawElements(mode, count, gl.UNSIGNED_SHORT, offset)
    }

    // JOINTS
    if (scene.mode === Mode.POSE) {
        gl.uniform4fv(programInfo.uniformLocations.color, [1, 1, 1, 1])
        const type = gl.UNSIGNED_SHORT
        const offset = scene.groups[2].startIndex * 2
        const count = scene.groups[2].length * 124
        gl.drawElements(gl.TRIANGLES, count, type, offset)
    }

    cubeRotation += deltaTime
}

const vertexSharderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
// attribute vec4 aVertexColor;

// input for all vertices (uniform for the whole shader program)
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uColor;

// data exchanged with other graphic pipeline stages
varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  vColor = uColor;
}`

// skin color
const fragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    // gl_FragColor = vColor;
}`

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type)
    if (shader === null)
        throw Error('Unable to create WebGLShader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        throw Error(`An error occurred compiling the ${type} WebGLShader: ${gl.getShaderInfoLog(shader)}`)
    }
    return shader
}

function linkProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): ProgramInfo {
    const program = gl.createProgram()
    if (program === null) {
        throw Error('Unable to create WebGLProgram')
    }
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw Error(`Unable to initialize WebGLProgram: ${gl.getProgramInfoLog(program)}`)
    }

    return {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
            // vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: getUniformLocation(gl, program, 'uProjectionMatrix'),
            modelViewMatrix: getUniformLocation(gl, program, 'uModelViewMatrix'),
            normalMatrix: getUniformLocation(gl, program, 'uNormalMatrix'),
            color: getUniformLocation(gl, program, 'uColor')
        }
    }
}

function getUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
    const location = gl.getUniformLocation(program, name)
    if (location === null)
        throw Error(`Internal Error: Failed to get uniform location for ${name}`)
    return location
}

// render the skeleton using matRestGlobal
function renderSkeletonGlobal(scene: HumanMesh) {
    const skel = scene.human.__skeleton
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
    const skel = scene.human.__skeleton
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

    let skeleton = renderSkeletonGlobal(scene)
    // let skeleton = renderSkeletonRelative(scene)

    let vx = scene.vertex
    let ix = scene.indices

    // append skeleton
    const skeletonOffset = vx.length / 3
    const skeletonIndex = vx.length * 2
    vx = scene.vertex.concat(skeleton.vertex)
    ix = scene.indices.concat(skeleton.indices.map(v => v + skeletonOffset))

    // append proxy
    let proxyOffset = 0
    let proxyCount = 0
    if (scene.proxy) {
        const offset = vx.length / 3
        proxyOffset = ix.length * 2
        proxyCount = scene.proxyMesh!.indices.length
        vx = vx.concat(scene.proxy.getCoords(scene.vertex))
        ix = ix.concat(scene.proxyMesh!.indices.map( v => v + offset))
    }

    return {
        vertex: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, vx),
        normal: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(vx, ix)),
        indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, ix),
        skeletonIndex,
        proxyOffset,
        proxyCount
    }
}

function createBuffer(gl: WebGL2RenderingContext, target: GLenum, usage: GLenum, type: Float32ArrayConstructor | Uint16ArrayConstructor, data: number[]): WebGLBuffer {
    const buffer = gl.createBuffer()
    if (buffer === null)
        throw Error('Failed to create new WebGLBuffer')
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, new type(data), usage)
    return buffer
}
