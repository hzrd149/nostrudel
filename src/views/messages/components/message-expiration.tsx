import { TimeIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";
import { getRumorGiftWraps, type Rumor } from "applesauce-common/helpers";
import { getExpirationTimestamp } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { kinds, type NostrEvent } from "nostr-tools";

export default function MessageExpiration({ message }: { message: NostrEvent | Rumor }) {
  const wrapped = message.kind === kinds.PrivateDirectMessage || message.kind === kinds.FileMessage;
  const expiration =
    getExpirationTimestamp(message) ??
    (wrapped
      ? getRumorGiftWraps(message)
          .map(getExpirationTimestamp)
          .find((value) => value !== undefined)
      : undefined);
  if (!expiration) return null;
  const label = `Disappears ${dayjs.unix(expiration).fromNow()}`;
  return (
    <Tooltip label={label}>
      <TimeIcon aria-label={label} color="GrayText" flexShrink={0} alignSelf="center" tabIndex={0} />
    </Tooltip>
  );
}
