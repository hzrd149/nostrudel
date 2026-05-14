import {
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { POLL_KIND, type PollType } from "applesauce-common/helpers";
import { EventTemplate } from "nostr-tools";
import { useMemo, useState } from "react";

import { AddIcon, TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import PollContent from "../../../components/poll/poll-content";
import { useWriteRelays } from "../../../hooks/use-client-relays";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { PublishLogEntryDetails } from "../../task-manager/publish-log/entry-details";
import { PublishLogEntry } from "../../../providers/global/publish-provider";

function createPollTags(options: string[], relays: string[], pollType: PollType) {
  return [
    ...options.map((option, index) => ["option", String(index), option]),
    ...relays.map((relay) => ["relay", relay]),
    ["polltype", pollType],
    ["alt", "Poll event"],
  ];
}

function createPreviewEvent(content: string, options: string[], relays: string[], pollType: PollType) {
  return {
    id: "preview",
    pubkey: "preview",
    created_at: Math.round(Date.now() / 1000),
    kind: POLL_KIND,
    content,
    tags: createPollTags(options, relays, pollType),
    sig: "",
  };
}

export default function NewPollView() {
  const publish = usePublishEvent();
  const writeRelays = useWriteRelays();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollType, setPollType] = useState<PollType>("singlechoice");
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<PublishLogEntry>();

  const cleanOptions = useMemo(() => options.map((option) => option.trim()).filter(Boolean), [options]);
  const canSubmit = question.trim().length > 0 && cleanOptions.length >= 2;

  const preview = useMemo(
    () => createPreviewEvent(question, cleanOptions, writeRelays, pollType),
    [question, cleanOptions, writeRelays, pollType],
  );

  const publishPoll = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const poll: EventTemplate = {
        kind: POLL_KIND,
        content: question.trim(),
        tags: createPollTags(cleanOptions, writeRelays, pollType),
        created_at: Math.round(Date.now() / 1000),
      };
      const entry = await publish("Poll", poll, undefined, false);
      if (entry) setPublished(entry);
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <SimpleView title="Poll published" center maxW="4xl">
        <PublishLogEntryDetails entry={published} />
      </SimpleView>
    );
  }

  if (loading) {
    return (
      <SimpleView title="New poll" center maxW="4xl">
        <Flex gap="2" alignItems="center" justifyContent="center" py="8">
          <Spinner size="lg" />
          <Text>Signing and publishing poll...</Text>
        </Flex>
      </SimpleView>
    );
  }

  return (
    <SimpleView title="New poll" center maxW="4xl">
      <Flex direction="column" gap="4">
        <FormControl isRequired>
          <FormLabel>Question</FormLabel>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} autoFocus />
        </FormControl>

        <FormControl>
          <FormLabel>Poll type</FormLabel>
          <Select value={pollType} onChange={(e) => setPollType(e.target.value as PollType)}>
            <option value="singlechoice">Single choice</option>
            <option value="multiplechoice">Multiple choice</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Options</FormLabel>
          <Flex direction="column" gap="2">
            {options.map((option, index) => (
              <Flex key={index} gap="2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const next = [...options];
                    next[index] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${index + 1}`}
                />
                <IconButton
                  icon={<TrashIcon />}
                  aria-label="Remove option"
                  isDisabled={options.length <= 2}
                  onClick={() => setOptions(options.filter((_, optionIndex) => optionIndex !== index))}
                />
              </Flex>
            ))}
          </Flex>
        </FormControl>

        <Flex gap="2" justifyContent="space-between">
          <Button leftIcon={<AddIcon />} variant="outline" onClick={() => setOptions([...options, ""])}>
            Add option
          </Button>
          <Button colorScheme="primary" onClick={publishPoll} isDisabled={!canSubmit}>
            Publish poll
          </Button>
        </Flex>

        {canSubmit && (
          <Card variant="outline">
            <CardBody>
              <Heading size="sm" mb="3">
                Preview
              </Heading>
              <PollContent event={preview} readOnly />
            </CardBody>
          </Card>
        )}
      </Flex>
    </SimpleView>
  );
}
