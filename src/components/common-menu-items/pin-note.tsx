import { useCallback, useState } from "react";
import { MenuItem, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";

import useCurrentAccount from "../../hooks/use-current-account";
import { useSigningContext } from "../../providers/signing-provider";
import useUserPinList from "../../hooks/use-user-pin-list";
import { DraftNostrEvent, NostrEvent, isETag } from "../../types/nostr-event";
import { PIN_LIST_KIND, listAddEvent, listRemoveEvent } from "../../helpers/nostr/lists";
import clientRelaysService from "../../services/client-relays";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { PinIcon } from "../icons";

export default function PinNoteMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const { list } = useUserPinList(account?.pubkey);

  const isPinned = list?.tags.some((t) => isETag(t) && t[1] === event.id) ?? false;
  const label = isPinned ? "Unpin Note" : "Pin Note";

  const [loading, setLoading] = useState(false);
  const togglePin = useCallback(async () => {
    try {
      setLoading(true);
      let draft: DraftNostrEvent = {
        kind: PIN_LIST_KIND,
        created_at: dayjs().unix(),
        content: list?.content ?? "",
        tags: list?.tags ? Array.from(list.tags) : [],
      };

      if (isPinned) draft = listRemoveEvent(draft, event.id);
      else draft = listAddEvent(draft, event.id);

      const signed = await requestSignature(draft);
      new NostrPublishAction(label, clientRelaysService.getWriteUrls(), signed);
      setLoading(false);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  }, [list, isPinned]);

  if (event.pubkey !== account?.pubkey) return null;

  return (
    <MenuItem onClick={togglePin} icon={<PinIcon />} isDisabled={loading || !account?.readonly}>
      {label}
    </MenuItem>
  );
}
