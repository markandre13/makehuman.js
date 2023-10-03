import { AbstractShader } from './AbstractShader'

export class RGBAShader extends AbstractShader {
    protected _color: WebGLUniformLocation
    constructor(gl: WebGL2RenderingContext) {
        super(gl, rgbaVertexShaderSrc, rgbaFragmentShaderSrc)
        this._color = AbstractShader.getUniformLocation(gl, this.program, 'uColor')
    }
    // set RGBA color
    setColor(rgba: number[]) {
        this.gl.uniform4fv(this._color, rgba)
    }
}
const rgbaVertexShaderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

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
const rgbaFragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
}`
