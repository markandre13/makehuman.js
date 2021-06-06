export class TargetRef {
    targetPath: string // tPath
    factorDependencies: string[] // fFactors
    constructor(targetPath: string, factorDependencies: string[]) {
        this.targetPath = targetPath
        this.factorDependencies = factorDependencies
    }
}
