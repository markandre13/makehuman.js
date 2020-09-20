import { mat4 } from 'gl-matrix'
import { calculateNormals } from './fileformats/calculateNormals'
import { WavefrontObj } from "./fileformats/WavefrontObj"

declare global {
    interface Window {
        readFileSync(path: string): Promise<string>;
        ipcRenderer: any
    }
}

window.onload = () => { main() }

let cubeRotation = 0.0

// this works via webserver and electron!
// TODO: have a look into Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
// which provides a streaming api to save memory
function get(url: string): Promise<string> {
	return new Promise((succeed, fail) => {
		const req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.addEventListener("load", () => {
			if(req.status < 400){
				succeed(req.responseText);
			}else{
				fail(new Error("Request failed: " + req.statusText));
			}
		});
		req.addEventListener("error", () => {
			fail(new Error("Network error"));
		});
		req.send(null);
	});
}

async function main() {
    const glframe = document.createElement("div") // as HTMLCanvasElement
    glframe.style.position = "absolute"
    glframe.style.left = "0"
    glframe.style.right = "0"
    glframe.style.top = "0"
    glframe.style.bottom = "0"
    glframe.style.overflow = "hidden"

    const canvas = document.createElement("canvas")
    canvas.style.width = "100vw"
    canvas.style.height = "100vh"
    canvas.style.display = "block"

    glframe.appendChild(canvas)
    document.body.appendChild(glframe)

    if (canvas === null)
        throw Error("No #glcanvas")
    const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.')
        return
    }

    const vertextShaderProgram = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    // attribute vec4 aVertexColor;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // data exchanged with other graphic pipeline stages
    // varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);

    //   vColor = aVertexColor;
    }`

    const fragmentShaderProgram = `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;
    void main(void) {
      gl_FragColor = vec4(vec3(1,0.8,0.7) * vLighting, 1.0);
    }`

    const shaderProgram = compileShaders(gl, vertextShaderProgram, fragmentShaderProgram)
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal')
            // vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix')
        }
    }

    const url = "data/3dobjs/base.obj"
    const scene = new WavefrontObj()
    scene.load(await get(url))
    const buffers = createAllBuffers(gl, scene)

    let then = 0
    function render(now: number) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then
        then = now

        drawScene(gl, programInfo, buffers, deltaTime, scene)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

function drawScene(gl: WebGL2RenderingContext, programInfo: any, buffers: any, deltaTime: number, scene: WavefrontObj) {
    const canvas = gl.canvas as HTMLCanvasElement
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const fieldOfView = 45 * Math.PI / 180    // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]) // move the model (cube) away
    mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation, [0, 0, 1])
    mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation * .7, [0, 1, 0])

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    {
        const numComponents = 3
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition)
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
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal)
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram(programInfo.program)

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,  false, modelViewMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix,     false, normalMatrix)

    {
        const type = gl.UNSIGNED_SHORT
        let i = 0
        const offset = scene.groups[0].start
        const count = scene.groups[0].length
        // console.log(`draw group '${scene.groups[i].name}, offset=${offset}, length=${count}'`)
        gl.drawElements(gl.TRIANGLES, count, type, offset)
    }

    cubeRotation += deltaTime
}

function compileShaders(gl: any, vertexSharderSrc: string, fragmentShaderSrc: string) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSharderSrc)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program))
        return null
    }

    return program
}

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type)
    if (shader === null)
        throw Error("failed to create shader")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the ${type} shader: ${gl.getShaderInfoLog(shader)}`)
        gl.deleteShader(shader)
        return null
    }
    return shader
}

interface Buffers {
    position: WebGLBuffer
    normal: WebGLBuffer
    indices: WebGLBuffer
}

function createAllBuffers(gl: WebGL2RenderingContext, scene: WavefrontObj): Buffers {
    return {
        position: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, scene.vertex),
        normal: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(scene)),
        indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, scene.indices)
    }
}

function createBuffer(gl: WebGL2RenderingContext, target: GLenum, usage: GLenum, type: any, data: number[]): WebGLBuffer {
    const buffer = gl.createBuffer()
    if (buffer === null)
        throw Error("Failed to create new WebGLBuffer")
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, new type(data), usage)
    return buffer
}
