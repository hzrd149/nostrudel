import DecodedObject from './DecodedObject';
export default class DecodedChar extends DecodedObject {
    constructor(newPosition, value) {
        super(newPosition);
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    isFNC1() {
        return this.value === DecodedChar.FNC1;
    }
}
DecodedChar.FNC1 = '$';
