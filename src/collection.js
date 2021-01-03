import { Field, FieldRole, ValidationError } from './field.js';
import { getParameter } from './utils.js';

const ITEMS = Symbol('ITEMS');
const COLLECTION_CLASS = Symbol('COLLECTION_CLASS');
const MIN_ITEMS = Symbol('MIN_ITEMS');
const MAX_ITEMS = Symbol('MAX_ITEMS');


export class Collection extends Field {

    constructor(parameters = null) {
        super(parameters);
        this[ITEMS] = getParameter(parameters, 'items');
        this[COLLECTION_CLASS] = (
            getParameter(parameters, 'collectionClass', Array)
        );
        this[MIN_ITEMS] = getParameter(parameters, 'minItems');
        this[MAX_ITEMS] = getParameter(parameters, 'maxItems');

        if (this[ITEMS]) {
            this.claim(this[ITEMS], FieldRole.COLLECTION_ITEMS);
        }
    }

    getCopyParameters(options = null) {

        const {items, itemsParameters, ...baseOptions} = options;

        if (!items && this[ITEMS]) {
            items = this[ITEMS].copy(itemsParameters);
        }

        return Object.assign(
            super.getCopyParameters(baseOptions),
            {
                items,
                collectionClass: this[COLLECTION_CLASS],
                minItems: this[MIN_ITEMS],
                maxItems: this[MAX_ITEMS]
            }
        );
    }

    /**
     * A field describing the items contained by the collection.
     *
     * @type {Field}
     */
    get items() {
        return this[ITEMS];
    }

    /**
     * The class used to represent values of the collection.
     */
    get collectionClass() {
        return this[COLLECTION_CLASS];
    }

    /**
     * The minimum number of items allowed inside the collection.
     */
    get minItems() {
        return this[MIN_ITEMS];
    }

    /**
     * The maximum number of items allowed inside the collection.
     */
    get maxItems() {
        return this[MAX_ITEMS];
    }
}


/**
 * A validation error produced if a {@link Collection} contains less items than
 * the minimum mandated by {@link Collection#minItems}.
 */
export class NotEnoughItemsError extends ValidationError {

    constructor(validation, minItems) {
        super(validation, `${minItems} or more items are required`);
        this.minItems = minItems;
    }
}


/**
 * A validation error produced if a {@link Collection} contains more items than
 * the maximum allowed by {@link Collection#maxItems}.
 */
export class TooManyItemsError extends ValidationError {

    constructor(validation, maxItems) {
        super(validation, `only accepts ${maxItems} at most`);
        this.maxItems = maxItems;
    }
}
