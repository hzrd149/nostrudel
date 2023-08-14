import { Image } from "@chakra-ui/react";
import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";

export function embedEmoji(content: EmbedableContent, note: NostrEvent | DraftNostrEvent) {
  return embedJSX(content, {
    regexp: /:([a-zA-Z0-9_]+):/gi,
    render: (match) => {
      const emojiTag = note.tags.find(
        (tag) => tag[0] === "emoji" && tag[1].toLowerCase() === match[1].toLowerCase() && tag[2]
      );
      if (emojiTag) {
        return (
          <Image src={emojiTag[2]} height="1.5em" display="inline-block" verticalAlign="middle" title={match[1]} />
        );
      }
      return null;
    },
    name: "emoji",
  });
}
