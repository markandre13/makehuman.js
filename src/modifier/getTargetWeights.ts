import { TargetRef } from './TargetRef'

// {'data/targets/buttocks/buttocks-volume-decr.target': -0.0, 'data/targets/buttocks/buttocks-volume-incr.target': 0.5}

export function getTargetWeights(targets: TargetRef[], factors: Map<string, number>, value = 1.0, ignoreNotfound = false) {
    // console.log(`getTargetWeights(..,..,${value}, ${ignoreNotfound})"`)
    const result = new Map<string, number>()
    if (ignoreNotfound) {
        targets.forEach((e) => {
            // console.log([1, 2, 5].reduce( (a, v) => a*v))
            // for factors in tfactors
            let mul = 1
            e.factorDependencies.forEach(factor => {
                const f = factors.get(factor)
                if (f !== undefined) {
                    mul *= f
                } else {
                    console.log(`no factor for '${factor}'`)
                }
            })
            result.set(e.targetPath, value * mul) 
        })
        //     for (tpath, tfactors) in targets:
        //         result[tpath] = value * reduce(operator.mul, [factors.get(factor, 1.0) for factor in tfactors])
    } else {
        targets.forEach((e) => {
            // console.log([1, 2, 5].reduce( (a, v) => a*v))
            // for factors in tfactors
            let mul = 1
            e.factorDependencies.forEach(factor => {
                let f = factors.get(factor)
                if (f === undefined) {
                    console.log(`no factor for ${factor}`)
                    f = 1/3
                }
                mul *= f || 0
            })
            result.set(e.targetPath, value * mul)
        })
    }
    // console.log(result)
    return result
}
