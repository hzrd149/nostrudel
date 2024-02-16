import { useCallback, useState } from "react";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";

import { DraftNostrEvent, NostrEvent } from "../../../../types/nostr-event";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { getEventUID } from "../../../../helpers/nostr/event";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useSubject from "../../../../hooks/use-subject";
import relayScoreboardService from "../../../../services/relay-scoreboard";
import {
  DVM_STATUS_KIND,
  DVM_TRANSLATE_JOB_KIND,
  DVM_TRANSLATE_RESULT_KIND,
  groupEventsIntoJobs,
} from "../../../../helpers/nostr/dvm";
import useCurrentAccount from "../../../../hooks/use-current-account";
import TranslationJob from "./translation-job";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { Filter } from "nostr-tools";

export function NoteTranslationsPage({ note }: { note: NostrEvent }) {
  const account = useCurrentAccount();
  const publish = usePublishEvent();

  const [lang, setLang] = useState(navigator.language.split("-")[0] ?? "en");
  const readRelays = useReadRelays();
  const requestTranslation = useCallback(async () => {
    const top8Relays = relayScoreboardService.getRankedRelays(readRelays).slice(0, 8);
    const draft: DraftNostrEvent = {
      kind: DVM_TRANSLATE_JOB_KIND,
      content: "",
      created_at: dayjs().unix(),
      tags: [
        ["i", note.id, "event"],
        ["param", "language", lang],
        ["output", "text/plain"],
        ["relays", ...top8Relays],
      ],
    };

    await publish("Request Translation", draft);
  }, [publish, note, readRelays]);

  const timeline = useTimelineLoader(
    `${getEventUID(note)}-translations`,
    readRelays,
    [
      {
        kinds: [DVM_TRANSLATE_JOB_KIND, DVM_TRANSLATE_RESULT_KIND],
        "#i": [note.id],
      },
      account && { kinds: [DVM_STATUS_KIND], "#p": [account.pubkey] },
    ].filter(Boolean) as Filter[],
  );

  const events = useSubject(timeline.timeline);
  const jobs = Object.values(groupEventsIntoJobs(events));

  return (
    <>
      <Flex gap="2">
        <Select value={lang} onChange={(e) => setLang(e.target.value)} w="60">
          {codes.map((code) => (
            <option value={code.iso639_1}>
              {code.name} ({code.nativeName})
            </option>
          ))}
        </Select>
        <Button size="md" variant="solid" colorScheme="primary" onClick={requestTranslation} flexShrink={0}>
          Request new translation
        </Button>
      </Flex>
      {jobs.map((job) => (
        <TranslationJob key={job.request.id} job={job} />
      ))}
    </>
  );
}

export default function NoteTranslationModal({
  onClose,
  isOpen,
  note,
  ...props
}: Omit<ModalProps, "children"> & { note: NostrEvent }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Note Translations</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4" display="flex" gap="2" flexDirection="column">
          <NoteTranslationsPage note={note} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
