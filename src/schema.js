import { Field, FieldRole } from './field';
import { Collection } from './collection';
import { Reference } from './reference';

const BASE = Symbol('BASE');
const FIELDS = Symbol('FIELDS');

export class Schema extends Field {

    constructor(parameters = null) {
        const {base, fields, ...baseParameters} = parameters;
        super(baseParameters);
        this[BASE] = base;
        this[FIELDS] = [];
        if (fields) {
            for (let field of fields) {
                this.add(field);
            }
        }
    }

    add(field) {

        if (!field.name) {
            throw new AnonymousMemberError(field, this);
        }

        this.claim(field, FieldRole.SCHEMA_FIELD);
        this[FIELDS][field.name] = field;
        this[FIELDS].push(field);
        return field;
    }

    getCopyParameters(options = null) {

        const {
            fields,
            allFieldsParameters,
            perFieldParameters,
            ...baseOptions
        } = (options || {});

        const parameters = super.getCopyParameters(baseOptions);

        function produceField(field) {

            const fieldParameters = (
                field.name
                && perFieldParameters
                && perFieldParameters[field.name]
                || null
            );

            if (field.owner || allFieldsParameters || fieldParameters) {
                return field.copy(
                    Object.assign(
                        {},
                        allFieldsParameters,
                        fieldParameters
                    )
                );
            }

            return field;
        }

        // Custom field set
        if (fields) {
            parameters.fields = [];
            for (let spec of fields) {
                let field;
                if (typeof(spec) == 'string') {
                    const sourceField = this[FIELDS][spec];
                    if (!sourceField) {
                        throw new MemberNotFoundError(this, spec);
                    }
                    field = produceField(sourceField);
                }
                else if (spec instanceof Field) {
                    field = produceField(spec);
                }
                parameters.fields.push(field);
            }
        }
        // All fields
        else {
            parameters.fields = Array.from(this.fields(), produceField);
        }

        return parameters;
    }

    /**
     * The schema that this schema inherits from.
     *
     * @type {Schema}
     */
    get base() {
        return this[BASE];
    }

    /**
     * Iterate over the fields defined by the schema.
     *
     * @param includeInherited - If set to true (the default), the produced
     * sequence will include fields defined by the schema's bases. Set to false
     * to limit the sequence to those fields directly defined by the schema.
     *
     * @yields {Field}
     */
    *fields(includeInherited = true) {
        if (includeInherited) {
            let schema = this;
            while (schema) {
                yield *schema[FIELDS];
                schema = schema[BASE];
            }
        }
        else {
            yield *this[FIELDS];
        }
    }

    /**
     * Determine if the schema has one or more fields.
     *
     * @param {boolean} includeInherited - If set to true (the default), the
     * check will accept fields inherited from a base schema. If set to false
     * only fields directly defined by the schema itself will be considered.
     *
     * @returns {boolean}
     */
    hasFields(includeInherited = true) {
        if (includeInherited) {
            let schema = this;
            while (schema) {
                if (schema[FIELDS].length) {
                    return true;
                }
                schema = schema[BASE];
            }
            return false;
        }
        else {
            return this[FIELDS].length > 0;
        }
    }

    /**
     * Obtains a field, given its name.
     *
     * If no such field exists the method returns null.
     *
     * @param {String} name - The name of the field to obtain.
     */
    getField(name) {
        let schema = this;
        while (schema) {
            const field = schema[FIELDS][name];
            if (field) {
                return field;
            }
            schema = schema[BASE];
        }
        return null;
    }
}

class AnonymousMemberError extends Error {

    constructor(field, schema) {
        super(`Can't add anonymous field ${field} to ${schema}`);
        this.field = field;
        this.schema = schema;
    }
}

class MemberNotFoundError extends Error {

    constructor(schema, fieldName) {
        super(`${schema} doesn't contain a member named ${fieldName}`);
        this.schema = schema;
        this.fieldName = fieldName;
    }
}