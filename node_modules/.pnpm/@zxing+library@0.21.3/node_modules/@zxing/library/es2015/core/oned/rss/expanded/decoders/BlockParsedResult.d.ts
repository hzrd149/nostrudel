import DecodedInformation from './DecodedInformation';
export default class BlockParsedResult {
    private readonly decodedInformation;
    private readonly finished;
    constructor(finished: boolean, decodedInformation?: DecodedInformation);
    getDecodedInformation(): DecodedInformation;
    isFinished(): boolean;
}
