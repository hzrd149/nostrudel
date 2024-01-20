import { useCallback, useState } from "react";
import { Button, Flex, Select, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";

import { useReadRelayUrls } from "../../../../hooks/use-client-relays";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { getEventUID } from "../../../../helpers/nostr/events";
import {
  DVM_STATUS_KIND,
  DVM_TTS_JOB_KIND,
  DVM_TTS_RESULT_KIND,
  groupEventsIntoJobs,
} from "../../../../helpers/nostr/dvm";
import useSubject from "../../../../hooks/use-subject";
import { DraftNostrEvent, NostrEvent } from "../../../../types/nostr-event";
import { useSigningContext } from "../../../../providers/global/signing-provider";
import relayScoreboardService from "../../../../services/relay-scoreboard";
import NostrPublishAction from "../../../../classes/nostr-publish-action";
import clientRelaysService from "../../../../services/client-relays";
import useCurrentAccount from "../../../../hooks/use-current-account";
import { NostrQuery } from "../../../../types/nostr-query";
import TextToSpeechJob from "./tts-job";

export default function NoteTextToSpeechPage({ note }: { note: NostrEvent }) {
  const { requestSignature } = useSigningContext();
  const toast = useToast();
  const account = useCurrentAccount();

  const [lang, setLang] = useState(navigator.language.split("-")[0] ?? "en");
  const readRelays = useReadRelayUrls();
  const requestReading = useCallback(async () => {
    try {
      const top8Relays = relayScoreboardService.getRankedRelays(readRelays).slice(0, 8);
      const draft: DraftNostrEvent = {
        kind: DVM_TTS_JOB_KIND,
        content: "",
        created_at: dayjs().unix(),
        tags: [
          ["i", note.id, "event"],
          ["param", "language", lang],
          ["relays", ...top8Relays],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Request Reading", clientRelaysService.outbox.urls, signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  }, [requestSignature, note, readRelays]);

  const timeline = useTimelineLoader(
    `${getEventUID(note)}-readings`,
    readRelays,
    [
      {
        kinds: [DVM_TTS_JOB_KIND, DVM_TTS_RESULT_KIND],
        "#i": [note.id],
      },
      account && { kinds: [DVM_STATUS_KIND], "#p": [account.pubkey] },
    ].filter(Boolean) as NostrQuery[],
  );

  const events = useSubject(timeline.timeline);
  const jobs = groupEventsIntoJobs(events);

  return (
    <>
      <Flex gap="2">
        <Select value={lang} onChange={(e) => setLang(e.target.value)} w="60">
          {codes.map((code) => (
            <option key={code.iso639_1} value={code.iso639_1}>
              {code.name} ({code.nativeName})
            </option>
          ))}
        </Select>
        <Button size="md" variant="solid" colorScheme="primary" onClick={requestReading} flexShrink={0}>
          Request new reading
        </Button>
      </Flex>
      {Array.from(Object.values(jobs)).map((job) => (
        <TextToSpeechJob key={job.request.id} job={job} />
      ))}
    </>
  );
}
