import { Application } from 'Application'
import { RenderView } from './RenderView'
import { mat4 } from 'gl-matrix'

export abstract class RenderHandler {
    abstract paint(app: Application, view: RenderView): void
    abstract defaultCamera(): () => mat4
    onpointerdown(ev: PointerEvent): boolean {
        return true
    }
    onpointermove(ev: PointerEvent): boolean {
        return true
    }
    onpointerup(ev: PointerEvent): boolean {
        return true
    }
}
