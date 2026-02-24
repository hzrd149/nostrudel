import { MenuItem } from "@chakra-ui/react";
import { PinNote, UnpinNote } from "applesauce-actions/actions";
import { useActionRunner, useActiveAccount, useEventFactory, useEventStore } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";

import { isEventInList } from "../../helpers/nostr/lists";
import useAsyncAction from "../../hooks/use-async-action";
import useUserPinList from "../../hooks/use-user-pin-list";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { PinIcon } from "../icons";

export default function PinEventMenuItem({ event }: { event: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const factory = useEventFactory();
  const actions = useActionRunner();
  const eventStore = useEventStore();
  const { list } = useUserPinList(account?.pubkey);

  const isPinned = !!list && isEventInList(list, event);

  let type = "Note";
  switch (event.kind) {
    case kinds.LongFormArticle:
      type = "Article";
      break;
  }
  const label = isPinned ? `Unpin ${type}` : `Pin ${type}`;

  const toggle = useAsyncAction(async () => {
    if (!account) return;
    // v5: PinNote creates the list automatically if it doesn't exist
    if (isPinned) await actions.exec(UnpinNote, event).forEach((e) => publish(label, e));
    else await actions.exec(PinNote, event).forEach((e) => publish(label, e));
  }, [isPinned, factory, account, label]);

  if (event.pubkey !== account?.pubkey) return null;

  return (
    <MenuItem onClick={toggle.run} icon={<PinIcon />} isDisabled={toggle.loading}>
      {label}
    </MenuItem>
  );
}
