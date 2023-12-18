import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { nip19 } from "nostr-tools";
import dayjs from "dayjs";

import {
  DMV_CONTENT_DISCOVERY_JOB_KIND,
  DMV_CONTENT_DISCOVERY_RESULT_KIND,
  DMV_STATUS_KIND,
  flattenJobChain,
  chainJobs,
  groupEventsIntoJobs,
} from "../../helpers/nostr/dvm";
import { DraftNostrEvent } from "../../types/nostr-event";
import NostrPublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useSubject from "../../hooks/use-subject";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useUserRelays } from "../../hooks/use-user-relays";
import { useNavigate, useParams } from "react-router-dom";
import { useSigningContext } from "../../providers/signing-provider";
import useCurrentAccount from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/require-current-account";
import { CodeIcon } from "../../components/icons";
import { unique } from "../../helpers/array";
import DebugChains from "./components/debug-chains";
import Feed from "./components/feed";
import { parseCoordinate } from "../../helpers/nostr/events";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

function DVMFeedPage({ pointer }: { pointer: AddressPointer }) {
  const [since] = useState(() => dayjs().subtract(1, "hour").unix());
  const toast = useToast();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const debugModal = useDisclosure();

  const dvmRelays = useUserRelays(pointer.pubkey).map((r) => r.url);
  const readRelays = useReadRelayUrls(dvmRelays);
  const timeline = useTimelineLoader(`${pointer.kind}:${pointer.pubkey}:${pointer.identifier}-jobs`, readRelays, [
    { authors: [account.pubkey], "#p": [pointer.pubkey], kinds: [DMV_CONTENT_DISCOVERY_JOB_KIND], since },
    {
      authors: [pointer.pubkey],
      "#p": [account.pubkey],
      kinds: [DMV_CONTENT_DISCOVERY_RESULT_KIND, DMV_STATUS_KIND],
      since,
    },
  ]);

  const events = useSubject(timeline.timeline);
  const jobs = groupEventsIntoJobs(events);
  const pages = chainJobs(Array.from(Object.values(jobs)));
  const jobChains = flattenJobChain(pages);

  const { requestSignature } = useSigningContext();
  const [requesting, setRequesting] = useState(false);
  const requestNewFeed = async () => {
    try {
      setRequesting(true);
      const draft: DraftNostrEvent = {
        kind: DMV_CONTENT_DISCOVERY_JOB_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [
          ["p", pointer.pubkey],
          ["relays", ...readRelays],
          ["output", "text/plain"],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Request Feed", unique([...clientRelaysService.getWriteUrls(), ...dvmRelays]), signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  useEffect(() => {
    setRequesting(false);
  }, [events.length]);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={requestNewFeed} isLoading={requesting} colorScheme="primary">
          New Feed
        </Button>
        <IconButton icon={<CodeIcon />} ml="auto" aria-label="View Raw" title="View Raw" onClick={debugModal.onOpen} />
      </Flex>

      {jobChains[0] && <Feed chain={jobChains[0]} pointer={pointer} />}

      {debugModal.isOpen && (
        <Modal isOpen onClose={debugModal.onClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Jobs</ModalHeader>
            <ModalCloseButton />
            <ModalBody p="0">
              <DebugChains chains={jobChains} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </VerticalPageLayout>
  );
}

function useDVMCoordinate() {
  const { addr } = useParams() as { addr: string };
  if (addr.includes(":")) {
    const parsed = parseCoordinate(addr, true);
    if (!parsed) throw new Error("Bad coordinate");
    return parsed;
  }

  const parsed = nip19.decode(addr);
  if (parsed.type !== "naddr") throw new Error(`Unknown type ${parsed.type}`);
  return parsed.data;
}
export default function DVMFeedView() {
  const pointer = useDVMCoordinate();

  return (
    <RequireCurrentAccount>
      <DVMFeedPage pointer={pointer} />
    </RequireCurrentAccount>
  );
}
