import { Event, Kind } from './event.ts';
import type { EventPointer } from './nip19.ts';
export type ReactionEventTemplate = {
    /**
     * Pass only non-nip25 tags if you have to. Nip25 tags ('e' and 'p' tags from reacted event) will be added automatically.
     */
    tags?: string[][];
    /**
     * @default '+'
     */
    content?: string;
    created_at: number;
};
export declare function finishReactionEvent(t: ReactionEventTemplate, reacted: Event<number>, privateKey: string): Event<Kind.Reaction>;
export declare function getReactedEventPointer(event: Event<number>): undefined | EventPointer;
