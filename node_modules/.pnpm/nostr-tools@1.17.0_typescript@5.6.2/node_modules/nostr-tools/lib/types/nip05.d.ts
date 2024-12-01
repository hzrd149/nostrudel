import { ProfilePointer } from './nip19.ts';
/**
 * NIP-05 regex. The localpart is optional, and should be assumed to be `_` otherwise.
 *
 * - 0: full match
 * - 1: name (optional)
 * - 2: domain
 */
export declare const NIP05_REGEX: RegExp;
export declare function useFetchImplementation(fetchImplementation: any): void;
export declare function searchDomain(domain: string, query?: string): Promise<{
    [name: string]: string;
}>;
export declare function queryProfile(fullname: string): Promise<ProfilePointer | null>;
/** nostr.json result. */
export interface NIP05Result {
    names: {
        [name: string]: string;
    };
    relays?: {
        [pubkey: string]: string[];
    };
}
