import { truncatedId } from "../helpers/nostr/events";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../helpers/nostr/lists";
import { useReadRelayUrls } from "./use-client-relays";
import { useCurrentAccount } from "./use-current-account";
import useSubject from "./use-subject";
import useTimelineLoader from "./use-timeline-loader";

export default function useUserLists(pubkey: string, additionalRelays: string[] = []) {
  const account = useCurrentAccount();
  if (!account) throw new Error("No Account");

  const readRelays = useReadRelayUrls(additionalRelays);
  const timeline = useTimelineLoader(truncatedId(account.pubkey) + "-lists", readRelays, {
    authors: [account.pubkey],
    kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
  });

  return useSubject(timeline.timeline);
}
