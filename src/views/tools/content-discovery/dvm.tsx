import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Flex, useToast } from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { nip19 } from "nostr-tools";
import dayjs from "dayjs";

import { useNavigate, useParams } from "react-router-dom";
import { isHexKey } from "../../../helpers/nip19";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { DMV_CONTENT_DISCOVERY_JOB_KIND, DMV_CONTENT_DISCOVERY_RESULT_KIND } from "../../../helpers/nostr/dvm";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useSubject from "../../../hooks/use-subject";
import useCurrentAccount from "../../../hooks/use-current-account";
import RequireCurrentAccount from "../../../providers/require-current-account";
import { DraftNostrEvent, NostrEvent, Tag, isETag } from "../../../types/nostr-event";
import GenericNoteTimeline from "../../../components/timeline-page/generic-note-timeline";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import { useUserRelays } from "../../../hooks/use-user-relays";

function getResultEvents(result: NostrEvent) {
  const parsed = JSON.parse(result.content);
  if (!Array.isArray(parsed)) return [];
  const tags = parsed as Tag[];
  return tags.filter(isETag).map((t) => t[1]);
}

function useDVMPointer() {
  const { pubkey } = useParams() as { pubkey: string };
  if (isHexKey(pubkey)) return pubkey;

  const pointer = nip19.decode(pubkey);
  switch (pointer.type) {
    case "npub":
      return pointer.data as string;
    case "nprofile":
      const d = pointer.data as nip19.ProfilePointer;
      return d.pubkey;
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

function ResultEvents({ result }: { result: NostrEvent }) {
  const readRelays = useReadRelayUrls();
  const ids = useMemo(() => getResultEvents(result), [result]);

  const customSort = useCallback(
    (a: NostrEvent, b: NostrEvent) => {
      return ids.indexOf(a.id) - ids.indexOf(b.id);
    },
    [ids],
  );

  const timeline = useTimelineLoader(`${result.id}-events`, readRelays, { ids }, { customSort });

  return <GenericNoteTimeline timeline={timeline} />;
}

function ContentDiscoveryDVMPage() {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const navigate = useNavigate();
  const pubkey = useDVMPointer();
  const [selected, setSelected] = useState("");

  const dvmRelays = useUserRelays(pubkey).map((r) => r.url);
  const readRelays = useReadRelayUrls(dvmRelays);
  const timeline = useTimelineLoader(`${pubkey}-dvm-results`, readRelays, {
    authors: [pubkey],
    "#p": [account.pubkey],
    kinds: [DMV_CONTENT_DISCOVERY_RESULT_KIND],
  });

  const results = useSubject(timeline.timeline);

  const [requesting, setRequesting] = useState(false);
  const requestNew = async () => {
    try {
      setRequesting(true);
      const draft: DraftNostrEvent = {
        kind: DMV_CONTENT_DISCOVERY_JOB_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [
          ["p", pubkey],
          ["relays", ...readRelays],
          ["output", "text/plain"],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Content Discovery", clientRelaysService.getWriteUrls(), signed);
      setSelected("");
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  useEffect(() => {
    setRequesting(false);
  }, [results.length]);

  const selectedResult = results.find((r) => r.id === selected);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={requestNew} isLoading={requesting} colorScheme="primary">
          Request New
        </Button>
      </Flex>
      {selectedResult ? (
        <ResultEvents result={selectedResult} />
      ) : (
        results.map((result) => (
          <Button key={result.id} onClick={() => setSelected(result.id)}>
            Result from {dayjs.unix(result.created_at).fromNow()}
          </Button>
        ))
      )}
    </VerticalPageLayout>
  );
}

export default function ContentDiscoveryDVMView() {
  return (
    <RequireCurrentAccount>
      <ContentDiscoveryDVMPage />
    </RequireCurrentAccount>
  );
}
