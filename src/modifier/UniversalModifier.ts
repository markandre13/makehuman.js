import { ManagedTargetModifier } from './ManagedTargetModifier'
import { MorphTarget } from '../target/MorphTarget'
import { Component } from '../target/Component'
import { findTargets } from './findTargets'

// 1 to 3 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class UniversalModifier extends ManagedTargetModifier {
    targetName: string
    center?: string

    constructor(groupName: string, targetName: string, leftExt?: string, rightExt?: string, centerExt?: string) {
        // console.log(`UniversalModifier('${groupName}', '${targetName}', '${leftExt}', '${rightExt}', '${centerExt}')`)
        let fullTargetName = `${groupName}-${targetName}`
        let name: string
        let left: string | undefined
        let center: string | undefined
        let right: string
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
        for(const targets of [this.lTargets, this.rTargets, this.cTargets])
            if (targets !== undefined)
                for(const target of targets)
                    this.targets.push(target)
    }

    override getMin(): number {
        if (this.left !== undefined)
            return -1.0
        else
            return 0.0
    }

    override getFactors(value: number): Map<string, number> {
        const factors = super.getFactors(value)

        if (this.left !== undefined)
            factors.set(this.left, -Math.min(value, 0))
        if (this.center !== undefined)
            factors.set(this.center, 1.0 - Math.abs(value))
        factors.set(this.right!, Math.max(0, value))

        return factors
    }

    // override setValue(value: number) {
    //     value = this.clampValue(value)

    //     console.log(`UniversalModifier.setValue(${value}) // modifier ${this.fullName}`)

    //     // const factors = this.getFactors(value)
    //     // const tWeights = this.getTargetWeights(this.targets, factors)
        

    //     // value = self.clampValue(value)
    //     // factors = self.getFactors(value)

    //     // tWeights = getTargetWeights(self.targets, factors)
    //     // for tpath, tWeight in tWeights.items():
    //     //     self.human.setDetail(tpath, tWeight)

    //     // if skipDependencies:
    //     //     return

    //     // # Update dependent modifiers
    //     // self.propagateUpdate(realtime = False)
    // }

    // override getValue(): number {
    //     throw Error('Not implemented')
    //     // right = sum([self.human.getDetail(target[0]) for target in self.r_targets])
    //     // if right:
    //     //     return right
    //     // else:
    //     //     return -sum([self.human.getDetail(target[0]) for target in self.l_targets])
    // }
}
