import Subject from "../classes/subject";
import { SuperMap } from "../classes/super-map";
import { getEmojisFromPack } from "../helpers/nostr/emoji-packs";
import { NostrEvent } from "../types/nostr-event";
import replaceableEventLoaderService from "./replaceable-event-requester";

const EMOJI_PACK_KIND = 30030;
const USER_EMOJI_LIST_KIND = 10030;

class EmojiPacksService {
  emojiPacks = new SuperMap(
    () => new Subject<{ event: NostrEvent; name: string; emojis: { name: string; url: string }[] }>(),
  );
  userEmojiPacks = new SuperMap(() => new Subject<{ packs: string[]; event: NostrEvent }>());

  getEmojiPacks(pubkey: string) {
    return this.emojiPacks.get(pubkey);
  }

  requestEmojiPack(addr: string, relays: string[]) {
    const [kind, pubkey, name] = addr.split(":");
    const sub = this.emojiPacks.get(addr);

    if (!sub.value) {
      const request = replaceableEventLoaderService.requestEvent(relays, EMOJI_PACK_KIND, pubkey, name);
      sub.connectWithHandler(request, (event, next) => {
        const name = event.tags.find((t) => t[0] === "d" && t[1])?.[1];
        if (!name) return;

        next({
          name,
          emojis: getEmojisFromPack(event),
          event,
        });
      });
    }

    return sub;
  }

  requestUserEmojiList(pubkey: string, relays: string[], alwaysFetch = false) {
    const sub = this.userEmojiPacks.get(pubkey);
    const request = replaceableEventLoaderService.requestEvent(
      relays,
      USER_EMOJI_LIST_KIND,
      pubkey,
      undefined,
      alwaysFetch,
    );

    if (!sub.value) {
      sub.connectWithHandler(request, (event, next) => {
        next({
          packs: event.tags.filter((t) => t[0] === "a" && t[1]).map((t) => t[1] as string),
          event,
        });
      });
    }

    return sub;
  }
}

const emojiPacksService = new EmojiPacksService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.emojiPacksService = emojiPacksService;
}

export default emojiPacksService;
