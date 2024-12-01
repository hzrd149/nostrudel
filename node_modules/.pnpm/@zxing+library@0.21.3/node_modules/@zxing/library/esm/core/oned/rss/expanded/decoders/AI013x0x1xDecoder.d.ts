import AI01weightDecoder from './AI01weightDecoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
export default class AI013x0x1xDecoder extends AI01weightDecoder {
    private static readonly HEADER_SIZE;
    private static readonly WEIGHT_SIZE;
    private static readonly DATE_SIZE;
    private readonly dateCode;
    private readonly firstAIdigits;
    constructor(information: BitArray, firstAIdigits: string, dateCode: string);
    parseInformation(): string;
    private encodeCompressedDate;
    protected addWeightCode(buf: StringBuilder, weight: number): void;
    protected checkWeight(weight: number): number;
}
