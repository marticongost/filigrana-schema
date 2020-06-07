const ROOT_STORE = Symbol('ROOT_STORE');
const PARAMETERS = Symbol('PARAMETERS');
const MODEL = Symbol('MODEL');

export class ObjectStore {

    constructor(options = null) {

        const parent = options && options.parent;
        const parameters = options && options.parameters;

        this[ROOT_STORE] = parent ? parent[ROOT_STORE] : this;

        if (parent) {
            this[MODEL] = parent[MODEL];
        }

        this[PARAMETERS] = Object.freeze(
            Object.assign({}, parent && parent[PARAMETERS], parameters)
        );
    }

    toString() {
        const args = [];
        if (this[MODEL]) {
            args.push(this[MODEL].name);
        }
        for (let key in this[PARAMETERS]) {
            args.push(`${key}=${this[PARAMETERS][key]}`);
        }
        return `${this.constructor.name}(${args.join(' ')})`;
    }

    bind(model) {
        if (this[MODEL]) {
            throw new Error(`${this} is already bound to ${this[MODEL]}`);
        }
        this[MODEL] = model;
    }

    get parameters() {
        return this[PARAMETERS];
    }

    select(options) {
        return new this.constructor({parent: this, ...options});
    }

    [Symbol.asyncIterator]() {
        throw new Error(
            `${this} doesn't implement the asynchronous iteration protocol`
        );
    }

    async list() {
        const list = [];
        for await (let object of this) {
            list.push(object);
        }
        return list;
    }

    async get(options) {
        let object = null;

        for await (let result of this.select(options)) {
            if (object) {
                throw new MultipleResultsError(this, options);
            }
            object = result;
        }

        if (!object) {
            throw new NotFoundError(this, options);
        }

        return object;
    }

    async count() {
        let n = 0;
        for await (let result of this) {
            n++;
        }
        return n;
    }

    async exists() {
        for await (let result of this) {
            return true;
        }
        return false;
    }
}

const BASE_PATH = Symbol('BASE_PATH');

export class RESTObjectStore extends ObjectStore {

    constructor(options = null) {
        super(options);
        this[BASE_PATH] = options && options.basePath;
        if (!this[BASE_PATH]) {
            if (options && options.parent) {
                this[BASE_PATH] = options.parent[BASE_PATH];
            }
            if (!this[BASE_PATH]) {
                throw new ObjectStoreConfigurationError(this);
            }
        }
    }

    get model() {
        return this[MODEL];
    }

    get basePath() {
        return this[ROOT_STORE][BASE_PATH];
    }

    getURL(options = null) {

        let url = this.basePath;

        if (options && options.path) {
            url += options.path;
        }

        let qs = [];
        for (let key in this[PARAMETERS]) {
            const value = this[PARAMETERS][key];
            if (typeof(value) == 'array') {
                for (let item of value) {
                    qs.push(`${key}=${encodeURIComponent(item.toString())}`);
                }
            }
            else {
                qs.push(`${key}=${encodeURIComponent(value.toString())}`);
            }
        }
        if (qs.length) {
            url += `?${qs.join('&')}`;
        }

        return url;
    }

    objectFromJSON(record) {
        return this.model.fromJSON(record);
    }

    get fetchOptions() {
        return {};
    }

    fetchURL(options) {

        let urlOptions = options;
        let fetchOptions = this.fetchOptions;

        if (options) {
            let {method, ...urlOptions} = options;
            if (method) {
                fetchOptions.method = method;
            }
        }

        return (
            fetch(this.getURL(urlOptions), fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new ObjectStoreRequestError(response);
                }
                return response;
            })
        );
    }

    async *[Symbol.asyncIterator]() {
        const response = await this.fetchURL();
        const json = await response.json();
        for (let record of json) {
            yield this.objectFromJSON(record);
        }
    }
}

const STORE = Symbol('STORE');

export class ObjectStoreError extends Error {

    constructor(store, message = null) {
        super(message || `Error in ${store}`);
        this[STORE] = store;
    }

    get store() {
        return this[STORE];
    }
}

export class ObjectStoreConfigurationError extends ObjectStoreError {

    constructor(store) {
        super(store, 'Invalid configuration');
    }
}

const RESPONSE = Symbol('RESPONSE');

export class ObjectStoreRequestError extends ObjectStore {

    constructor(store, response) {
        super(store, 'Error while processing request');
        this[RESPONSE] = response;
    }

    get response() {
        return this[RESPONSE];
    }
}

export class NotFoundError extends ObjectStoreError {

    constructor(store) {
        super(store, `Couldn't find object ${store}`);
    }
}

export class MultipleResultsError extends ObjectStoreError {

    constructor(store, parameters) {
        super(
            store,
            `Found multiple results when looking for object ${store}`
        );
    }
}
