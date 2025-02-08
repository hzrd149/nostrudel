import { useCallback, useState } from "react";
import { MenuItem } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { removeEventTag, addEventTag } from "applesauce-factory/operations/list/index";

import useUserPinList from "../../hooks/use-user-pin-list";
import { NostrEvent } from "../../types/nostr-event";
import { isEventInList } from "../../helpers/nostr/lists";
import { PinIcon } from "../icons";
import { usePublishEvent } from "../../providers/global/publish-provider";

export default function PinEventMenuItem({ event }: { event: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const factory = useEventFactory();
  const { list } = useUserPinList(account?.pubkey);

  const isPinned = isEventInList(list, event);

  let type = "Note";
  switch (event.kind) {
    case kinds.LongFormArticle:
      type = "Article";
      break;
  }
  const label = isPinned ? `Unpin ${type}` : `Pin ${type}`;

  const [loading, setLoading] = useState(false);
  const togglePin = useCallback(async () => {
    setLoading(true);

    const draft = await factory.modifyList(
      list || { kind: kinds.Pinlist },
      isPinned ? removeEventTag(event.id) : addEventTag(event.id),
    );

    await publish(label, draft);
    setLoading(false);
  }, [list, isPinned, factory]);

  if (event.pubkey !== account?.pubkey) return null;

  return (
    <MenuItem onClick={togglePin} icon={<PinIcon />} isDisabled={loading}>
      {label}
    </MenuItem>
  );
}
