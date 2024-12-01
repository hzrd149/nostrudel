export * from './headless.js';
import { type Nostr } from './api/nostr.js';
export declare const initNostrWasm: () => Promise<Nostr>;
