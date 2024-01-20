import NostrPublishAction from "../classes/nostr-publish-action";
import { isPubkeyInList } from "../helpers/nostr/lists";
import {
  createEmptyMuteList,
  getPubkeyExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { useSigningContext } from "../providers/global/signing-provider";
import clientRelaysService from "../services/client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useAsyncErrorHandler from "./use-async-error-handler";
import useCurrentAccount from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";

export default function useUserMuteActions(pubkey: string) {
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const muteList = useUserMuteList(account?.pubkey, [], { ignoreCache: true });

  const isMuted = isPubkeyInList(muteList, pubkey);
  const expiration = muteList ? getPubkeyExpiration(muteList, pubkey) : 0;

  const mute = useAsyncErrorHandler(async () => {
    let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);

    const signed = await requestSignature(draft);
    new NostrPublishAction("Mute", clientRelaysService.outbox.urls, signed);
    replaceableEventLoaderService.handleEvent(signed);
  }, [requestSignature, muteList]);
  const unmute = useAsyncErrorHandler(async () => {
    let draft = muteListRemovePubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);

    const signed = await requestSignature(draft);
    new NostrPublishAction("Unmute", clientRelaysService.outbox.urls, signed);
    replaceableEventLoaderService.handleEvent(signed);
  }, [requestSignature, muteList]);

  return { isMuted, expiration, mute, unmute };
}
