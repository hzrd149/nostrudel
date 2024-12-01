export default class FieldParser {
    private static readonly VARIABLE_LENGTH;
    private static readonly TWO_DIGIT_DATA_LENGTH;
    private static readonly THREE_DIGIT_DATA_LENGTH;
    private static readonly THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH;
    private static readonly FOUR_DIGIT_DATA_LENGTH;
    constructor();
    static parseFieldsInGeneralPurpose(rawInformation: string): string;
    private static processFixedAI;
    private static processVariableAI;
}
