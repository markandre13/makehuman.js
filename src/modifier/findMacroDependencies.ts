import { TargetFactory } from '../target/TargetFactory'

export function findMacroDependencies(path: string | undefined) {
    const result = new Set<string>()
    if (path === undefined) {
        return result
    }

    // most calls will just yield and empty set, e.g.
    //   findMacroDependencies(head-head-age-decr) -> nothin'
    // only the following will deliver results:
    //   findMacroDependencies(breast) -> 'age' 'gender' 'breastfirmness' 'weight' 'breastsize' 'muscle'
    //   findMacroDependencies(macrodetails) -> 'age' 'race' 'gender'
    //   findMacroDependencies(macrodetails-universal) -> 'muscle' 'age' 'gender' 'weight'
    //   findMacroDependencies(macrodetails-height) -> 'age' 'gender' 'weight' 'height' 'muscle' 
    //   findMacroDependencies(macrodetails-proportions) -> 'age' 'gender' 'weight' 'bodyproportions' 'muscle'    
    TargetFactory.getInstance().groups.get(path)?.forEach( target => {
        target.data.forEach( (value, key) => {
            if (value !== undefined) {
                result.add(key)
            }
        })
    })
    return result
}