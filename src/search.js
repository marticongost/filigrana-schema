import { getParameter } from './utils';

const latinNormalization = {
    a: /[àáâãäåāăą]/g,
    A: /[ÀÁÂÃÄÅĀĂĄ]/g,
    e: /[èééêëēĕėęě]/g,
    E: /[ÈÉĒĔĖĘĚ]/g,
    i: /[ìíîïìĩīĭ]/g,
    I: /[ÌÍÎÏÌĨĪĬ]/g,
    o: /[òóôõöōŏő]/g,
    O: /[OÒÓÔÕÖŌŎŐ]/g,
    u: /[ùúûüũūŭů]/g,
    U: /[ÙUÚÛÜŨŪŬŮ]/g
};

export function normalizeLatin(text) {
    text = text.trim();
    if (!text.length) {
        return text;
    }
    for (var c in latinNormalization) {
        text = text.replace(latinNormalization[c], c);
    }
    return text.toLowerCase();
}

export function splitWords(text) {
    return text.split(/\s+/);
}

export function prepareSearch(query, options = null) {

    const normalization = getParameter(
        options,
        'normalization',
        normalizeLatin
    );

    if (normalization) {
        query = normalization(query);
    }

    const tokenizer = getParameter(
        options,
        'tokenizer',
        splitWords
    );

    const tokens = tokenizer(query);

    return function (text) {
        if (normalization) {
            text = normalization(text);
        }
        for (let token of tokens) {
            if (text.indexOf(token) == -1) {
                return false;
            }
        }
        return true;
    };
}
