const hints = new Set();
const setters = {};

export function declareHint(name, parameters = null) {
    const hint = Symbol(name);
    hints.add(hint);
    if (parameters && parameters.setValue) {
        setters[hint] = parameters.setValue;
    }
    return hint;
}

export function isHint(key) {
    return hints.has(key);
}

export function applyHint(field, hint, value) {

    if (!hints.has(hint)) {
        throw new UnknownHintError(field, hint, value);
    }

    const setValue = setters[hint];
    if (setValue) {
        setValue.call(field, value);
    }
    else {
        field[hint] = value;
    }
}

export class UnknownHintError extends Error {

    constructor(field, hint, value) {
        super(
            `Can't set ${hint} to ${value} on ${field}; it is not a valid hint. `
            + "If you want to set arbitrary properties on fields, use the declareHint "
            + "function."
        );
        this.field = field;
        this.hint = hint;
        this.value = value;
    }
}
