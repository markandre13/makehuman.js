import { Human } from './Human'
import { getTarget } from './fileformats/target/TargetFactory'
import { Mesh, Group } from './fileformats/Mesh'

let epsilon = 0.000000001

export function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}


export class HumanMesh {
    human: Human
    obj: Mesh
    origVertex: number[]
    vertex: number[]
    indices: number[]
    groups: Group[]

    updateRequired = false

    constructor(human: Human, obj: Mesh) {
        this.human = human
        this.obj = obj
        this.vertex = this.origVertex = obj.vertex
        this.indices = obj.indices
        this.groups = obj.groups
    }

    update(): void {
        this.updateRequired = false
        
        // console.log("HumanMesh.update()")
        this.vertex = [...this.origVertex]
        this.human.targetsDetailStack.forEach( (value, targetName) => {
            if (isZero(value))
                return
            // console.log(`apply target ${targetName} with value ${value}`)
            const target = getTarget(targetName)
            target.apply(this.vertex, value)
        })

        // const stomachPregnantIncr = new Target()
        // stomachPregnantIncr.load('data/targets/stomach/stomach-pregnant-incr.target')
        // stomachPregnantIncr.apply(scene.vertex, 1)
    
        // const breastVolumeVertUp = new Target()
        // breastVolumeVertUp.load('data/targets/breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness.target')
        // breastVolumeVertUp.apply(scene.vertex, 1)
    
        // const buttocks = new Target()
        // buttocks.load('data/targets/buttocks/buttocks-volume-incr.target')
        // buttocks.apply(scene.vertex, 1)
    }
}