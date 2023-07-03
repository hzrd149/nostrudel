import { useMemo } from "react";
import { EmbedableContent, embedUrls } from "../../../../helpers/embeds";
import {
  embedEmoji,
  embedNostrHashtags,
  embedNostrLinks,
  embedNostrMentions,
  renderGenericUrl,
  renderImageUrl,
} from "../../../../components/embed-types";
import EmbeddedContent from "../../../../components/embeded-content";
import { NostrEvent } from "../../../../types/nostr-event";

export default function ChatMessageContent({ event }: { event: NostrEvent }) {
  const content = useMemo(() => {
    let c: EmbedableContent = [event.content];

    c = embedUrls(c, [renderImageUrl, renderGenericUrl]);

    // nostr
    c = embedNostrLinks(c);
    c = embedNostrMentions(c, event);
    c = embedNostrHashtags(c, event);
    c = embedEmoji(c, event);

    return c;
  }, [event.content]);

  return <EmbeddedContent content={content} />;
}
