import { Application } from 'Application'
import { GLView } from './GLView'


export abstract class RenderHandler {
    abstract paint(app: Application, view: GLView): void
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
