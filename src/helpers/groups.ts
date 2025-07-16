import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export type GroupInfo = {
  name: string;
  about?: string;
  picture?: string;
  public: boolean;
  open: boolean;
  event: NostrEvent;
};

export function parseGroupInfo(event: NostrEvent): GroupInfo {
  return {
    name: getTagValue(event, "name") ?? event.id,
    about: getTagValue(event, "about"),
    picture: getTagValue(event, "picture"),
    public: event.tags.some((tag) => tag[0] === "public"),
    open: event.tags.some((tag) => tag[0] === "open"),
    event,
  };
}
