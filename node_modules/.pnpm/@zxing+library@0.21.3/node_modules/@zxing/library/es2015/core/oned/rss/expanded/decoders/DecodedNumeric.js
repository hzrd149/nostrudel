import FormatException from '../../../../FormatException';
import DecodedObject from './DecodedObject';
export default class DecodedNumeric extends DecodedObject {
    constructor(newPosition, firstDigit, secondDigit) {
        super(newPosition);
        if (firstDigit < 0 || firstDigit > 10 || secondDigit < 0 || secondDigit > 10) {
            throw new FormatException();
        }
        this.firstDigit = firstDigit;
        this.secondDigit = secondDigit;
    }
    getFirstDigit() {
        return this.firstDigit;
    }
    getSecondDigit() {
        return this.secondDigit;
    }
    getValue() {
        return this.firstDigit * 10 + this.secondDigit;
    }
    isFirstDigitFNC1() {
        return this.firstDigit === DecodedNumeric.FNC1;
    }
    isSecondDigitFNC1() {
        return this.secondDigit === DecodedNumeric.FNC1;
    }
    isAnyFNC1() {
        return this.firstDigit === DecodedNumeric.FNC1 || this.secondDigit === DecodedNumeric.FNC1;
    }
}
DecodedNumeric.FNC1 = 10;
