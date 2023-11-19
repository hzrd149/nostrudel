import { Image } from "@chakra-ui/react";
import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { DraftNostrEvent, NostrEvent, isEmojiTag } from "../../types/nostr-event";
import { getMatchEmoji } from "../../helpers/regexp";

export function embedEmoji(content: EmbedableContent, note: NostrEvent | DraftNostrEvent) {
  return embedJSX(content, {
    regexp: getMatchEmoji(),
    render: (match) => {
      const emojiTag = note.tags.filter(isEmojiTag).find((t) => t[1].toLowerCase() === match[1].toLowerCase());
      if (emojiTag) {
        return (
          <Image
            src={emojiTag[2]}
            h="1.5em"
            maxW="3em"
            display="inline-block"
            verticalAlign="middle"
            title={match[1]}
          />
        );
      }
      return null;
    },
    name: "emoji",
  });
}
