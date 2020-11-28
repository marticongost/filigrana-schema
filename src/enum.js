import { Field } from "./field";

const ENUM = Symbol('ENUM');


/**
 * A type of field that constraints its possible values to those of an
 * {@link @filigrana/enum:Enum} class.
 */
export class Enum extends Field {

    constructor(parameters) {
        const enumeration = parameters.enum;
        const {...baseParameters} = parameters;
        delete baseParameters.enum;
        super(baseParameters);
        this[ENUM] = enumeration;
    }

    /**
     * The enumeration class that describes the possible values for the field.
     *
     * @type {@filigrana/enum:Enum}
     */
    get enum() {
        return this[ENUM];
    }

    getCopyParameters(options = null) {
        return Object.assign(
            super.getCopyParameters(options),
            {enum: this[ENUM]}
        );
    }

    getValueLabel(value, options = null) {
        if (value && value.label) {
            return value.label;
        }
        return super.getValueLabel(value, options);
    }

    fromJSON(value) {
        return this[ENUM].getEntryByValue(value);
    }

    toJSON(value) {
        return value.toString();
    }
}
