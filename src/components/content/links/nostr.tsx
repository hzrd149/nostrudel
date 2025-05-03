import { nip19 } from "nostr-tools";
import ExpandableEmbed from "../components/expandable-embed";
import { EmbedEventNostrLink } from "../../embed-event";

export function renderNostrAppWebLink(url: URL) {
  const match = url.pathname.match(/\/((?:naddr1|nevent1|note1)[a-z\d]+$)/i);
  if (!match) return null;

  try {
    // ensure it can be decoded
    nip19.decode(match[1]);

    return (
      <ExpandableEmbed label={`${url.hostname} nostr link`} url={url} card>
        <EmbedEventNostrLink link={match[1]} />
      </ExpandableEmbed>
    );
  } catch (error) {
    return null;
  }
}
