import { useParams } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import useReplaceableEvent from "../../hooks/use-replaceable-event";
import CommunityHomePage from "./community-home";
import { getPubkeyFromDecodeResult, isHexKey, safeDecode } from "../../helpers/nip19";

function useCommunityPointer() {
  const { community, pubkey } = useParams();

  const decoded = community ? safeDecode(community) : undefined;
  if (decoded) {
    if (decoded.type === "naddr" && decoded.data.kind === kinds.CommunityDefinition) return decoded.data;
  } else if (community && pubkey) {
    const hexPubkey = isHexKey(pubkey) ? pubkey : getPubkeyFromDecodeResult(safeDecode(pubkey));
    if (!hexPubkey) return;

    return { kind: kinds.CommunityDefinition, pubkey: hexPubkey, identifier: community };
  }
}

export default function CommunityView() {
  const pointer = useCommunityPointer();
  const community = useReplaceableEvent(pointer, undefined, { alwaysRequest: true });

  if (!community) return <Spinner />;

  return <CommunityHomePage community={community} />;
}
