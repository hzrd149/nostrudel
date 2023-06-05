import { nip19 } from "nostr-tools";
import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import QuoteNote from "../note/quote-note";
import { UserLink } from "../user-link";
import { EventPointer, ProfilePointer } from "nostr-tools/lib/nip19";
import { Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

// nostr:nevent1qqsthg2qlxp9l7egtwa92t8lusm7pjknmjwa75ctrrpcjyulr9754fqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq36amnwvaz7tmwdaehgu3dwp6kytnhv4kxcmmjv3jhytnwv46q2qg5q9
// nostr:nevent1qqsq3wc73lqxd70lg43m5rul57d4mhcanttjat56e30yx5zla48qzlspz9mhxue69uhkummnw3e82efwvdhk6qgdwaehxw309ahx7uewd3hkcq5hsum
export function embedNostrLinks(content: EmbedableContent, event: NostrEvent | DraftNostrEvent) {
  return embedJSX(content, {
    name: "nostr-link",
    regexp: /(nostr:|@)?((npub|note|nprofile|nevent)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/i,
    render: (match) => {
      try {
        const decoded = nip19.decode(match[2]);

        switch (decoded.type) {
          case "npub":
            return <UserLink color="blue.500" pubkey={decoded.data as string} showAt />;
          case "nprofile": {
            const pointer = decoded.data as ProfilePointer;
            return <UserLink color="blue.500" pubkey={pointer.pubkey} showAt />;
          }
          case "note":
            return <QuoteNote noteId={decoded.data as string} />;
          case "nevent": {
            const pointer = decoded.data as EventPointer;
            return <QuoteNote noteId={pointer.id} relay={pointer.relays?.[0]} />;
          }
          default:
            return match[0];
        }
      } catch (e) {
        return match[0];
      }
    },
  });
}

export function embedNostrMentions(content: EmbedableContent, event: NostrEvent | DraftNostrEvent) {
  return embedJSX(content, {
    name: "nostr-mention",
    regexp: /#\[(\d+)\]/,
    render: (match) => {
      const index = parseInt(match[1]);
      const tag = event?.tags[index];

      if (tag) {
        if (tag[0] === "p" && tag[1]) {
          return <UserLink color="blue.500" pubkey={tag[1]} showAt />;
        }
        if (tag[0] === "e" && tag[1]) {
          return <QuoteNote noteId={tag[1]} relay={tag[2]} />;
        }
      }

      return match[0];
    },
  });
}

export function embedNostrHashtags(content: EmbedableContent, event: NostrEvent | DraftNostrEvent) {
  const hashtags = event.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1]?.toLowerCase()) as string[];

  return embedJSX(content, {
    name: "nostr-hashtag",
    regexp: /#([^\[\]\s]+)/i,
    render: (match) => {
      const hashtag = match[1].toLowerCase();
      if (hashtags.includes(hashtag)) {
        return (
          <Link as={RouterLink} to={`/t/${hashtag}`} color="blue.500">
            #{match[1]}
          </Link>
        );
      }
      return match[0];
    },
  });
}
