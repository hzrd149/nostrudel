export default class DataCharacter {
    constructor(value, checksumPortion) {
        this.value = value;
        this.checksumPortion = checksumPortion;
    }
    getValue() {
        return this.value;
    }
    getChecksumPortion() {
        return this.checksumPortion;
    }
    toString() {
        return this.value + '(' + this.checksumPortion + ')';
    }
    equals(o) {
        if (!(o instanceof DataCharacter)) {
            return false;
        }
        const that = o;
        return this.value === that.value && this.checksumPortion === that.checksumPortion;
    }
    hashCode() {
        return this.value ^ this.checksumPortion;
    }
}
