import { truncatedId } from "../helpers/nostr-event";
import { TimelineLoader } from "./timeline-loader";

export default class UserTimeline extends TimelineLoader {
  constructor(pubkey: string) {
    super([], { authors: [pubkey], kinds: [1, 6] }, truncatedId(pubkey) + "-timeline");
  }
}
