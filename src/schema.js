import { Field, FieldRole } from './field';
import { Collection } from './collection';
import { Reference } from './reference';

const BASE = Symbol('BASE');
const FIELDS = Symbol('FIELDS');
const GROUPS = Symbol('GROUPS');
const GROUPED = Symbol('GROUPED');

export class Schema extends Field {

    constructor(parameters = null) {
        const {base, groups, fields, ...baseParameters} = parameters;
        super(baseParameters);
        this[BASE] = base;
        this[FIELDS] = [];
        this[GROUPS] = [];

        if (groups) {
            for (let group of groups) {
                this.addGroup(group);
            }
        }

        if (fields) {
            for (let field of fields) {
                this.addField(field);
            }
        }
    }

    /**
     * Iterates over the schema's field groups.
     */
    *groups() {
        yield *this[GROUPS];
    }

    /**
     * Indicates whether the fields contained within the schema are arranged into
     * groups.
     */
    get grouped() {
        return this[GROUPED];
    }

    /**
     * Defines a group of fields on the schema.
     *
     * @param {Group} group - The group to add to the schema.
     * @return {Group} The passed in group.
     */
    addGroup(group) {

        if (!group.name) {
            throw new AnonymousGroupError(group, this);
        }

        if (group.schema) {
            throw new GroupOwnershipError(this, group);
        }

        this[GROUPS].push(group);
        this[GROUPS][group.name] = group;
        return group;
    }

    addField(field) {

        if (!field.name) {
            throw new AnonymousFieldError(field, this);
        }

        this.claim(field, FieldRole.SCHEMA_FIELD);
        this[FIELDS][field.name] = field;
        this[FIELDS].push(field);

        // Attach the field to its group
        if (field.group) {
            const group = this[GROUPS][field.group];
            if (!group) {
                throw new GroupNotFoundError(this, field.group);
            }
            this[GROUPED] = true;
            group.addField(field);
        }

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

        // Clone groups
        parameters.groups = this[GROUPS].map(group => group.copy());

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
                        throw new FieldNotFoundError(this, spec);
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
     * @returns {Field}
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

    /** Obtains one of the field groups of the schema, given its name.
     *
     * If no such group exists the method returns null.
     *
     * @param {String} name - The name of the group to obtain.
     * @return {Object}
     */
    getGroup(name) {
        let schema = this;
        while (schema) {
            const group = schema[GROUPS][name];
            if (group) {
                return group;
            }
            schema = schema[BASE];
        }
        return null;
    }
}

/**
 * An exception thrown when attempting to add a group without a name to a schema.
 */
class AnonymousGroupError extends Error {

    constructor(group, schema) {
        super(`Can't add anonymous group ${group} to ${schema}`);
        this.group = group;
        this.schema = schema;
    }
}

/**
 * An exception thrown when attempting to add a field without a name to a schema.
 */
class AnonymousFieldError extends Error {

    constructor(field, schema) {
        super(`Can't add anonymous field ${field} to ${schema}`);
        this.field = field;
        this.schema = schema;
    }
}

/**
 * An exception thrown when attempting to retrieve an schema group using an invalid
 * name.
 */
class GroupNotFoundError extends Error {

    constructor(schema, groupName) {
        super(`${schema} doesn't contain a group named ${groupName}`);
        this.schema = schema;
        this.groupName = groupName;
    }
}

/**
 * An exception thrown when attempting to retrieve an schema member using an invalid
 * name.
 */
class FieldNotFoundError extends Error {

    constructor(schema, fieldName) {
        super(`${schema} doesn't contain a member named ${fieldName}`);
        this.schema = schema;
        this.fieldName = fieldName;
    }
}

/**
 * An exception thrown when attempting to add a group that already belongs to a schema
 * to another schema.
 */
export class GroupOwnershipError extends Error {

    constructor(claimer, group) {
        super(
            `${claimer} can't add group ${group}, since the group `
          + `already belongs to ${group.owner}`
        );
        this.claimer = claimer;
        this.group = group;
    }
}
