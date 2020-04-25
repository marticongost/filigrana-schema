
/**
 * Obtains the value of a "keyword" parameter (a parameter passed in as the key
 * of a parameters object).
 *
 * @param {?Object} parameters - An object containing parameters
 *
 * @param {string} parameterName - The name of the parameter to look for
 *
 * @param {?} defaultValue - A value that will be returned if either no
 *      parameters have been supplied or if the requested parameter is
 *      undefined.
 *
 * @returns {?} The value for the requested parameter.
 */
export function getParameter(parameters, parameterName, defaultValue = null) {
    const value = parameters ? parameters[parameterName] : undefined;
    return value === undefined ? defaultValue : value;
}


/**
 * An exception used to mark methods that should be overriden on derived
 * classes.
 */
export class NotImplementedError extends Error {

    constructor(cls, methodName) {
        super(`${cls.name} doesn't implement the ${methodName} method`);
    }
}