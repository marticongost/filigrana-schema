
const ROOT_STORE = Symbol('ROOT_STORE');
const PARAMETERS = Symbol('PARAMETERS');
const MODEL = Symbol('MODEL');

export class ObjectStore {

    constructor(parent = null, parameters = null) {
        this[ROOT_STORE] = parent ? parent[ROOT_STORE] : this;
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

    select(parameters) {
        return new this.constructor(this, parameters);
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

    async get(parameters) {
        const results = await this.select(parameters).results();
        if (!results.length) {
            throw new NotFoundError(this, parameters);
        }
        if (results.length > 1) {
            throw new MultipleResultsError(this, parameters, results.count);
        }
        return results[0];
    }

    async count() {
        const results = await this.results();
        return results.length;
    }

    async exists() {
        const results = await this.results();
        return results.length > 0;
    }
}

const BASE_PATH = Symbol('BASE_PATH');

export class RESTObjectStore extends ObjectStore {

    constructor(basePath, parent = null, parameters = null) {
        super(parent, parameters);
        this[BASE_PATH] = basePath;
    }

    get model() {
        return this[MODEL];
    }

    get basePath() {
        return this[ROOT_STORE][BASE_PATH];
    }

    getURL() {

        let url = this.basePath;

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

    async *[Symbol.asyncIterator]() {
        const response = await fetch(this.getURL(), this.fetchOptions);
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

export class NotFoundError extends ObjectStoreError {

    constructor(store) {
        super(store, `Couldn't find object ${store}`);
    }
}

const COUNT = Symbol('COUNT');

export class MultipleResultsError extends ObjectStoreError {

    constructor(store, parameters, count) {
        super(
            store,
            `Found ${count} results when looking for object ${store}`
        );
        this[COUNT] = count;
    }

    get count() {
        return this[COUNT];
    }
}
