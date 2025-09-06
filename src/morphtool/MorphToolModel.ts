import { Action, BooleanModel, OptionModel, TextModel } from 'toad.js'

export class MorphToolModel {
    isARKitActive = new BooleanModel(false, { label: "MH / ARKit" });
    showBothMeshes = new BooleanModel(true, { label: "Show both meshes" });

    morphGroupData = new Map<string, {mh: number[], extern: number[]}>()
    
    mapping = ["none"]
    morphGroups = new OptionModel("none", this.mapping, { label: "Morph Groups" })
    newMorphGroup = new TextModel("none")
    addMorphGroup = new Action(() => {
        this.mapping.push(this.newMorphGroup.value.trim())
        this.mapping = this.mapping.sort()
        this.morphGroups.setMapping(this.mapping)
        this.morphGroups.value = this.newMorphGroup.value
    }, { label: "+" })
    deleteMorphGroup = new Action(() => {
        this.mapping = this.mapping.filter(it => it !== this.newMorphGroup.value.trim())
        this.morphGroups.setMapping(this.mapping)
        this.morphGroups.value = this.mapping[0]
    }, { label: "-" })
    deleteEnabled = () => {
        if (["", "none"].includes(this.morphGroups.value.trim())) {
            this.deleteMorphGroup.enabled = false
            return
        }
        this.deleteMorphGroup.enabled = this.mapping.find(it => it === this.morphGroups.value.trim()) !== undefined
    }
    addEnabled = () => {
        if (["", "none"].includes(this.morphGroups.value.trim())) {
            this.addMorphGroup.enabled = false
            return
        }
        this.addMorphGroup.enabled = this.mapping.find(it => it === this.morphGroups.value.trim()) === undefined
    }
    // store = () => {}
    constructor() {
        // this.morphGroups.signal.add(this.store)
        this.morphGroups.signal.add(this.deleteEnabled)
        this.morphGroups.signal.add(this.addEnabled)
        this.addEnabled()
        this.deleteEnabled()
    }
}
