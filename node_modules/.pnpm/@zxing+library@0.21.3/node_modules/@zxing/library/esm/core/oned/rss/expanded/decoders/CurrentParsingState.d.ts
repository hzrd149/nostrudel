export default class CurrentParsingState {
    private position;
    private encoding;
    constructor();
    getPosition(): number;
    setPosition(position: number): void;
    incrementPosition(delta: number): void;
    isAlpha(): boolean;
    isNumeric(): boolean;
    isIsoIec646(): boolean;
    setNumeric(): void;
    setAlpha(): void;
    setIsoIec646(): void;
}
