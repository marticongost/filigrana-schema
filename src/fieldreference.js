import { Field } from "./field";

/**
 * A type of field that makes it possible to select one of the fields in a schema.
 */
export class FieldReference extends Field {

    getValueId(value) {
        if (value) {
            return value.getQualifiedName();
        }
        return super.getValueId(value);
    }

    getValueLabel(value, options = null) {
        if (value) {
            return value.getQualifiedLabel();
        }
        return super.getValueLabel(value, options);
    }
}
