import { ipcRenderer } from 'electron'
import { mat4 } from 'gl-matrix'
import { WavefrontObj } from "./fileformats/WavefrontObj"

declare global {
    interface Window {
        readFileSync(path: string): Promise<string>;
        ipcRenderer: any
    }
}

window.onload = () => { main() }

let cubeRotation = 0.0

async function main() {
    // const url = "data/3dobjs/base.obj"
    const url = "data/3dobjs/cube.obj"
    // const stream = fs.createReadStream(url)
    const scene = new WavefrontObj()
    const data = await window.ipcRenderer.invoke('readFileSync', url)
    // const data = await window.readFileSync(url)
    scene.load(data)

    const canvas = document.querySelector('#glcanvas') as HTMLCanvasElement | null
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

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vertextShaderProgram, fragmentShaderProgram)

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVevrtexColor and also
    // look up uniform locations.
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

    // Here's where we call the routine that builds all the objects we'll be drawing.
    const buffers = initBuffers(gl, scene)

    let then = 0

    // Draw the scene repeatedly
    function render(now: number) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then
        then = now

        drawScene(gl, programInfo, buffers, deltaTime, scene)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl: WebGL2RenderingContext, scene: WavefrontObj) {
    let vertex = new Float32Array(scene.vertex)
    let indices = new Uint16Array(scene.indices)

    // POSITIONS
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW)

    // NORMALS
    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    const vertexNormals = [
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,

        // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
      ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        position: vertexBuffer,
        normal: normalBuffer,
        indices: indexBuffer,
    }
}

// function createProjectionMatrix(fieldOfViewInRadians: number, aspectRatio: number, near: number, far: number) {
//     const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
//     const rangeInv = 1 / (near - far);

//     return new DOMMatrix([
//         f / aspectRatio, 0, 0, 0,
//         0, f, 0, 0,
//         0, 0, (near + far) * rangeInv, -1,
//         0, 0, near * far * rangeInv * 2, 0
//     ])
// }

//
// Draw the scene.
//
function drawScene(gl: WebGL2RenderingContext, programInfo: any, buffers: any, deltaTime: number, scene: WavefrontObj) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)   // Clear to black, fully opaque
    gl.clearDepth(1.0)                  // Clear everything
    gl.enable(gl.DEPTH_TEST)            // Enable depth testing
    gl.depthFunc(gl.LEQUAL)             // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180    // in radians
    const canvas = gl.canvas as HTMLCanvasElement
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()
    // const projectionMatrix = createProjectionMatrix(fieldOfView, aspect, zNear, zFar)

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    // Set the drawing position to the "identity" point, which is the center of the scene.
    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]) // move the model (cube) away
    mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation, [0, 0, 1])
    mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation * .7, [0, 1, 0])

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
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

    // Tell WebGL how to pull out the normals from
    // the normal buffer into the vertexNormal attribute.
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

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    // {
    //     const numComponents = 4; // RGBA
    //     const type = gl.FLOAT;
    //     const normalize = false;
    //     const stride = 0;
    //     const offset = 0;
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
    //     gl.vertexAttribPointer(
    //         programInfo.attribLocations.vertexColor,
    //         numComponents,
    //         type,
    //         normalize,
    //         stride,
    //         offset);
    //     gl.enableVertexAttribArray(
    //         programInfo.attribLocations.vertexColor)
    // }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program)

    // Set the shader uniforms

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,  false, modelViewMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix,     false, normalMatrix)

    {
        const indexCount = scene.indices.length
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, indexCount, type, offset)
    }

    // Update the rotation for the next draw

    cubeRotation += deltaTime
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl: any, vsSource: string, fsSource: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    // Create the shader program
    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
        return null
    }

    return shaderProgram
}

//
// creates a shader of the given type, uploads the source and compiles it.
//
function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type)
    if (shader === null)
        throw Error("failed to create shader")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}
