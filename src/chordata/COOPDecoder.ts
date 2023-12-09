export class COOPDecoder {
    protected static textDecoder = new TextDecoder();
    data: DataView
    bytes: Uint8Array
    offset = 0;
    constructor(buffer: ArrayBuffer) {
        this.data = new DataView(buffer)
        this.bytes = new Uint8Array(buffer)
    }
    decode(): Map<string, number[]> {
        const bones = new Map<string, number[]>()

        if (this.s() !== "#bundle") {
            throw Error("not an OSC bundle")
        }
        const timetag = this.t()
        const d = new Date(0)
        d.setUTCSeconds(timetag.epoch)

        // 1st bundle
        const size0 = this.i(), offset0 = this.offset
        console.log(`timetag: ${d} offset: ${this.offset} size: ${size0}`)
        if (this.s() !== "/%%/Chordata/q") {
            throw Error(`not a Chordata packet`)
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
