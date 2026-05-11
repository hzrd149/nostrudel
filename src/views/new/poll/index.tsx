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
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { EventTemplate } from "nostr-tools";
import { useMemo, useState } from "react";

import { AddIcon, TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import ZaplessPollContent from "../../../components/zapless-poll/zapless-poll-content";
import { ZAPLESS_POLL_KIND } from "../../../helpers/nostr/polls";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { PublishLogEntryDetails } from "../../task-manager/publish-log/entry-details";
import { PublishLogEntry } from "../../../providers/global/publish-provider";

function createPreviewEvent(content: string, options: string[]) {
  return {
    id: "preview",
    pubkey: "preview",
    created_at: Math.round(Date.now() / 1000),
    kind: ZAPLESS_POLL_KIND,
    content,
    tags: [
      ...options.map((option, index) => ["poll_option", String(index), option]),
      ["value_minimum", "0"],
      ["value_maximum", "0"],
      ["alt", "Poll event"],
    ],
    sig: "",
  };
}

export default function NewPollView() {
  const publish = usePublishEvent();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<PublishLogEntry>();

  const cleanOptions = useMemo(() => options.map((option) => option.trim()).filter(Boolean), [options]);
  const canSubmit = question.trim().length > 0 && cleanOptions.length >= 2;

  const preview = useMemo(() => createPreviewEvent(question, cleanOptions), [question, cleanOptions]);

  const publishPoll = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const poll: EventTemplate = {
        kind: ZAPLESS_POLL_KIND,
        content: question.trim(),
        tags: [
          ...cleanOptions.map((option, index) => ["poll_option", String(index), option]),
          ["value_minimum", "0"],
          ["value_maximum", "0"],
          ["alt", "Poll event"],
        ],
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
              <ZaplessPollContent event={preview} readOnly />
            </CardBody>
          </Card>
        )}
      </Flex>
    </SimpleView>
  );
}
