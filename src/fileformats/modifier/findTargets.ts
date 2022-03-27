import { TargetFactory } from '../target/TargetFactory'
import { TargetRef } from './TargetRef'

// static method of ManagedTargetModifiers
// findTargets('buttocks-buttocks-volume-decr') -> [('data/targets/buttocks/buttocks-volume-decr.target', ['buttocks-buttocks-volume-decr'])]
// findTargets('buttocks-buttocks-volume-incr') -> [('data/targets/buttocks/buttocks-volume-incr.target', ['buttocks-buttocks-volume-incr'])]
export function findTargets(path: string | undefined): TargetRef[] {
    if (path === undefined)
        return []
    const targetsList = TargetFactory.getInstance().getTargetsByGroup(path)
    if (targetsList === undefined)
        throw Error(`findTargets(): failed to get targetsList for ${path}`)
    // console.log(targetsList)
    const result = []
    for (const component of targetsList) {
        const targetgroup = component.tuple()
        const factordependencies = component.getVariables()
        factordependencies.push(targetgroup)
        result.push(
            new TargetRef(component.path!, factordependencies)
        )
    }
    return result
}