/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
export default class ECBlocks {
    constructor(ecCodewordsPerBlock /*int*/, ...ecBlocks) {
        this.ecCodewordsPerBlock = ecCodewordsPerBlock;
        this.ecBlocks = ecBlocks;
    }
    getECCodewordsPerBlock() {
        return this.ecCodewordsPerBlock;
    }
    getNumBlocks() {
        let total = 0;
        const ecBlocks = this.ecBlocks;
        for (const ecBlock of ecBlocks) {
            total += ecBlock.getCount();
        }
        return total;
    }
    getTotalECCodewords() {
        return this.ecCodewordsPerBlock * this.getNumBlocks();
    }
    getECBlocks() {
        return this.ecBlocks;
    }
}
