import { Application } from 'Application'
import { RenderHandler } from 'render/glview/RenderHandler'
import { ARKitFlat } from './ARKitFlat'
import { MorphToolModel } from './MorphToolModel'
import { MHFlat } from './MHFlat'
import { RenderView } from 'render/glview/RenderView'
import { di } from 'lib/di'

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel
      
    arflat!: ARKitFlat
    mhflat!: MHFlat

    constructor(app: Application, model: MorphToolModel) {
        super()
        this.app = app
        this.model = model
        this.model.isARKitActive.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
        this.model.showBothMeshes.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
    }
    override defaultCamera() {
        return di.get(Application).headCamera
    }
    override paint(app: Application, view: RenderView): void {
        // prepare
        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono       
        if (this.arflat === undefined) {
            this.mhflat = new MHFlat(app, gl)
            this.arflat = new ARKitFlat(app, gl)
        }
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
  
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.25

        const mesh = this.model.isARKitActive.value ? [this.arflat, this.mhflat] : [this.mhflat, this.arflat]

        // draw solid mesh
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])
        mesh[0].bind(shaderShadedMono)
        mesh[0].draw(gl)

        // draw transparent mesh
        if (this.model.showBothMeshes.value) {
            gl.disable(gl.CULL_FACE)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            shaderShadedMono.setColor(gl, [0, 0.5, 1, alpha])
            mesh[1].bind(shaderShadedMono)
            mesh[1].draw(gl)
        }      
    }
}
