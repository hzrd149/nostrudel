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
  Spinner,
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
import { Note } from "../../components/note";
import { CheckIcon, EditIcon, RelayIcon } from "../../components/icons";
import { useEffect, useState } from "react";
import RelaySelectionModal from "./relay-selection-modal";

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

export default function HashTagView() {
  const navigate = useNavigate();
  const { hashtag } = useParams() as { hashtag: string };
  const [editableHashtag, setEditableHashtag] = useState(hashtag);
  useEffect(() => setEditableHashtag(hashtag), [hashtag]);

  useAppTitle("#" + hashtag);

  const defaultRelays = useReadRelayUrls();
  const [selectedRelays, setSelectedRelays] = useState(defaultRelays);

  const relaysModal = useDisclosure();
  const { isOpen: showReplies, onToggle } = useDisclosure();
  const { events, loading, loadMore, loader } = useTimelineLoader(
    `${hashtag}-hashtag`,
    selectedRelays,
    { kinds: [1], "#t": [hashtag] },
    { pageSize: 60 * 10 }
  );

  const timeline = showReplies ? events : events.filter((e) => !isReply(e));

  return (
    <>
      <Flex direction="column" gap="4" overflow="auto" flex={1} pb="4" pt="4" pl="1" pr="1">
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
          <Button leftIcon={<RelayIcon />} onClick={relaysModal.onOpen}>
            {selectedRelays.length} Relays
          </Button>
          <FormControl display="flex" alignItems="center" w="auto">
            <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
            <FormLabel htmlFor="show-replies" mb="0">
              Show Replies
            </FormLabel>
          </FormControl>
        </Flex>
        {timeline.map((event) => (
          <Note key={event.id} event={event} maxHeight={600} />
        ))}
        {loading ? (
          <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />
        ) : (
          <Button onClick={() => loadMore()} flexShrink={0}>
            Load More
          </Button>
        )}
      </Flex>

      {relaysModal.isOpen && (
        <RelaySelectionModal
          selected={selectedRelays}
          onSubmit={(relays) => {
            setSelectedRelays(relays);
            loader.forgetEvents();
          }}
          onClose={relaysModal.onClose}
        />
      )}
    </>
  );
}
