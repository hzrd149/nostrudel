export default class BlockParsedResult {
    constructor(finished, decodedInformation) {
        if (decodedInformation) {
            this.decodedInformation = null;
        }
        else {
            this.finished = finished;
            this.decodedInformation = decodedInformation;
        }
    }
    getDecodedInformation() {
        return this.decodedInformation;
    }
    isFinished() {
        return this.finished;
    }
}
