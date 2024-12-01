import BitArray from '../../../common/BitArray';
var BitArrayBuilder = /** @class */ (function () {
    function BitArrayBuilder() {
    }
    BitArrayBuilder.buildBitArray = function (pairs) {
        var charNumber = pairs.length * 2 - 1;
        if (pairs[pairs.length - 1].getRightChar() == null) {
            charNumber -= 1;
        }
        var size = 12 * charNumber;
        var binary = new BitArray(size);
        var accPos = 0;
        var firstPair = pairs[0];
        var firstValue = firstPair.getRightChar().getValue();
        for (var i = 11; i >= 0; --i) {
            if ((firstValue & (1 << i)) !== 0) {
                binary.set(accPos);
            }
            accPos++;
        }
        for (var i = 1; i < pairs.length; ++i) {
            var currentPair = pairs[i];
            var leftValue = currentPair.getLeftChar().getValue();
            for (var j = 11; j >= 0; --j) {
                if ((leftValue & (1 << j)) !== 0) {
                    binary.set(accPos);
                }
                accPos++;
            }
            if (currentPair.getRightChar() !== null) {
                var rightValue = currentPair.getRightChar().getValue();
                for (var j = 11; j >= 0; --j) {
                    if ((rightValue & (1 << j)) !== 0) {
                        binary.set(accPos);
                    }
                    accPos++;
                }
            }
        }
        return binary;
    };
    return BitArrayBuilder;
}());
export default BitArrayBuilder;
