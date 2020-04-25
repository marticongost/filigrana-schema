
import { Field } from "./field";


class Number extends Field {

    static get type() {
        return 'number';
    }
}


export class Integer extends Number {
}


export class Float extends Number {
}
