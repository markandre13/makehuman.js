/**
 * calculate the median between two angles
 * 
 * @param a 
 * @param b 
 * @param factor 
 * @returns 
 */
export function medianAngle(a: number, b: number, factor = 0.5) {
    while (a < 0) {
        a += 360
    }
    a = a % 360

    while (b < 0) {
        b += 360
    }
    b = b % 360

    if (b > a) {
        ;[a, b] = [b, a]
        factor = 1 - factor
    }

    let d = b - a
    if (Math.abs(d) > 180) {
        d = 360 - a + b
        return b - d * (1 - factor)
    } else {
        return a + d * factor
    }
}

export function ease(k: number): number {
    return 0.5 * (1 - Math.cos(Math.PI * k))
}
/**
 * a < min -> a0
 * a > max -> a1
 * a in [min, max] -> transition from a0 to a1
 * 
 * @param a 
 * @param min when a is below, return a0
 * @param max when a is above, return a1
 * @param a0 angle 0 
 * @param a1 angle 1
 * @returns 
 */
export function easeMedianAngle(
    a: number,
    min: number,
    max: number,
    a0: number,
    a1: number
) {
    if (a < min) {
        return a0
    }
    if (a > max) {
        return a1
    }
    const n = (a - min) / (max - min)
    return medianAngle(a0, a1, ease(n))
}