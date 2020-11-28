import { Field, ParseError } from "./field";
import { DateTime as DT } from "luxon";

const FORMAT = Symbol("format");

export class BaseDateTime extends Field {

    constructor(parameters) {
        const {format, ...baseParameters} = parameters || {};
        super(baseParameters);
        this[FORMAT] = format;
    }

    getCopyParameters(options = null) {
        const parameters = super.getCopyParameters(options);
        parameters.format = this[FORMAT];
        return parameters;
    }

    static get type() {
        return DT;
    }

    getValueLabel(value, options = null) {
        if (!value) {
            return "";
        }
        return value.toLocaleString(options && options.format);
    }
}

export class DateTime extends BaseDateTime {

    fromJSON(value) {
        if (!value) {
            return null;
        }
        return DT.fromISO(value);
    }

    toJSON(value) {
        if (!value) {
            return "";
        }
        return value.toISO();
    }
}

export class Date extends BaseDateTime {

    fromJSON(value) {
        return DT.fromISO(value).startOf("day");
    }

    toJSON(value) {
        if (!value) {
            return "";
        }
        return `${value.year}-${value.month}-${value.day}`;
    }
}
