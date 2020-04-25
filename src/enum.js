import { Field } from "./field";

const ENUM = Symbol('ENUM');


/**
 * A type of field that constraints its possible values to those of an
 * {@link @filigrana/enum:Enum} class.
 */
export class Enum extends Field {

    constructor(parameters) {
        super(parameters);
        this[ENUM] = parameters.enum;
    }

    /**
     * The enumeration class that describes the possible values for the field.
     *
     * @type {@filigrana/enum:Enum}
     */
    get enum() {
        return this[ENUM];
    }
}
