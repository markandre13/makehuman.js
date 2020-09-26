import { ManagedTargetModifier } from "./ManagedTargetModifier"

// 1 to 3 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class UniversalModifier extends ManagedTargetModifier {
    center?: string
    targetName: string

    constructor(groupName: string, targetName: string, leftExt?: string, rightExt?: string, centerExt?: string) {
        const fullTargetName = `${groupName}-${targetName}`
        let name: string
        let left: string | undefined
        let center: string | undefined
        let right: string | undefined
        if (leftExt !== undefined && rightExt !== undefined) {
            left = `${fullTargetName}-${leftExt}`
            right = `${fullTargetName}-${rightExt}`

            if (centerExt !== undefined) {
                center = `${fullTargetName}-${centerExt}`
                targetName = `${fullTargetName}-${leftExt}|${centerExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${centerExt}|${rightExt}`
            } else {
                center = undefined
                targetName = `${fullTargetName}-${leftExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${rightExt}`
            }
        } else {
            left = undefined
            right = targetName
            center = undefined
            name = targetName
        }
        super(groupName, name)
        this.targetName = fullTargetName
        this.left = left
        this.center = center
        this.right = right

        // throw Error("Not implemented")
        // self.l_targets = self.findTargets(self.left)
        // self.r_targets = self.findTargets(self.right)
        // self.c_targets = self.findTargets(self.center)
        // self.macroDependencies = self.findMacroDependencies(self.left)
        // self.macroDependencies.update(self.findMacroDependencies(self.right))
        // self.macroDependencies.update(self.findMacroDependencies(self.center))
        // self.macroDependencies = list(self.macroDependencies)
        // self.targets = self.l_targets + self.r_targets + self.c_targets
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
