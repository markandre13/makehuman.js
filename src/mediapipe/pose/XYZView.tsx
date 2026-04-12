import { FormLabel, FormField, FormHelp } from "toad.js/viewkit/Form"
import { XYZModel } from "./XYZModel"
import { TextField } from "toad.js/viewkit/TextField"

export function XYZView(props: { model: XYZModel} ) {
    return (
        <>
            <FormLabel model={props.model} />
            <FormField>
                <TextField model={props.model.x} style={{ width: "50px" }} />
                <TextField model={props.model.y} style={{ width: "50px" }} />
                <TextField model={props.model.z} style={{ width: "50px" }} />
            </FormField>
            <FormHelp model={props.model} />
        </>
    )
}
