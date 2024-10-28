import { EmbedableContent, embedJSX } from "../../../helpers/embeds";
import { DraftNostrEvent, NostrEvent, isEmojiTag } from "../../../types/nostr-event";
import { getMatchEmoji } from "../../../helpers/regexp";
import { InlineEmoji } from "../components/ininle-emoji";
import { getEmojiTag } from "applesauce-core/helpers";

export function embedEmoji(content: EmbedableContent, note: NostrEvent | DraftNostrEvent) {
  return embedJSX(content, {
    regexp: getMatchEmoji(),
    render: (match) => {
      const tag = getEmojiTag(note, match[1]);

      if (tag) return <InlineEmoji url={tag[2]!} code={match[1]} />;
      return null;
    },
    name: "emoji",
  });
}
