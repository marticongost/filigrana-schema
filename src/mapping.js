import { Field, FieldRole } from './field.js';
import { getParameter } from './utils.js';

const KEYS = Symbol('KEYS');
const VALUES = Symbol('VALUES');


export class Mapping extends Field {

    constructor(parameters = null) {
        super(parameters);
        this[KEYS] = getParameter(parameters, 'keys');
        this[VALUES] = getParameter(parameters, 'values');

        if (this[KEYS]) {
            this.claim(this[KEYS], FieldRole.MAP_KEY);
        }

        if (this[VALUES]) {
            this.claim(this[VALUES], FieldRole.MAP_VALUE);
        }
    }

    getCopyParameters(options = null) {

        const {
            keys,
            values,
            keysParameters,
            valuesParameters,
            ...baseOptions
        } = options;

        if (!keys && this[KEYS]) {
            keys = this[KEYS].copy(keysParameters);
        }

        if (!values && this[values]) {
            values = this[values].copy(valuesParameters);
        }

        return Object.assign(
            super.getCopyParameters(baseOptions),
            {keys, values}
        );
    }

    /**
     * A field describing the keys contained by the collection.
     *
     * @type {Field}
     */
    get keys() {
        return this[KEYS];
    }

    /**
     * A field describing the values contained by the collection.
     *
     * @type {Field}
     */
    get values() {
        return this[VALUES];
    }
}
