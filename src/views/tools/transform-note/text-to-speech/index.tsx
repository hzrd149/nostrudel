import { useCallback, useState } from "react";
import { Button, Flex, Select } from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";
import { Filter } from "nostr-tools";

import { useReadRelays } from "../../../../hooks/use-client-relays";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { getEventUID } from "../../../../helpers/nostr/event";
import {
  DVM_STATUS_KIND,
  DVM_TTS_JOB_KIND,
  DVM_TTS_RESULT_KIND,
  groupEventsIntoJobs,
} from "../../../../helpers/nostr/dvm";
import { DraftNostrEvent, NostrEvent } from "../../../../types/nostr-event";
import relayScoreboardService from "../../../../services/relay-scoreboard";
import useCurrentAccount from "../../../../hooks/use-current-account";
import TextToSpeechJob from "./tts-job";
import { usePublishEvent } from "../../../../providers/global/publish-provider";

export default function NoteTextToSpeechPage({ note }: { note: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useCurrentAccount();

  const [lang, setLang] = useState(navigator.language.split("-")[0] ?? "en");
  const readRelays = useReadRelays();
  const requestReading = useCallback(async () => {
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

    await publish("Request Reading", draft);
  }, [publish, note, readRelays, lang]);

  const { loader, timeline: events } = useTimelineLoader(
    `${getEventUID(note)}-readings`,
    readRelays,
    [
      {
        kinds: [DVM_TTS_JOB_KIND, DVM_TTS_RESULT_KIND],
        "#i": [note.id],
      },
      account && { kinds: [DVM_STATUS_KIND], "#p": [account.pubkey] },
    ].filter(Boolean) as Filter[],
  );

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
