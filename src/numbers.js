
import { Field } from "./field";

const FORMAT = Symbol('format');

export const NUMBER_FORMATTER = new Intl.NumberFormat(navigator.language, {});

class Number extends Field {

    constructor(parameters = null) {
        const {format, ...baseParameters} = parameters;
        super(baseParameters);
        this[FORMAT] = format;
        if (!this[FORMAT]) {
            this[FORMAT] = NUMBER_FORMATTER;
        }
        else if (!(this[FORMAT] instanceof Intl.NumberFormat)) {
            this[FORMAT] = new Intl.NumberFormat(navigator.language, this[FORMAT]);
        }
    }

    getCopyParameters(options = null) {
        const parameters = super.getCopyParameters(options);
        parameters.format = this[FORMAT];
        return parameters;
    }

    static get type() {
        return 'number';
    }

    static get format() {
        return this[FORMAT];
    }

    getValueLabel(value, options = null) {
        const format = options && options.format || this[FORMAT];
        let formatter = (
            format instanceof Intl.NumberFormat ?
            format : new Intl.NumberFormat(navigator.language, format)
        );
        return formatter.format(value);
    }
}

export class Integer extends Number {
}

export class Float extends Number {
}
