const markerQ = "/%%/Chordata/q"
const markerRaw = "/%%/Chordata/raw"

export class COOPDecoder {
    protected static textDecoder = new TextDecoder();
    data: DataView
    bytes: Uint8Array
    offset = 0;
    constructor(buffer: ArrayBuffer) {
        this.data = new DataView(buffer)
        this.bytes = new Uint8Array(buffer)
    }
    decodeQ(): Map<string, number[]> {
        const bones = new Map<string, number[]>()
        const bundle = this.s()
        if (bundle !== "#bundle") {
            throw Error(`not an OSC bundle (expected '#bundle' but found '${bundle}'`)
        }
        const timetag = this.t()
        // const d = new Date(0)
        // d.setUTCSeconds(timetag.epoch)

        // 1st bundle
        const size0 = this.i(), offset0 = this.offset
        // console.log(`timetag: ${d} offset: ${this.offset} size: ${size0}`)
        const marker = this.s()
        if (marker !== markerQ) {
            throw Error(`not a Chordata packet (expected '${markerQ}' but got '${marker}')`)
        }
        if (this.s() !== ",N") {
            throw Error(`Chordata marker is not NIL`)
        }
        if (this.offset !== offset0 + size0) {
            throw Error(`wrong size`)
        }

        while (this.offset < this.bytes.byteLength) {
            const size1 = this.i(), offset1 = this.offset
            const addressPattern = this.s()
            const typeTag = this.s()
            if (typeTag !== ",ffff") {
                console.log(`unexpected type tag '${typeTag}', expected four floats`)
                continue
            }
            const w = this.f()
            const x = this.f()
            const y = this.f()
            const z = this.f()
            if (this.offset !== offset1 + size1) {
                throw Error(`wrong size`)
            }
            bones.set(addressPattern, [w, x, y, z])
        }
        return bones
    }
    decodeRaw(): Map<string, number[]> {
        const bones = new Map<string, number[]>()
        const bundle = this.s()
        if (bundle !== "#bundle") {
            throw Error(`not an OSC bundle (expected '#bundle' but found '${bundle}'`)
        }
        const timetag = this.t()
        // const d = new Date(0)
        // d.setUTCSeconds(timetag.epoch)

        // 1st bundle
        const size0 = this.i(), offset0 = this.offset
        // console.log(`timetag: ${d} offset: ${this.offset} size: ${size0}`)

        const marker = this.s()
        if (marker !== markerRaw) {
            throw Error(`not a Chordata packet (expected '${markerRaw}' but got '${marker}')`)
        }
        if (this.s() !== ",N") {
            throw Error(`Chordata marker is not NIL`)
        }
        if (this.offset !== offset0 + size0) {
            throw Error(`wrong size`)
        }

        while (this.offset < this.bytes.byteLength) {
            const size1 = this.i(), offset1 = this.offset
            const addressPattern = this.s()
            const typeTag = this.s()
            if (typeTag !== ",iiiiiiiii") {
                console.log(`unexpected type tag '${typeTag}', expected nine ints`)
                continue
            }
            const gx = this.i()
            const gy = this.i()
            const gz = this.i()
            const ax = this.i()
            const ay = this.i()
            const az = this.i()
            const mx = this.i()
            const my = this.i()
            const mz = this.i()
            if (this.offset !== offset1 + size1) {
                throw Error(`wrong size`)
            }
            bones.set(addressPattern, [gx, gy, gz, ax, ay, az, mx, my, mz])
        }
        return bones
    }
    i(): number {
        const n = this.data.getInt32(this.offset, false)
        this.offset += 4
        return n
    }
    f(): number {
        const n = this.data.getFloat32(this.offset, false)
        this.offset += 4
        return n
    }
    t() {
        const fraction = this.i()
        const epoch = this.i()
        return { epoch, fraction }
    }
    s(): string {
        const start = this.offset
        while (this.data.getUint8(this.offset++) !== 0) { }
        // console.log(`${start} ${this.offset}`)
        // console.log(this.bytes.subarray(start, this.offset))
        const s = COOPDecoder.textDecoder.decode(this.bytes.subarray(start, this.offset - 1))
        this.align()
        return s
    }
    align() {
        const inversePadding = this.offset % 4
        if (inversePadding !== 0) {
            this.offset += 4 - inversePadding
        }
    }
}
