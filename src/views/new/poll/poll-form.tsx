import {
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { PollFactory } from "applesauce-common/factories";
import { Emoji, type PollType } from "applesauce-common/helpers";
import { setShortTextContent } from "applesauce-core/operations/content";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import InsertGifButton from "../../../components/gif/insert-gif-button";
import { AddIcon, TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import PollContent from "../../../components/poll/poll-content";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import UploadStatus from "../../../components/upload-status";
import insertTextIntoMagicTextarea from "../../../helpers/magic-textarea";
import useAsyncAction from "../../../hooks/use-async-action";
import { useWriteRelays } from "../../../hooks/use-client-relays";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import useTextAreaUploadFile from "../../../hooks/use-textarea-upload-file";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { PublishLogEntry, useFinalizeDraft, usePublishEvent } from "../../../providers/global/publish-provider";
import UploadProvider, { useUploadContext } from "../../../providers/local/upload-provider";
import { PublishLogEntryDetails } from "../../task-manager/publish-log/entry-details";
import InsertImageButton from "../note/insert-image-button";

async function buildPollDraft(
  question: string,
  pollOptions: { id: string; label: string }[],
  pollType: PollType,
  responseRelays: string[],
  endsAtUnix: number,
  textOptions: { emojis: Emoji[] },
) {
  return await PollFactory.create(question, pollOptions)
    .pollType(pollType)
    .relays(responseRelays)
    .endsAt(endsAtUnix)
    .alt("Poll event")
    .then(setShortTextContent(question, textOptions));
}

type EndPresetId = "1h" | "6h" | "1d" | "3d" | "1w" | "custom";

const END_PRESET_OPTIONS: { id: Exclude<EndPresetId, "custom">; label: string; seconds: number }[] = [
  { id: "1h", label: "1 hour", seconds: 3600 },
  { id: "6h", label: "6 hours", seconds: 3600 * 6 },
  { id: "1d", label: "1 day", seconds: 86400 },
  { id: "3d", label: "3 days", seconds: 86400 * 3 },
  { id: "1w", label: "1 week", seconds: 86400 * 7 },
];

function PollFormInner() {
  const publish = usePublishEvent();
  const finalizeDraft = useFinalizeDraft();
  const account = useActiveAccount();
  const writeRelays = useWriteRelays();
  const inboxRelays = useUserInbox(account?.pubkey);
  const pollResponseRelays = useMemo(
    () => (inboxRelays && inboxRelays.length > 0 ? inboxRelays : writeRelays),
    [inboxRelays, writeRelays],
  );
  const emojis = useContextEmojis();
  const uploadCtx = useUploadContext();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollType, setPollType] = useState<PollType>("singlechoice");
  const [endPreset, setEndPreset] = useState<EndPresetId>("1d");
  const [customEndsAt, setCustomEndsAt] = useState("");
  const [published, setPublished] = useState<PublishLogEntry>();
  const [tabIndex, setTabIndex] = useState(0);

  const textAreaRef = useRef<RefType | null>(null);
  const questionRef = useRef(question);
  questionRef.current = question;

  const insertText = useCallback((text: string) => {
    if (textAreaRef.current) {
      insertTextIntoMagicTextarea(textAreaRef.current, () => questionRef.current, setQuestion, text);
    }
  }, []);

  const { onPaste } = useTextAreaUploadFile(insertText);

  const cleanOptions = useMemo(() => options.map((option) => option.trim()).filter(Boolean), [options]);

  const computeEndsAtUnix = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    if (endPreset === "custom") {
      const ms = Date.parse(customEndsAt);
      if (!Number.isFinite(ms)) return now + 86400;
      const unix = Math.floor(ms / 1000);
      return Math.max(now + 60, unix);
    }
    const preset = END_PRESET_OPTIONS.find((p) => p.id === endPreset);
    return now + (preset?.seconds ?? 86400);
  }, [customEndsAt, endPreset]);

  const customEndValid = useMemo(() => {
    if (endPreset !== "custom") return true;
    const now = Math.floor(Date.now() / 1000);
    const ms = Date.parse(customEndsAt);
    return Number.isFinite(ms) && Math.floor(ms / 1000) > now + 60;
  }, [customEndsAt, endPreset]);

  const canSubmit = question.trim().length > 0 && cleanOptions.length >= 2 && customEndValid;

  const previewPubkey = account?.pubkey ?? "preview";
  const textOptions = useMemo(() => ({ emojis: emojis.filter((e) => !!e.url) as Emoji[] }), [emojis]);

  const [preview, setPreview] = useState<NostrEvent | null>(null);

  useEffect(() => {
    if (!canSubmit || tabIndex !== 1) return;

    setPreview(null);
    let cancelled = false;
    const trimmed = question.trim();
    const labels = cleanOptions;
    const pollOptions = labels.map((label, index) => ({ id: String(index), label }));
    const endsAtUnix = computeEndsAtUnix();

    void (async () => {
      try {
        const draft = await buildPollDraft(trimmed, pollOptions, pollType, pollResponseRelays, endsAtUnix, textOptions);
        if (cancelled) return;
        setPreview({
          id: "preview",
          pubkey: previewPubkey,
          created_at: draft.created_at,
          kind: draft.kind,
          content: draft.content,
          tags: draft.tags,
          sig: "",
        });
      } catch {
        if (!cancelled) setPreview(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canSubmit,
    cleanOptions,
    computeEndsAtUnix,
    pollResponseRelays,
    pollType,
    previewPubkey,
    question,
    tabIndex,
    textOptions,
  ]);

  const { loading, run: publishPoll } = useAsyncAction(async () => {
    const trimmed = question.trim();
    const labels = options.map((o) => o.trim()).filter(Boolean);
    if (trimmed.length === 0 || labels.length < 2) return;

    const pollOptions = labels.map((label, index) => ({
      id: String(index),
      label,
    }));
    const endsAtUnix = computeEndsAtUnix();
    const draft = await buildPollDraft(trimmed, pollOptions, pollType, pollResponseRelays, endsAtUnix, textOptions);
    const unsigned = await finalizeDraft(draft);
    const entry = await publish("Poll", unsigned, undefined, false);
    if (entry) setPublished(entry);
  }, [computeEndsAtUnix, finalizeDraft, options, pollResponseRelays, pollType, publish, question, textOptions]);

  const goToPreview = useCallback(() => {
    if (
      question.trim().length > 0 &&
      options.map((o) => o.trim()).filter(Boolean).length >= 2 &&
      !uploadCtx?.isUploading
    ) {
      setTabIndex(1);
    }
  }, [question, options, uploadCtx?.isUploading]);

  if (published) {
    return (
      <SimpleView title="Poll published" center maxW="4xl">
        <PublishLogEntryDetails entry={published} />
      </SimpleView>
    );
  }

  return (
    <SimpleView title="New poll" center maxW="4xl">
      <Tabs colorScheme="primary" isLazy index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Compose</Tab>
          <Tab>Preview</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px="0">
            <Flex direction="column" gap="4">
              <FormControl isRequired>
                <FormLabel>Question</FormLabel>
                <MagicTextArea
                  autoFocus
                  mb="2"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={8}
                  isRequired
                  instanceRef={(inst) => (textAreaRef.current = inst)}
                  onPaste={onPaste}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit && !uploadCtx?.isUploading) {
                      goToPreview();
                    }
                  }}
                />
                <UploadStatus />
                <Flex gap="2" alignItems="center" justifyContent="flex-start">
                  <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
                  <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
                  <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
                </Flex>
              </FormControl>

              <FormControl>
                <FormLabel>Poll type</FormLabel>
                <Select value={pollType} onChange={(e) => setPollType(e.target.value as PollType)}>
                  <option value="singlechoice">Single choice</option>
                  <option value="multiplechoice">Multiple choice</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Poll ends</FormLabel>
                <Select
                  value={endPreset}
                  onChange={(e) => {
                    const v = e.target.value as EndPresetId;
                    setEndPreset(v);
                    if (v === "custom") {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const pad = (n: number) => String(n).padStart(2, "0");
                      setCustomEndsAt(
                        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
                      );
                    }
                  }}
                >
                  {END_PRESET_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">Custom date and time</option>
                </Select>
                {endPreset === "custom" && (
                  <Input
                    type="datetime-local"
                    mt="2"
                    value={customEndsAt}
                    onChange={(e) => setCustomEndsAt(e.target.value)}
                  />
                )}
                <FormHelperText>
                  Closing time is counted from when you publish. Votes are directed to your NIP-65 inbox relays when you
                  have them; otherwise to your write relays.
                </FormHelperText>
                {endPreset === "custom" && !customEndValid && (
                  <Text fontSize="sm" color="red.400" mt="1">
                    Choose a date and time at least one minute in the future.
                  </Text>
                )}
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

              <Flex gap="2" justifyContent="space-between" flexWrap="wrap">
                <Button leftIcon={<AddIcon />} variant="outline" onClick={() => setOptions([...options, ""])}>
                  Add option
                </Button>
                <Button
                  colorScheme="primary"
                  onClick={goToPreview}
                  isDisabled={!canSubmit || !!uploadCtx?.isUploading}
                  title={uploadCtx?.isUploading ? "Upload in progress" : undefined}
                >
                  Preview
                </Button>
              </Flex>
            </Flex>
          </TabPanel>

          <TabPanel px="0">
            {!canSubmit ? (
              <Text color="gray.500">Add a question and at least two options to see a preview.</Text>
            ) : (
              <Flex direction="column" gap="4">
                <Card variant="outline">
                  <CardBody>
                    <Heading size="sm" mb="3">
                      Poll preview
                    </Heading>
                    {preview ? <PollContent event={preview} readOnly /> : <Spinner />}
                  </CardBody>
                </Card>
                <Text fontSize="sm" color="gray.500">
                  Review your poll. The poll event is published to your write relays; votes are sent to the relays
                  listed on the poll (your inboxes when configured).
                </Text>
                <Flex justifyContent="flex-end">
                  <Button
                    colorScheme="primary"
                    onClick={() => publishPoll()}
                    isLoading={loading}
                    isDisabled={!canSubmit || !!uploadCtx?.isUploading}
                    title={uploadCtx?.isUploading ? "Upload in progress" : undefined}
                  >
                    Publish poll
                  </Button>
                </Flex>
              </Flex>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SimpleView>
  );
}

export default function PollForm() {
  return (
    <UploadProvider>
      <PollFormInner />
    </UploadProvider>
  );
}
