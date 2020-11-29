
const NAME = Symbol("NAME");
const LABEL = Symbol("LABEL");
const FIELDS = Symbol("FIELDS");

export class Group {

    constructor(parameters) {
        this[NAME] = parameters.name;
        this[LABEL] = parameters.label;
        this[FIELDS] = [];
    }

    get name() {
        return this[NAME];
    }

    get label() {
        return this[LABEL];
    }

    get length() {
        return this[FIELDS].length;
    }

    copy(options = null) {
        return new this.constructor(this.getCopyParameters(options));
    }

    getCopyParameters(options = null) {
        return {name: this[NAME], label: this[LABEL]};
    }

    addField(field) {
        field.setGroup(this);
        this[FIELDS].push(field);
    }

    *fields() {
        yield *this[FIELDS];
    }
}
