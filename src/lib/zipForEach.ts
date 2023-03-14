export function zipForEach<A, B>(a: Array<A>, b: Array<B>, block: (a: A, b: B) => void) {
    if (a.length !== b.length) {
        throw Error(`lengths must be equal but are ${a.length} and ${b.length}`)
    }
    for(let i=0; i<a.length; ++i) {
        block(a[i], b[i])
    }
}