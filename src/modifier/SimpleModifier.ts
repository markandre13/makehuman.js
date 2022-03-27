import { Modifier } from './Modifier'

// single target file, value in [0,1]
export class SimpleModifier extends Modifier {
    filename: string

    constructor(groupName: string, basepath: string, targetpath: string) {
        super(
            groupName,
            targetpath
                .replace('.target', '')
                .replace('/', '-')
                .replace('\\', '-')
        )
        // this.filename = path.join(basepath, targetpath)
        this.filename = `${basepath}/${targetpath}`
        this.targets = this.expandTemplate([[this.filename, []]])
    }

    override getFactors(value: number): Map<string, number> {
        return new Map([['dummy', 1.0]])
    }

    override clampValue(value: number): number {
        return Math.max(0.0, Math.min(1.0, value))
    }

    private expandTemplate(t: any): any {
        throw Error('Not implemented')
    }
}
