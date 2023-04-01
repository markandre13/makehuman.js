import { AbstractShader } from './AbstractShader'

export class TextureShader extends AbstractShader {
    protected uSampler: WebGLUniformLocation
    constructor(gl: WebGL2RenderingContext) {
        super(gl, textureVertexShaderSrc, textureFragmentShaderSrc)
        this.textureCoord = gl.getAttribLocation(this.program, "aTextureCoord")
        this.uSampler = gl.getUniformLocation(this.program, "uSampler")!
    }

    // set texture
    texture(texture: WebGLTexture) {
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.uniform1i(this.uSampler, 0)
    }
    override bind(indices: WebGLBuffer, vertices: WebGLBuffer, normales: WebGLBuffer, texture?: WebGLBuffer): void {
        super.bind(indices, vertices, normales, texture)
        if (texture) {
            const num = 2 // every coordinate composed of 2 values
            const type = this.gl.FLOAT // the data in the buffer is 32-bit float
            const normalize = false // don't normalize
            const stride = 0 // how many bytes to get from one set to the next
            const offset = 0 // how many bytes inside the buffer to start from
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texture!)
            this.gl.vertexAttribPointer(
                this.textureCoord!,
                num,
                type,
                normalize,
                stride,
                offset
            )
            this.gl.enableVertexAttribArray(this.textureCoord!)
        }
    }
}
const textureVertexShaderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

// input for all vertices (uniform for the whole shader program)
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// data exchanged with other graphic pipeline stages
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

  // out
  vLighting = ambientLight + (directionalLightColor * directional);
  vTextureCoord = aTextureCoord;
}`
const textureFragmentShaderSrc = `
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;
uniform sampler2D uSampler;
void main(void) {
  highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
  gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
}`
