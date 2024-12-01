import { IToken } from './Parser';
export declare class TokenError extends Error {
    message: string;
    token: IToken;
    constructor(message: string, token: IToken);
    inspect(): string;
}
