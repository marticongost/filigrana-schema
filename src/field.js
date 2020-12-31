
import Enum from '@filigrana/enum';
import { isHint, applyHint, UndefinedHintError } from './hints';

const NAME = Symbol('NAME');
const OWNER = Symbol('OWNER');
const ROLE = Symbol('ROLE');
const GROUP = Symbol('GROUP');
const LABEL = Symbol('LABEL');
const NULL_LABEL = Symbol('NULL_LABEL');
const DESCRIPTION = Symbol('DESCRIPTION');
const TYPE = Symbol('TYPE');
const REQUIRED = Symbol('REQUIRED');
const DEFAULT_VALUE = Symbol('DEFAULT_VALUE');
const DATA_PATH = Symbol('DATA_PATH');
const SEARCHABLE = Symbol('SEARCHABLE');
const TYPE_NAMES = Symbol('TYPE_NAMES');

export class Field {

    constructor(parameters = null) {

        if (parameters) {
            if (parameters.name !== undefined) {
                this[NAME] = parameters.name;
            }

            if (parameters.label !== undefined) {
                this[LABEL] = parameters.label;
            }

            if (parameters.nullLabel !== undefined) {
                this[NULL_LABEL] = parameters.nullLabel;
            }

            if (parameters.description !== undefined) {
                this[DESCRIPTION] = parameters.description;
            }

            if (parameters.type !== undefined) {
                this[TYPE] = parameters.type;
            }

            if (parameters.required !== undefined) {
                this[REQUIRED] = parameters.required;
            }

            if (parameters.defaultValue !== undefined) {
                this[DEFAULT_VALUE] = parameters.defaultValue;
            }

            if (parameters.dataPath !== undefined) {
                this[DATA_PATH] = (
                    typeof(parameters.dataPath) == "string" ?
                    parameters.dataPath.split(".") : parameters.dataPath
                );
            }

            if (parameters.searchable !== undefined) {
                this[SEARCHABLE] = parameters.searchable;
            }

            if (parameters.group !== undefined) {
                this[GROUP] = parameters.group;
            }

            for (let hint of Object.getOwnPropertySymbols(parameters)) {
                applyHint(this, hint, parameters[hint]);
            }
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
     * @throws {FieldOwnershipError} - Thrown if the field already belongs to
     *      another field.
     */
    claim(field, role) {
        if (field[OWNER]) {
            throw new FieldOwnershipError(this, field, role);
        }
        field[OWNER] = this;
        field[ROLE] = this;
    }

    // === Field groups =======================================================

    /**
     * The group that the field belongs to.
     *
     * Returns null if the field belongs to no group.
     *
     * Be aware that this property won't return a reference to the actual
     * {@link Group} until the field's schema has been initialized. Until then,
     * the name of the group will be returned instead.
     */
    get group() {
        return this[GROUP] || null;
    }

    /**
     * Set the group of this field.
     * @param {Group} group
     * @throws {FieldGroupChangeError} - Thrown if the field already belongs to
     *      another group.
     */
    setGroup(group) {
        if (typeof(this[GROUP]) == "object") {
            throw new FieldGroupChangeError(this, group);
        }
        this[GROUP] = group;
    }

    // === Copying and initialization =========================================

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
            nullLabel: this[NULL_LABEL],
            description: this[DESCRIPTION],
            type: this[TYPE],
            required: this[REQUIRED],
            dataPath: this[DATA_PATH]
        };

        // Group
        if (typeof(this[GROUP]) == "object") {
            parameters.group = this[GROUP].name;
        }
        else {
            parameters.group = this[GROUP];
        }

        // Hints
        for (let key of Object.getOwnPropertySymbols(this)) {
            if (isHint(key)) {
                parameters[key] = this[key];
            }
        }

        // User supplied parameters
        if (options) {
            for (let key of Object.getOwnPropertyNames(options)) {
                parameters[key] = options[key];
            }
        }

        return parameters;
    }

     // === JSON import/export ================================================

    /**
     * Turns a JSON value into a valid value for the field.
     */
    fromJSON(value) {
        return value;
    }

    /**
     * Obtains the JSON representation for one of the field's values.
     */
    toJSON(value) {
        return value;
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
     * User readable label to be displayed when the field is given a null / undefined
     * value.
     *
     * @type {string}
     */
    get nullLabel() {
        return this[NULL_LABEL] || "";
    }

    /**
     * A detailed description of the field's contents and expected usage.
     */
    get description() {
        return this[DESCRIPTION];
    }

    /**
     * Obtains a serializable representation of one of the field's values.
     *
     * The returned value should be a string or an integer.
     */
    getValueId(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return value.toString();
    }

    /**
     * Obtains a descriptive representation of one of the field's values.
     *
     * The returned value should be a string suitable for inclusion in
     * controls, listings and, in general, user facing elements.
     */
    getValueLabel(value, options = null) {
        if (value === null || value === undefined) {
            return this.nullLabel;
        }
        return value.toString();
    }

    // === Values and constraints =============================================

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
     * Determines whether two values of the field should be considered as being equal.
     *
     * By default the method tests full equality (ie. applies the === operator). Field
     * types should override this method if they require a different kind of equality
     * comparison for their values.
     *
     * @param {*} value - The first value for the comparison
     * @param {*} otherValue - The second value for the comparison
     *
     * @returns A boolean indicating whether the values are equal (true) or different
     *  (false).
     */
    valueIsEqual(value, otherValue) {
        return value === otherValue;
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
     * Obtain the possible values for the field.
     *
     * @param {*} instance - The instance to obtain the possible values of the field
     *  for. This might be useful in order to limit the set of available values based
     *  depending on certain properties of the target object that will eventually define
     *  the value for the field. This parameter is optional; implementations should NOT
     *  assume it will always be given.
     *
     * @returns A list of valid values for the field, or null if the field can't be
     *  constrained to a finite set of values.
     */
    getPossibleValues(instance = null) {
        return null;
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

    /**
     * An array indicating a custom path to retrieve the values of the field.
     *
     * By default, fields assume a flat key/value mapping, where their value is found
     * at the root level of an object, mapped to a key with their same name. But in some
     * cases, objects will arrange their values into nested object structures instead.
     * In order to access the field value in those cases, this property should be set
     * to a qualified dotted name, indicating the location of the field's value within
     * the object tree (f. eg. "sales.delta.absolute", "sales.delta.percentage").
     *
     * The value is split into an array of attributes by the constructor.
     *
     * When left blank, the simple flat key/value convention is assumed.
     */
    get dataPath() {
        return this[DATA_PATH];
    }

    /**
     * Obtains the value for the field from the given record.
     *
     * By default retrieves the value of the key matching the field's name. If the field
     * defines a {@link data_path}, it uses it to traverse a nested object structure.
     *
     * @param {object} record
     */
    getValueFromRecord(record) {
        if (this[DATA_PATH]) {
            let value = record;
            for (let attrName of this[DATA_PATH]) {
                value = value[attrName];
                if (value === null || value === undefined) {
                    break;
                }
            }
            return value;
        }
        return record[this[NAME]];
    }

    // === Text search ========================================================

    /**
     * Determines if the field type should be included in text searches by
     * default.
     *
     * Field instances can override this through their {@link Field#searchable}
     * property.
     *
     * @type {bool}
     */
    static get searchable() {
        return false;
    }

    /**
     * Determines if the field should contribute to the searchable text of the
     * object it belongs to.
     *
     * If not set it defaults to the {@link Field.searchable} property.
     *
     * @type {bool}
     */
    get searchable() {
        if (this[SEARCHABLE] === undefined) {
            return this.constructor.searchable;
        }
        return this[SEARCHABLE];
    }

    /**
     * Extracts searchable text from the provided value.
     *
     * @param {String} value - The value to obtain the text for.
     * @returns {String} - A string containing the searchable text for the
     * given value.
     */
    getSearchableText(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return value.toString();
    }

    /**
     * Obtains a string containing a space separated list of type names for the field
     * type.
     *
     * This is useful when producing schema driven UIs; the HTML produced by a control
     * or display associated with a field can be annotated with this value in order to
     * make it simple to style or select UI elements by their field types.
     *
     * The value contains entries for the type itself and all base types, from more
     * general to more specific.
     *
     * For example, a "Table" component could add a "data-type" HTML attribute to its
     * headings and cells, making it trivial to align all numeric columns to the right.
     */
    static get typeNames() {
        if (!this.hasOwnProperty(TYPE_NAMES)) {
            let nameList = [];
            let fieldClass = this;
            while (fieldClass !== Object && fieldClass !== Field && fieldClass.name) {
                nameList.unshift(fieldClass.name);
                fieldClass = fieldClass.__proto__;
            }
            this[TYPE_NAMES] = nameList.join(' ');
        }
        return this[TYPE_NAMES];
    }

    // === Hints ==============================================================

    /**
     * Obtains the value of the given hint for the field.
     *
     * @param {Symbol} hint
     * @returns The value of the given hint.
     * @throws {UndefinedHintError} Thrown if the hint is undefined.
     */
    requireHint(hint) {
        const value = this[hint];
        if (value === undefined) {
            throw new UndefinedHintError(this, hint);
        }
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

/**
 * An exception thrown when a field is given a value that it can't parse.
 *
 * Implementations of {@link Field.fromJSON} should throw this error if they are unable
 * to parse a value.
 */
export class ParseError extends Error  {

    constructor(field, value) {
        super(`${value} is not a valid value for ${field}`);
        this.field = field;
        this.value = value;
    }
}

/**
 * An exception thrown when attempting to add a field that already belongs to a group
 * to another group.
 */
export class FieldGroupChangeError extends Error {

    constructor(group, field) {
        super(`Can't assign ${field} to ${group}, it already belongs to ${field.group}`);
        this.group = group;
        this.field = field;
    }
}
