import {
  Button,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Switch,
  useDisclosure,
  useEditableControls,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { isReply } from "../../helpers/nostr-event";
import { CheckIcon, EditIcon, RelayIcon } from "../../components/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import RelaySelectionModal from "../../components/relay-selection/relay-selection-modal";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/timeline/generic-note-timeline";
import { unique } from "../../helpers/array";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";

function EditableControls() {
  const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

  return isEditing ? (
    <ButtonGroup justifyContent="center" size="md">
      <IconButton icon={<CheckIcon />} {...getSubmitButtonProps()} aria-label="Save" />
      <IconButton icon={<CloseIcon />} {...getCancelButtonProps()} aria-label="Cancel" />
    </ButtonGroup>
  ) : (
    <IconButton size="md" icon={<EditIcon />} {...getEditButtonProps()} aria-label="Edit" />
  );
}

function HashTagPage() {
  const navigate = useNavigate();
  const { hashtag } = useParams() as { hashtag: string };
  const [editableHashtag, setEditableHashtag] = useState(hashtag);
  useEffect(() => setEditableHashtag(hashtag), [hashtag]);

  useAppTitle("#" + hashtag);

  const readRelays = useRelaySelectionRelays();
  const { isOpen: showReplies, onToggle } = useDisclosure();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      return showReplies ? true : !isReply(event);
    },
    [showReplies]
  );
  const timeline = useTimelineLoader(
    `${hashtag}-hashtag`,
    readRelays,
    { kinds: [1], "#t": [hashtag] },
    { eventFilter }
  );

  useRelaysChanged(readRelays, () => timeline.reset());

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback} root={scrollBox}>
        <Flex
          direction="column"
          gap="4"
          overflowY="auto"
          overflowX="hidden"
          flex={1}
          pb="4"
          pt="4"
          pl="1"
          pr="1"
          ref={scrollBox}
        >
          <Flex gap="4" alignItems="center" wrap="wrap">
            <Editable
              value={editableHashtag}
              onChange={(v) => setEditableHashtag(v)}
              fontSize="3xl"
              fontWeight="bold"
              display="flex"
              gap="2"
              alignItems="center"
              selectAllOnFocus
              onSubmit={(v) => navigate("/t/" + String(v).toLowerCase())}
              flexShrink={0}
            >
              <div>
                #<EditablePreview p={0} />
              </div>
              <Input as={EditableInput} maxW="md" />
              <EditableControls />
            </Editable>
            <RelaySelectionButton />
            <FormControl display="flex" alignItems="center" w="auto">
              <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
              <FormLabel htmlFor="show-replies" mb="0">
                Show Replies
              </FormLabel>
            </FormControl>
          </Flex>

          <GenericNoteTimeline timeline={timeline} />
          <TimelineActionAndStatus timeline={timeline} />
        </Flex>
      </IntersectionObserverProvider>
    </>
  );
}

export default function HashTagView() {
  return (
    <RelaySelectionProvider>
      <HashTagPage />
    </RelaySelectionProvider>
  );
}
