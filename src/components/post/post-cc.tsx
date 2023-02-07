import { Text } from "@chakra-ui/react";
import { isPTag, NostrEvent } from "../../types/nostr-event";
import { UserLink } from "../user-link";

export const PostCC = ({ event }: { event: NostrEvent }) => {
  const hasCC = event.tags.some(isPTag);
  if (!hasCC) return null;

  return (
    <Text fontSize="sm" color="gray.500">
      <span>Replying to: </span>
      {event.tags
        .filter(isPTag)
        .map((t) => t[1] && <UserLink key={t[1]} pubkey={t[1]} />)
        .reduce((arr, el, i, original) => {
          if (i !== original.length - 1) {
            return arr.concat([el, ", "]);
          }
          return arr.concat(el);
        }, [] as any[])}
    </Text>
  );
};
