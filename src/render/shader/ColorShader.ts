import { AbstractShader } from "./AbstractShader"

export class ColorShader extends AbstractShader {
    protected vertexColor: number
    constructor(gl: WebGL2RenderingContext) {
        super(gl, rgbaVertexShaderSrc, rgbaFragmentShaderSrc)
        this.vertexColor = gl.getAttribLocation(this.program, 'aVertexColor')
    }
    override bind(indices: WebGLBuffer, vertices: WebGLBuffer, normales: WebGLBuffer, colors: WebGLBuffer) {
        const numComponents = 3, type = this.gl.FLOAT, normalize = false, stride = 0, offset = 0

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colors)
        this.gl.vertexAttribPointer(this.vertexColor, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(this.vertexColor)

        super.bind(indices, vertices, normales)
    }
}
const rgbaVertexShaderSrc = /*glsl*/ `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // data exchanged with other graphic pipeline stages
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

        highp vec3 ambientLight = vec3(0.7, 0.7, 0.7);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
        vColor = aVertexColor;
    }
`

const rgbaFragmentShaderSrc = /*glsl*/ `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;
    void main(void) {
        gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    }
`
