import { ManagedTargetModifier } from "./ManagedTargetModifier"
import { Target } from "../target/Target"
import { TargetFactory } from "../target/TargetFactory"
import { Component } from "../target/Component"
import { TargetRef } from "./TargetRef"

// findTargets('buttocks-buttocks-volume-decr') -> [('data/targets/buttocks/buttocks-volume-decr.target', ['buttocks-buttocks-volume-decr'])]
// findTargets('buttocks-buttocks-volume-incr') -> [('data/targets/buttocks/buttocks-volume-incr.target', ['buttocks-buttocks-volume-incr'])]
function findTargets(path: string|undefined):TargetRef[] {
    if (path === undefined)
        return []
    const targetsList = TargetFactory.getInstance().getTargetsByGroup(path) as Component[]
    const result = []
    for (const component of targetsList) {
        const targetgroup = "-"+component.tuple()
        const factordependencies = component.getVariables()
        factordependencies.push(targetgroup)
        result.push(
            new TargetRef(component.path!!, factordependencies)
        )
    }
    return result
}

// 1 to 3 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class UniversalModifier extends ManagedTargetModifier {

    targetName: string

    center?: string

    lTargets?: TargetRef[]
    cTargets?: TargetRef[]
    rTargets?: TargetRef[]

    constructor(groupName: string, targetName: string, leftExt?: string, rightExt?: string, centerExt?: string) {
        console.log(`UniversalModifier('${groupName}', '${targetName}', '${leftExt}', '${rightExt}', '${centerExt}')`)
        let fullTargetName = `${groupName}-${targetName}`
        let name: string
        let left: string | undefined
        let center: string | undefined
        let right: string | undefined
        if (leftExt !== undefined && rightExt !== undefined) {
            left = `${fullTargetName}-${leftExt}`
            right = `${fullTargetName}-${rightExt}`

            if (centerExt !== undefined) {
                center = `${fullTargetName}-${centerExt}`
                fullTargetName = `${fullTargetName}-${leftExt}|${centerExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${centerExt}|${rightExt}`
            } else {
                center = undefined
                fullTargetName = `${fullTargetName}-${leftExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${rightExt}`
            }
        } else {
            left = undefined
            right = fullTargetName
            center = undefined
            name = targetName
        }
        super(groupName, name)
        this.targetName = fullTargetName
        this.left = left
        this.center = center
        this.right = right

        // this load's the target's from the target factory
        this.lTargets = findTargets(this.left)
        this.rTargets = findTargets(this.right)
        this.cTargets = findTargets(this.center)

        // self.macroDependencies = self.findMacroDependencies(self.left)
        // self.macroDependencies.update(self.findMacroDependencies(self.right))
        // self.macroDependencies.update(self.findMacroDependencies(self.center))
        // self.macroDependencies = list(self.macroDependencies)

        // self.targets = self.l_targets + self.r_targets + self.c_targets
        for(const t0 of [this.lTargets, this.rTargets, this.cTargets])
            if (t0 !== undefined)
                for(const t1 of t0)
                    this.targets.push(t1)
    }

    getMin(): number {
        if (this.left !== undefined)
            return -1.0
        else
            return 0.0
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }
}
