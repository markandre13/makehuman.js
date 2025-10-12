import { Action, BooleanModel, OptionModel, TextModel } from 'toad.js'
import { MorphRenderer } from './MorphRenderer'
import { MorphGroupDB } from './MorphGroupDB'
import { di } from 'lib/di'
import { Application } from 'Application'
import { Connector } from 'net/Connector'
import { ARKitFaceDevice, Backend } from 'net/makehuman_stub'
import { CaptureDeviceType } from 'net/makehuman'
import { ARKitFaceReceiver as ARKitFaceReceiver_skel } from "../net/makehuman_skel"
import { ConnectionState } from 'net/ConnectionState'

export class MorphToolModel {
    renderer?: MorphRenderer

    isARKitActive = new BooleanModel(true, { label: "MH / ARKit" })
    isTransparentActiveMesh = new BooleanModel(true, { label: "Transparent active mesh" })
    showBothMeshes = new BooleanModel(true, { label: "Show both meshes" })
    showMapping = new BooleanModel(false, { label: "Show mapping" })
    // mhJawOpen = new NumberModel(0, {
    //     min: 0, max: 1, step: 0.01,
    //     label: "MH Jaw Open (pose)"
    // })
    // externJawOpen = new NumberModel(0, {
    //     min: 0, max: 1, step: 0.01,
    //     label: "ArKit Jaw Open (blendshape)"
    // })

    morphGroupData = new MorphGroupDB()

    private currentGroup = "none"
    private mapping = ["none"]
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
    switchGroup = async () => {
        if (this.mapping.find(it => it === this.morphGroups.value.trim())) {
            const nextgroup = this.morphGroups.value.trim()
            if (this.renderer) {
                if (this.currentGroup !== "none") {
                    const old = this.renderer.selection
                    this.morphGroupData.set({
                        name: this.currentGroup,
                        ...old!
                    })
                    this.saveToBackend()
                }
                this.renderer.selection = await this.morphGroupData.get(nextgroup)
            }
            this.currentGroup = nextgroup
        }
    }
    private visibilitychange() {
        if (document.visibilityState === "hidden" && this.renderer) {
            const old = this.renderer.selection
            this.morphGroupData.set({
                name: this.currentGroup,
                ...old!
            })
            this.saveToBackend()
        }
    }
    private async saveToBackend() {
        const fs = di.get(Application).frontend.filesystem
        if (fs !== undefined) {
            const all = await this.morphGroupData.all()
            const encoder = new TextEncoder()
            const uint8Array = encoder.encode(JSON.stringify(all))
            await fs.write("morphgroup.json", uint8Array)
        }
    }
    constructor() {
        this.visibilitychange = this.visibilitychange.bind(this)
        document.addEventListener("visibilitychange", this.visibilitychange)

        this.morphGroups.signal.add(this.switchGroup)
        this.morphGroups.signal.add(this.deleteEnabled)
        this.morphGroups.signal.add(this.addEnabled)
        this.addEnabled()
        this.deleteEnabled()

        this.morphGroupData.all().then(data => {
            const morphGroupNames = data.map(it => it.name)
            this.mapping = ["none", ...morphGroupNames]
            this.morphGroups.setMapping(this.mapping)
        })

        const connector = di.get(Connector)
        connector.signal.add(() => this.connect())
        this.connect()
    }
    private connect() {
        const connector = di.get(Connector)
        if (connector.state !== ConnectionState.CONNECTED) {
            return
        }
        const backend = di.get(Application).frontend.backend as Backend
        backend?.captureDevices().then((devices) => {
            console.log(`connecting: found ${devices.length} capture devices`)
            for (const device of devices) {
                console.log(`* ${CaptureDeviceType[device.type]} ${device.name}`)
                if (device.device instanceof ARKitFaceDevice) {
                    console.log("FOUND ARKitFaceDevice -> set receiver")
                    device.device.receiver(new ARKitFaceReceiver_impl(backend._orb))
                }
            }
        })
    }
}

class ARKitFaceReceiver_impl extends ARKitFaceReceiver_skel {
    faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        console.log(`ARKitFaceReceiver_impl::faceBlendshapeNames([${faceBlendshapeNames.length}])`)
    }
    faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        console.log(`ARKitFaceReceiver_impl::faceLandmarks([${landmarks.length}], [${blendshapes.length}], [${transform.length}], ${timestamp_ms})`)
    }
}
