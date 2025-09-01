// let cubeRotation = 0.4
// TODO:
// [ ] render vertex index instead of color, then read color to get vertex (to avoid selecting hidden vertices)
//     (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels)
// [ ] just4fun: i could try to do the skinning via webgl (https://webglfundamentals.org/webgl/lessons/webgl-skinning.html)
// LESSONS LEARNED:
// flat shading is only available in WebGL 2.0 with the WEBGL_provoking_vertex extension,
// which at this time neither Safari nor Chrome support
// const epv = gl.getExtension('WEBGL_provoking_vertex');

export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2
}
