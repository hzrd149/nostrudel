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
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  DVM_CONTENT_DISCOVERY_JOB_KIND,
  DVM_CONTENT_DISCOVERY_RESULT_KIND,
  DVM_STATUS_KIND,
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
import { useSigningContext } from "../../providers/global/signing-provider";
import useCurrentAccount from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { CodeIcon } from "../../components/icons";
import { unique } from "../../helpers/array";
import DebugChains from "./components/debug-chains";
import Feed from "./components/feed";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import DVMParams from "./components/dvm-params";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import RelaySet from "../../classes/relay-set";

function DVMFeedPage({ pointer }: { pointer: AddressPointer }) {
  const [since] = useState(() => dayjs().subtract(1, "hour").unix());
  const toast = useToast();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const debugModal = useDisclosure();

  const dvmRelays = useUserMailboxes(pointer.pubkey)?.relays;
  const readRelays = useReadRelayUrls(dvmRelays);
  const timeline = useTimelineLoader(`${pointer.kind}:${pointer.pubkey}:${pointer.identifier}-jobs`, readRelays, [
    { authors: [account.pubkey], "#p": [pointer.pubkey], kinds: [DVM_CONTENT_DISCOVERY_JOB_KIND], since },
    {
      authors: [pointer.pubkey],
      "#p": [account.pubkey],
      kinds: [DVM_CONTENT_DISCOVERY_RESULT_KIND, DVM_STATUS_KIND],
      since,
    },
  ]);

  const events = useSubject(timeline.timeline);
  const jobs = groupEventsIntoJobs(events);
  const pages = chainJobs(Array.from(Object.values(jobs)));
  const jobChains = flattenJobChain(pages);

  const [params, setParams] = useState<Record<string, string>>({});
  const { requestSignature } = useSigningContext();
  const [requesting, setRequesting] = useState(false);
  const requestNewFeed = async () => {
    try {
      setRequesting(true);

      const paramTags = Object.entries(params).map(([key, value]) => ["param", key, value]);
      const draft: DraftNostrEvent = {
        kind: DVM_CONTENT_DISCOVERY_JOB_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [
          ["p", pointer.pubkey],
          ["relays", ...readRelays],
          ["expiration", String(dayjs().add(1, "day").unix())],
          ...paramTags,
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Request Feed", RelaySet.from(clientRelaysService.outbox, dvmRelays), signed);
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
        <DVMParams pointer={pointer} params={params} onChange={setParams} />
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

export default function DVMFeedView() {
  const pointer = useParamsAddressPointer("addr");

  return (
    <RequireCurrentAccount>
      <DVMFeedPage pointer={pointer} />
    </RequireCurrentAccount>
  );
}
