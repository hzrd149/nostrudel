import NostrPublishAction from "../classes/nostr-publish-action";
import { createEmptyMuteList, draftAddPerson, draftRemovePerson, isPubkeyInList } from "../helpers/nostr/lists";
import { useSigningContext } from "../providers/signing-provider";
import clientRelaysService from "../services/client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useAsyncErrorHandler from "./use-async-error-handler";
import { useCurrentAccount } from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";

export default function useUserMuteFunctions(pubkey: string) {
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const muteList = useUserMuteList(account?.pubkey, [], true);

  const isMuted = isPubkeyInList(muteList, pubkey);

  const mute = useAsyncErrorHandler(async () => {
    const draft = draftAddPerson(muteList || createEmptyMuteList(), pubkey);
    const signed = await requestSignature(draft);
    new NostrPublishAction("Mute", clientRelaysService.getWriteUrls(), signed);
    replaceableEventLoaderService.handleEvent(signed);
  }, [requestSignature, muteList]);
  const unmute = useAsyncErrorHandler(async () => {
    const draft = draftRemovePerson(muteList || createEmptyMuteList(), pubkey);
    const signed = await requestSignature(draft);
    new NostrPublishAction("Unmute", clientRelaysService.getWriteUrls(), signed);
    replaceableEventLoaderService.handleEvent(signed);
  }, [requestSignature, muteList]);

  return { isMuted, mute, unmute };
}
