import DecodedObject from './DecodedObject';
export default class DecodedInformation extends DecodedObject {
    constructor(newPosition, newString, remainingValue) {
        super(newPosition);
        if (remainingValue) {
            this.remaining = true;
            this.remainingValue = this.remainingValue;
        }
        else {
            this.remaining = false;
            this.remainingValue = 0;
        }
        this.newString = newString;
    }
    getNewString() {
        return this.newString;
    }
    isRemaining() {
        return this.remaining;
    }
    getRemainingValue() {
        return this.remainingValue;
    }
}
