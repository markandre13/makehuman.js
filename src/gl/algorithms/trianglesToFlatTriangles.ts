/**
 * separate triangle edges to achieve flat shading
 *
 * @param fxyz faces
 * @param xyz vertices
 * @returns { xyzFlat, fxyzFlat }
 */
export function trianglesToFlatTriangles(fxyz: ArrayLike<number>, xyz: ArrayLike<number>): { xyzFlat: Float32Array; fxyzFlat: number[]}  {
    const fxyzFlat = new Array<number>(fxyz.length) // number of faces is the same
    const xyzFlat = new Float32Array(fxyz.length * 3) // three points per facce

    for (let i = 0, vo = 0, fo = 0; i < fxyz.length;) {
        let i0 = fxyz[i++] * 3
        let i1 = fxyz[i++] * 3
        let i2 = fxyz[i++] * 3

        xyzFlat[vo++] = xyz[i0++]
        xyzFlat[vo++] = xyz[i0++]
        xyzFlat[vo++] = xyz[i0++]

        xyzFlat[vo++] = xyz[i1++]
        xyzFlat[vo++] = xyz[i1++]
        xyzFlat[vo++] = xyz[i1++]

        xyzFlat[vo++] = xyz[i2++]
        xyzFlat[vo++] = xyz[i2++]
        xyzFlat[vo++] = xyz[i2++]

        fxyzFlat[fo] = fo
        ++fo
        fxyzFlat[fo] = fo
        ++fo
        fxyzFlat[fo] = fo
        ++fo
    }
    return { xyzFlat, fxyzFlat }
}
