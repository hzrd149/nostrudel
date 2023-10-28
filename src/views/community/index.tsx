import { useParams } from "react-router-dom";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { Spinner } from "@chakra-ui/react";
import CommunityHomePage from "./community-home";
import { getPubkey, isHexKey, safeDecode } from "../../helpers/nip19";

function useCommunityPointer() {
  const { community, pubkey } = useParams();

  const decoded = community ? safeDecode(community) : undefined;
  if (decoded) {
    if (decoded.type === "naddr" && decoded.data.kind === COMMUNITY_DEFINITION_KIND) return decoded.data;
  } else if (community && pubkey) {
    const hexPubkey = isHexKey(pubkey) ? pubkey : getPubkey(safeDecode(pubkey));
    if (!hexPubkey) return;

    return { kind: COMMUNITY_DEFINITION_KIND, pubkey: hexPubkey, identifier: community };
  }
}

export default function CommunityView() {
  const pointer = useCommunityPointer();
  const community = useReplaceableEvent(pointer, [], { alwaysRequest: true });

  if (!community) return <Spinner />;

  return <CommunityHomePage community={community} />;
}
