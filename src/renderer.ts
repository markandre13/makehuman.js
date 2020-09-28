import { mat4 } from 'gl-matrix'
import { calculateNormals } from './fileformats/lib/calculateNormals'
import { get } from './fileformats/lib/http'
import { WavefrontObj } from "./fileformats/WavefrontObj"
import { Target } from './fileformats/target/Target'
import { TargetFactory } from './fileformats/target/TargetFactory'
import { loadModifiers } from "./fileformats/modifier/loadModifiers"
import { ElectronFSAdapter } from './filesystem/ElectronFSAdapter'

window.onload = () => { main() }

let cubeRotation = 0.0

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

    // loadMacroTargets()

    const fs = new ElectronFSAdapter()

    console.log(`load targets`)
    const tf = new TargetFactory(fs)
    loadModifiers(fs.readFile("data/modifiers/modeling_modifiers.json"))
    loadModifiers(fs.readFile("data/modifiers/measurement_modifiers.json"))

    // buttocks/buttocks-buttocks-volume-decr|incr-decr|incr

    const stomachPregnantIncr = new Target()
    stomachPregnantIncr.load(await get("data/targets/stomach/stomach-pregnant-incr.target"))
    stomachPregnantIncr.apply(scene.vertex)

    const breastVolumeVertUp = new Target()
    breastVolumeVertUp.load(await get("data/targets/breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness.target"))
    breastVolumeVertUp.apply(scene.vertex)

    const buttocks = new Target()
    buttocks.load(await get("data/targets/buttocks/buttocks-volume-incr.target"))
    buttocks.apply(scene.vertex)

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

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

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

// function loadMacroTargets() {
//     console.log()
//     const targetFactory = new TargetFactory()
//     // for target in targets.getTargets().findTargets('macrodetails'):
//     for (const target of targetFactory.findTargets('macrodetails')) {
//     //         #log.debug('Preloading target %s', getpath.getRelativePath(target.path))
//     //         algos3d.getTarget(self.selectedHuman.meshData, target.path)
//         console.log(target.path)
//     // target.getTarget()
//     }
// }

// apps/human.py
//   class Human
//     setGender(gender: number) // 0 femaile to 1 male
//        if updateModifier:
//            modifier = self.getModifier('macrodetails/Gender')
//            modifier.setValue(gender)
//            self.applyAllTargets()
//            return
//        gender = min(max(gender, 0.0), 1.0)
//        if self.gender == gender:
//            return
//        self.gender = gender
//        self._setGenderVals()
//        self.callEvent('onChanging', events3d.HumanEvent(self, 'gender'))
//    getModifier(self, name):
//        return self._modifiers[name]
//    addModifier(modifier)
//  app/humanmodifier.py
//    class ModifierAction
//      do()/undo()
//    class Modifier
//      setHuman(human)
//        self.human = human
//        human.addModifier(self)
//    class SimpleModifier: Modifier
//    class ManagedTargetModifier: Modifier
//    class UniversalModifier: ManagedTargetModifier
//    class MacroModifier: ManagedTargetModifier
//    class EthnicModifier: MacroModifier
//    loadModifiers() // modifiers/modeling_modifiers.json && modifiers/measurement_modifiers.json

// Modifier.buildLists()
//    this.verts
//    this.faces
//
// Human
//   meshData: 3DObject
//
// core/module3d
//   class FaceGroup(parent: Object3D, name: string, idx: number)
//     object // 3DObject parent
//     name   // group name
//     idx    // group start
//     color: byte[] // RGBA
//     colorID
//
// 3DObject contains the mesh data...
//   name: string
//   vertPerPrimitive: number = 4 
//
//   orig_coord
//   coord: vertex coordinates (Float32,Float32,Float32)[]
//   nvorm: vertex normals     (Float32,Float32,Float32)[]
//   vtang: (Float32,Float32,Float32,Float32)[]
//   color: vertex colors (uint8,uint8,uint8,uint8)[]
//   vface: (uint32, uint32, uint32, uint32)[]
//   nfaces: uint8[]
//
//   _faceGroups: Array<FaceGroup>
//   _groups_rev: Map<string, FaceGrouo>
//
//   cameraMode: number = 0 WTF?
//   _visibility: boolean = true
//   pickable = false
//   calculateTangents = True
//   object3d = undefined  the object in the GUI???
//   _priority = 0
//   MAX_FACES = 8
//
//   Cache used for retrieving vertex colors multiplied with material diffuse color
//   _old_diff = undefined
//   _r_color_diff = undefined
//
//   setCoords( coords: (float, float, float)[] )
//   setUVs( coords: (float, float)[])
//   setFaces(fverts: (int,int,int,int)[], fuvs: (int,int,int,int)[] | undefined, groups: int[])
//   getVertexCount() = this.coord.length
//
//   __object = undefined
//
// class MHApplication {
//   loadHuman() {
//     self.selectedHuman = self.addObject(
//        human.Human(
//          files3d.loadMesh(  // load Wavefront OBJ and return it as Object3D
//            mh.getSysDataPath("3dobjs/base.obj")
//            , maxFaces = 5 // max number of faces per vertex... why?
//          )
//        )
//      )
//   }
// } 