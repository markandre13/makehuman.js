import { Application } from 'Application'
import { RenderView } from './RenderView'

export abstract class RenderHandler {
    abstract paint(app: Application, view: RenderView): void
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
