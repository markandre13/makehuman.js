/**
 * separate quad edges to achieve flat shading
 *
 * @param fxyz faces
 * @param xyz vertices
 * @returns { xyzFlat, fxyzFlat }
 */
export function quadsToFlatQuads(fxyz: ArrayLike<number>, xyz: ArrayLike<number>, offset: number, length: number): { xyzFlat: Float32Array; fxyzFlat: number[] } {
    const fxyzFlat = new Array<number>(length * 4) // same number of faces
    const xyzFlat = new Float32Array(length * 4 * 3) // four times the number of vertices
    for (let i = offset, vo = 0, fo = 0; i < length + offset;) {
        let i0 = fxyz[i++] * 3
        let i1 = fxyz[i++] * 3
        let i2 = fxyz[i++] * 3
        let i3 = fxyz[i++] * 3

        xyzFlat[vo++] = xyz[i0++]
        xyzFlat[vo++] = xyz[i0++]
        xyzFlat[vo++] = xyz[i0++]

        xyzFlat[vo++] = xyz[i1++]
        xyzFlat[vo++] = xyz[i1++]
        xyzFlat[vo++] = xyz[i1++]

        xyzFlat[vo++] = xyz[i2++]
        xyzFlat[vo++] = xyz[i2++]
        xyzFlat[vo++] = xyz[i2++]

        xyzFlat[vo++] = xyz[i3++]
        xyzFlat[vo++] = xyz[i3++]
        xyzFlat[vo++] = xyz[i3++]

        fxyzFlat[fo] = fo
        ++fo
        fxyzFlat[fo] = fo
        ++fo
        fxyzFlat[fo] = fo
        ++fo
        fxyzFlat[fo] = fo
        ++fo
    }
    return { xyzFlat, fxyzFlat }
}