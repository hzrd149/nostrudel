import { useState } from "react";
import { IconButton, useToast } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { RepostIcon } from "../../icons";
import { buildRepost } from "../../../helpers/nostr-event";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { nostrPostAction } from "../../../classes/nostr-post-action";
import clientRelaysService from "../../../services/client-relays";
import signingService from "../../../services/signing";

export function RepostButton({ event }: { event: NostrEvent }) {
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    try {
      setLoading(true);
      const draftRepost = buildRepost(event);
      const repost = await signingService.requestSignature(draftRepost, account);
      await nostrPostAction(clientRelaysService.getWriteUrls(), repost);
    } catch (e) {
      if (e instanceof Error) {
        toast({ status: "error", description: e.message });
      }
    }
    setLoading(false);
  };

  return (
    <IconButton
      icon={<RepostIcon />}
      onClick={handleClick}
      aria-label="Repost Note"
      title="Repost Note"
      isDisabled={account.readonly}
      isLoading={loading}
    />
  );
}
