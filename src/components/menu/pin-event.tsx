import { MenuItem } from "@chakra-ui/react";
import { UnpinNote } from "applesauce-actions/actions";
import { PinListFactory } from "applesauce-common/factories";
import { getEventPointerForEvent } from "applesauce-core/helpers";
import { useActionRunner, useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";

import { isEventInList } from "../../helpers/nostr/lists";
import useAsyncAction from "../../hooks/use-async-action";
import useUserPinList from "../../hooks/use-user-pin-list";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { getEventRelayHints } from "../../services/relay-hints";
import { PinIcon } from "../icons";

export default function PinEventMenuItem({ event }: { event: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const actions = useActionRunner();
  const { list } = useUserPinList(account?.pubkey);

  const isPinned = !!list && isEventInList(list, event);

  const label = isPinned ? "Unpin Note" : "Pin Note";

  const toggle = useAsyncAction(async () => {
    if (!account) return;

    if (isPinned) await actions.exec(UnpinNote, event).forEach((e) => publish(label, e));
    else {
      const pointer = getEventPointerForEvent(event, getEventRelayHints(event, 1));
      const draft = await (list ? PinListFactory.modify(list) : PinListFactory.create()).addEventItem(pointer);
      await publish(label, draft);
    }
  }, [isPinned, account, actions, event, publish, label, list]);

  if (event.kind !== kinds.ShortTextNote) return null;

  return (
    <MenuItem onClick={toggle.run} icon={<PinIcon />} isDisabled={toggle.loading}>
      {label}
    </MenuItem>
  );
}
