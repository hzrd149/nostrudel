import { int } from '../../../customTypings';
/**
 * @author Guenther Grau
 * @author creatale GmbH (christoph.schulz@creatale.de)
 */
export default class PDF417CodewordDecoder {
    private static bSymbolTableReady;
    private static RATIOS_TABLE;
    static initialize(): void;
    static getDecodedValue(moduleBitCount: Int32Array): int;
    private static sampleBitCounts;
    private static getDecodedCodewordValue;
    private static getBitValue;
    private static getClosestDecodedValue;
}
