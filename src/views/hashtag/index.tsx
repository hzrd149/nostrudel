import { useCallback, useEffect, useState } from "react";
import {
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Spacer,
  Switch,
  useDisclosure,
  useEditableControls,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAppTitle } from "../../hooks/use-app-title";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { isReply } from "../../helpers/nostr/events";
import { CheckIcon, EditIcon } from "../../components/icons";
import { NostrEvent } from "../../types/nostr-event";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";

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

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return timelinePageEventFilter(event);
    },
    [showReplies],
  );
  const timeline = useTimelineLoader(
    `${hashtag}-hashtag`,
    readRelays,
    { kinds: [1], "#t": [hashtag] },
    { eventFilter },
  );

  useRelaysChanged(readRelays, () => timeline.reset());

  const header = (
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
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HashTagView() {
  return (
    <RelaySelectionProvider>
      <HashTagPage />
    </RelaySelectionProvider>
  );
}
