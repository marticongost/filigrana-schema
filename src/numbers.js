
import { Field } from "./field";

const FORMATTER = Symbol('FORMATTER');

export const NUMBER_FORMATTER = new Intl.NumberFormat(navigator.language, {});

class Number extends Field {

    constructor(parameters = null) {
        const {formatter, ...baseParameters} = parameters;
        super(baseParameters);
        this[FORMATTER] = formatter;
        if (!this[FORMATTER]) {
            this[FORMATTER] = NUMBER_FORMATTER;
        }
        else if (!(this[FORMATTER] instanceof Intl.NumberFormat)) {
            this[FORMATTER] = new Intl.NumberFormat(navigator.language, this[FORMATTER]);
        }
    }

    static get type() {
        return 'number';
    }

    static get formatter() {
        return this[FORMATTER];
    }

    getValueLabel(value, options = null) {
        const formatter = options && options.formatter || this[FORMATTER];
        return formatter.format(value);
    }
}

export class Integer extends Number {
}

export class Float extends Number {
}
