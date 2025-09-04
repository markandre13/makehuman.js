import { BooleanModel } from 'toad.js'


export class MorphToolModel {
    isARKitActive = new BooleanModel(false, { label: "MH / ARKit" });
    showBothMeshes = new BooleanModel(false, { label: "Show both meshes" });
}
