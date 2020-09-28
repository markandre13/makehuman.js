export class TargetRef {
    targetPath: string
    factorDependencies: string[]
    constructor(targetPath: string, factorDependencies: string[]) {
        this.targetPath = targetPath
        this.factorDependencies = factorDependencies
    }
}
