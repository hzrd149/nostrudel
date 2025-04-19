import { useCallback, useEffect, useState } from "react";
import {
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Input,
  Spacer,
  useEditableControls,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppTitle } from "../../hooks/use-app-title";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { isReply, isRepost } from "../../helpers/nostr/event";
import { CheckIcon, EditIcon } from "../../components/icons";
import { NostrEvent } from "nostr-tools";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";
import { useReadRelays } from "../../hooks/use-client-relays";

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
  const location = useLocation();
  const { hashtag } = useParams() as { hashtag: string };
  const [editableHashtag, setEditableHashtag] = useState(hashtag);
  useEffect(() => setEditableHashtag(hashtag), [hashtag]);

  useAppTitle("#" + hashtag);

  const showReplies = useRouteStateBoolean("show-replies", true);
  const showReposts = useRouteStateBoolean("show-reposts", true);

  const readRelays = useReadRelays();

  const { listId, filter } = usePeopleListContext();
  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [showReplies.isOpen, showReposts.isOpen, muteFilter, timelinePageEventFilter],
  );
  const { loader, timeline } = useTimelineLoader(
    `${listId ?? "global"}-${hashtag}-hashtag`,
    readRelays,
    { kinds: [1], "#t": [hashtag], ...filter },
    { eventFilter },
  );

  const header = (
    <Flex gap="2" alignItems="center" wrap="wrap">
      <Editable
        value={editableHashtag}
        onChange={(v) => setEditableHashtag(v)}
        fontSize="3xl"
        fontWeight="bold"
        display="flex"
        gap="2"
        alignItems="center"
        selectAllOnFocus
        onSubmit={(v) => navigate("/t/" + String(v).toLowerCase() + location.search)}
        flexShrink={0}
      >
        <div>
          #<EditablePreview p={0} />
        </div>
        <Input as={EditableInput} maxW="md" />
        <EditableControls />
      </Editable>
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HashTagView() {
  return (
    <PeopleListProvider initList="global">
      <HashTagPage />
    </PeopleListProvider>
  );
}
