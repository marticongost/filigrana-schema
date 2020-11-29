import { Schema } from './schema';
import { Field } from './field';

const SCHEMA = Symbol('SCHEMA');
const PROPERTIES = Symbol('PROPERTIES');
const OBJECT_STORE = Symbol('OBJECT_STORE');

export class Model {

    constructor(properties = null) {
        this[PROPERTIES] = {};
        if (properties) {
            for (let key in properties) {
                this.setValue(key, properties[key]);
            }
        }
    }

    static get objects() {
        return this[OBJECT_STORE];
    }

    static set objects(store) {
        this[OBJECT_STORE] = store;
        if (store) {
            store.bind(this);
        }
    }

    static defineField(field) {

        if (typeof(field) != 'object') {
            throw new Error(
                `Model.defineField() expected a Field object, `
                + `got a value of type "${typeof(field)}" instead`
            );
        }

        if (!(field instanceof Field)) {
            throw new Error(
                `Model.defineField() expected a Field object, `
                + `got an object of type ${field.constructor.name} instead`
            );
        }

        // Make the field accessible as a class property
        Object.defineProperty(
            this,
            field.name,
            {
                configurable: false,
                writable: false,
                value: field
            }
        );

        // Provide read / write accessors for the field's value
        Object.defineProperty(this.prototype, field.name, {
            configurable: false,
            get: function () {
                return this.getValue(field.name);
            },
            set: function (value) {
                this.setValue(field, value);
            }
        });
    }

    static defineSchema(parameters) {
        parameters.name = this.name;
        parameters.base = this[SCHEMA];
        this[SCHEMA] = new Schema(parameters);

        if (parameters.fields) {
            for (let field of parameters.fields) {
                this.defineField(field);
            }
        }
    }

    static get schema() {
        return this[SCHEMA];
    }

    getValueLabel(key) {
        const field = this.constructor[key];
        if (!field) {
            if (typeof(field) != 'string') {
                throw new Error(
                    `Model.getValue() expected a string key, `
                    + `got "${typeof(field)}" instead`
                );
            }
            throw new UnknownFieldError(this, key, 'get the label for');
        }
        return field.getValueLabel(this[PROPERTIES][key]);
    }

    getValue(key) {

        const field = this.constructor[key];
        if (!field) {
            if (typeof(field) != 'string') {
                throw new Error(
                    `Model.getValue() expected a string key, `
                    + `got "${typeof(field)}" instead`
                );
            }
            throw new UnknownFieldError(this, key, 'get');
        }

        let value = this[PROPERTIES][key];

        if (value === undefined) {
            value = field.produceDefaultValue(this);
            this[PROPERTIES][key] = value;
        }

        return value;
    }

    setValue(key, value) {
        const field = this.constructor[key];
        if (!field) {
            throw new UnknownFieldError(this, key, 'set');
        }
        this[PROPERTIES][key] = field.normalize(value);
    }

    copy(values = null) {
        const mergedValues = {};
        for (let field of this[SCHEMA].fields) {
            const key = field.name;
            if (values && field.name in values) {
                mergedValues[key] = values[key];
            }
            else {
                mergedValues[key] = this.getValue(key);
            }
        }
        return new this(mergedValues);
    }

    static fromJSON(record) {
        const properties = {};
        for (let field of this.schema.fields()) {
            properties[field.name] = field.fromJSON(record[field.name]);
        }
        return new this(properties);
    }

    toJSON() {
        const data = {};
        for (let field of this[SCHEMA].fields) {
            data[field.name] = field.toJSON(this.getValue(name));
        }
        return data;
    }

    /**
     * Obtains the searchable text for the object.
     *
     * @returns {String} - A string containing all the searchable text for the
     * object.
     */
    getSearchableText() {
        const chunks = [];
        for (let field of this.constructor[SCHEMA].fields()) {
            if (field.searchable) {
                let value = this.getValue(field.name);
                chunks.push(field.getSearchableText(value));
            }
        }
        return chunks.join(' ');
    }
}

const INSTANCE = Symbol('INSTANCE');
const FIELD_NAME = Symbol('FIELD_NAME');

class UnknownFieldError extends Error {

    constructor(instance, fieldName, action) {
        let instanceDesc;
        try {
            instanceDesc = instance.toString();
        }
        catch (e) {
            instanceDesc = instance.constructor.name;
        }
        super(`Can't ${action} ${fieldName} on ${instanceDesc}: no such field`);
        this[INSTANCE] = instance;
        this[FIELD_NAME] = fieldName;
    }

    get instance() {
        return this[INSTANCE];
    }

    get fieldName() {
        return this[FIELD_NAME];
    }
}
