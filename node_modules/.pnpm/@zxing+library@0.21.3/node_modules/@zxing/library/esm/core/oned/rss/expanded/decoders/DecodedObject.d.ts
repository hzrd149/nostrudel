export default abstract class DecodedObject {
    private readonly newPosition;
    constructor(newPosition: number);
    getNewPosition(): number;
}
