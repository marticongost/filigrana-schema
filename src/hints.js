const hints = new Set();
const setters = {};

export function declareHint(name, parameters = null) {
    const hint = Symbol(name);
    hints.push(hint);
    if (parameters && parameters.setValue) {
        setters[hint] = parameters.setValue;
    }
}

export function isHint(key) {
    return hints.has(key);
}

export function applyHint(field, hint, value) {
    const setValue = setters[hint];
    if (setValue) {
        setValue.call(field, value);
    }
    else {
        field[hint] = value;
    }
}
