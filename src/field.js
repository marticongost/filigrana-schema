
import Enum from '@filigrana/enum';
import { isHint, applyHint } from './hints';

const NAME = Symbol('NAME');
const OWNER = Symbol('OWNER');
const ROLE = Symbol('ROLE');
const LABEL = Symbol('LABEL');
const DESCRIPTION = Symbol('DESCRIPTION');
const TYPE = Symbol('TYPE');
const REQUIRED = Symbol('REQUIRED');
const DEFAULT_VALUE = Symbol('DEFAULT_VALUE');

export class Field {

    constructor(parameters = null) {
        const {
            name,
            label,
            description,
            type,
            required,
            defaultValue,
            ...customKeys
        } = parameters || {};

        if (name !== undefined) {
            this[NAME] = name;
        }

        if (label !== undefined) {
            this[LABEL] = label;
        }

        if (description !== undefined) {
            this[DESCRIPTION] = description;
        }

        if (type !== undefined) {
            this[TYPE] = type;
        }

        if (required !== undefined) {
            this[REQUIRED] = required;
        }

        if (defaultValue !== undefined) {
            this[DEFAULT_VALUE] = defaultValue;
        }

        for (let hint in Object.getOwnPropertyNames(customKeys)) {
            applyHint(this, hint, customKeys[hint]);
        }
    }

    toString() {
        return `${this.constructor.name}(${this.getQualifiedName()})`;
    }

    // === Naming and ownership ===============================================

    /**
     * The name of the field.
     *
     * @type {string}
     */
    get name() {
        return this[NAME];
    }

    /**
     * The qualified name for the field.
     *
     * Walks the field's ownership chain, adding the name of each owner,
     * starting from the root and ending at the field itself, joining each name
     * with a '.' character.
     *
     * @type {string}
     */
    getQualifiedName() {

        if (!this[NAME]) {
            return '';
        }

        if (this[OWNER]) {
            const ownerName = this[OWNER].getQualifiedName();
            if (ownerName) {
                return `${ownerName}.${this[NAME]}`;
            }
        }

        return this[NAME];
    }

    /**
     * The field that this field belongs to.
     *
     * @type {Field}
     */
    get owner() {
        return this[OWNER];
    }

    /**
     * The role that the field performs on the field that owns it.
     *
     * @type {FieldRole}
     */
    get role() {
        return this[ROLE];
    }

    /**
     * State that the given field will be used by this field to fulfill the
     * specified role.
     *
     * @param {Field} field - The field to claim
     * @param {FieldRole} role - The role that the field will fulfill
     *
     * @throws {FieldOwnershipError} - Thrown if the field already belong to
     *      another field.
     */
    claim(field, role) {
        if (field[OWNER]) {
            throw new FieldOwnershipError(this, field, role);
        }
        field[OWNER] = this;
        field[ROLE] = this;
    }

    // === Copying and initializationg ========================================

    /**
     * Creates a copy of the field.
     */
    copy(options = null) {
        return new this.constructor(this.getCopyParameters(options));
    }

    /**
     * Obtains the necessary parameters to create a copy of the field.
     */
    getCopyParameters(options = null) {

        const parameters = {
            name: this[NAME],
            label: this[LABEL],
            description: this[DESCRIPTION],
            type: this[TYPE],
            required: this[REQUIRED]
        };

        for (let key of Object.getOwnPropertyNames(this)) {
            if (isHint(key)) {
                parameters[key] = this[key];
            }
        }

        if (options) {
            for (let key of Object.getOwnPropertyNames(options)) {
                parameters[key] = options[key];
            }
        }

        return parameters;
    }

    // === User readable texts ================================================

    /**
     * User readable label for the field.
     *
     * @type {string}
     */
    get label() {
        return this[LABEL];
    }

    /**
     * A detailed description of the field's contents and expected usage.
     */
    get description() {
        return this[DESCRIPTION];
    }

    // === Constraints ========================================================

    /**
     * The type that values of the field are expected to have.
     *
     * @type {string}
     */
    get type() {
        return this[TYPE];
    }

    /**
     * Indicates whether the field is required to have a value in order
     * to be considered valid.
     *
     * See {@link valueIsBlank} for details on when a field is considered
     * to have no value.`
     *
     * @type {boolean}
     */
    get required() {
        return this[REQUIRED];
    }

    /**
     * Determines whether the field should consider the supplied value as being
     * blank.
     *
     * A blank value will fail to fulfill a {@link required} constraint. By
     * default, any of the following values will be considered blank:
     *
     * - undefined
     * - null
     * - An empty string
    */
    valueIsBlank(value) {
        return (value === undefined || value === null || value === '');
    }

    /**
     * The value returned by the field when not given a explicit value.
     *
     * See {@link produceDefaultValue} for the semantics of the property.
     *
     * @type {string|function}
     */
    get defaultValue() {
        return this[DEFAULT_VALUE];
    }

    /**
     * Produces the default value of the member for the given model instance.
     *
     * If {@link defaultValue} is a function it calls it, bound to the member
     * and forwarding {@link instance} as its single parameter; the function's
     * return value will be used as the default value.
     *
     * If {@link defaultValue} is not a function it is returned as is.
     *
     * @param {Model} instance - The model instance to get the default value
     * for. Note that this is optional and can be not set on certain
     * circumstances.
     */
    produceDefaultValue(instance = null) {
        const value = this[DEFAULT_VALUE];
        if (typeof(value) == 'function') {
            return value.call(this, instance);
        }
        return value;
    }

    /**
     * Normalizes a value for the field.
     *
     * By default the method returns the value as is, but field type
     * implementations (or instances) can override this to transform or reject
     * the values given to a model instance.
     *
     * @param {*} value - The value to normalize
     * @returns {*} - The normalized value.
     */
    normalize(value) {
        return value;
    }
}

Field.prototype[REQUIRED] = false;
Field.prototype[DEFAULT_VALUE] = null;

/**
 * The possible roles taken by fields in their relationship towards the field
 * that owns them.
 */
export class FieldRole extends Enum {

    /**
     * Indicates that a field is a member of a schema.
     */
    static get SCHEMA_FIELD() {
        return this._option('SCHEMA_FIELD');
    }

    /**
     * Indicates that a field describes the items of a collection.
     */
    static get COLLECTION_ITEMS() {
        return this._option('COLLECTION_ITEMS');
    }

    /**
     * Indicates that a field describes the keys of a mapping.
     */
    static get MAP_KEY() {
        return this._option('MAP_KEY');
    }

    /**
     * Indicates that a field describes the values of a mapping.
     */
    static get MAP_VALUE() {
        return this._option('MAP_VALUE');
    }

    /**
     * Indicates that a field describes one of the positions of a tuple.
     */
    static get TUPLE_ITEM() {
        return this._option('TUPLE_ITEM');
    }
}

/**
 * An exception thrown when attempting to claim a field that has already been
 * claimed by another owner.
 */
export class FieldOwnershipError extends Error {

    constructor(claimer, field, role) {
        super(
            `${claimer} can't claim ${field} as ${role}, since the field `
          + `already belongs to ${field.owner} as ${field.role}`
        );
        this.claimer = claimer;
        this.field = field;
        this.role = role;
    }
}

/**
 * Base class for all field validation errors.
 */
export class ValidationError extends Error {

    constructor(validation, message) {
        super(`Error in ${validation.pathDescription}: ${message}`);
        this.validation = validation;
        this.message = message;
    }
}

/**
 * A validation error produced if a required field is blank.
 */
export class ValueRequiredError extends ValidationError {

    constructor(validation) {
        super(validation, 'a value is required');
    }
}
