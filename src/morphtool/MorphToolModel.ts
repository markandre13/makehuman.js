import { BooleanModel } from 'toad.js'


export class MorphToolModel {
    isARKitActive = new BooleanModel(false, { label: "MH / ARKit" });
    showBothMeshes = new BooleanModel(true, { label: "Show both meshes" });
}
