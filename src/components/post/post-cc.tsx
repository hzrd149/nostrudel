import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { NostrEvent } from "../../types/nostr-event";

const CC = ({ pubkey }: { pubkey: string }) => {
  const { metadata } = useUserMetadata(pubkey);

  return (
    <Link
      as={RouterLink}
      to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}
    >
      {getUserDisplayName(metadata, pubkey)}
    </Link>
  );
};

export const PostCC = ({ event }: { event: NostrEvent }) => {
  const hasCC = event.tags.some((t) => t[0] === "p");
  if (!hasCC) return null;

  return (
    <Text fontSize="sm" color="gray.500">
      <span>Replying to: </span>
      {event.tags
        .filter((t) => t[0] === "p")
        .map((t) => t[1] && <CC pubkey={t[1]} />)
        .reduce((arr, el, i, original) => {
          if (i !== original.length - 1) {
            return arr.concat([el, ", "]);
          }
          return arr.concat(el);
        }, [] as any[])}
    </Text>
  );
};
