import { AuthClient, AuthHeader } from "./types";
export declare class OAuth2Bearer implements AuthClient {
    private bearer_token;
    constructor(bearer_token: string);
    getAuthHeader(): AuthHeader;
}
