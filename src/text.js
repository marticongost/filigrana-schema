import { Field } from './field.js';


export class Text extends Field {

    static get type() {
        return 'string';
    }

    static get searchable() {
        return true;
    }
}
