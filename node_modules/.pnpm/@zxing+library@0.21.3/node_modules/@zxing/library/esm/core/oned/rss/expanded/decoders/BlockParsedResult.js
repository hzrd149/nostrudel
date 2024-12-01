var BlockParsedResult = /** @class */ (function () {
    function BlockParsedResult(finished, decodedInformation) {
        if (decodedInformation) {
            this.decodedInformation = null;
        }
        else {
            this.finished = finished;
            this.decodedInformation = decodedInformation;
        }
    }
    BlockParsedResult.prototype.getDecodedInformation = function () {
        return this.decodedInformation;
    };
    BlockParsedResult.prototype.isFinished = function () {
        return this.finished;
    };
    return BlockParsedResult;
}());
export default BlockParsedResult;
