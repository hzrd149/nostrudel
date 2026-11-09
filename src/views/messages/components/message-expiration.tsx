import { TimeIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";
import { getRumorGiftWraps, type Rumor } from "applesauce-common/helpers";
import { getExpirationTimestamp } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { kinds, type NostrEvent } from "nostr-tools";
import { readMessageExpiration } from "../../../helpers/nostr/message-expiration";

export default function MessageExpiration({ message }: { message: NostrEvent | Rumor }) {
  const wrapped = message.kind === kinds.PrivateDirectMessage || message.kind === kinds.FileMessage;
  const expiration =
    getExpirationTimestamp(message) ??
    (wrapped
      ? getRumorGiftWraps(message)
          .map(getExpirationTimestamp)
          .find((value) => value !== undefined)
      : undefined);
  const hasTag = message.tags.some((tag) => tag[0] === "expiration");
  if (expiration === undefined && !hasTag) return null;
  const timestamp = readMessageExpiration(message);
  const label =
    timestamp === undefined ? "Invalid message expiration" : `Disappears ${dayjs.unix(timestamp).fromNow()}`;
  return (
    <Tooltip label={label}>
      <TimeIcon aria-label={label} color="GrayText" flexShrink={0} alignSelf="center" tabIndex={0} />
    </Tooltip>
  );
}
