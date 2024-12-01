import type { Event } from './event.ts';
export type Parameters = {
    pubkey: string;
    kind?: number;
    until?: number;
    since?: number;
};
export type Delegation = {
    from: string;
    to: string;
    cond: string;
    sig: string;
};
export declare function createDelegation(privateKey: string, parameters: Parameters): Delegation;
export declare function getDelegator(event: Event<number>): string | null;
