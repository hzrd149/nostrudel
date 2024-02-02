import { Flex, Image, SimpleGrid, Spacer, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import { FILE_KIND, IMAGE_TYPES, VIDEO_TYPES, getFileUrl, parseImageFile } from "../../helpers/nostr/files";
import { ErrorBoundary } from "../../components/error-boundary";
import useAppSettings from "../../hooks/use-app-settings";
import { TrustProvider, useTrusted } from "../../providers/local/trust";
import BlurredImage from "../../components/blured-image";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { UserAvatarLink } from "../../components/user-avatar-link";
import UserLink from "../../components/user-link";
import MimeTypePicker from "./mime-type-picker";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import Timestamp from "../../components/timestamp";
import NoteZapButton from "../../components/note/note-zap-button";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useReadRelays } from "../../hooks/use-client-relays";

function ImageFile({ event }: { event: NostrEvent }) {
  const parsed = parseImageFile(event);
  const settings = useAppSettings();
  const trust = useTrusted();

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const shouldBlur = settings.blurImages && !trust;

  // const showImage = useDisclosure();
  // if (shouldBlur && parsed.blurhash && parsed.width && parsed.height && !showImage.isOpen) {
  //   const aspect = parsed.width / parsed.height;
  //   return (
  //     <BlurhashImage
  //       blurhash={parsed.blurhash}
  //       width={64 * aspect}
  //       height={64}
  //       onClick={showImage.onOpen}
  //       cursor="pointer"
  //       w="full"
  //     />
  //   );
  // }

  const ImageComponent = shouldBlur ? BlurredImage : Image;
  return (
    <Flex
      direction="column"
      gap="2"
      aspectRatio={1}
      backgroundImage={parsed.url}
      backgroundPosition="center"
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      borderRadius="lg"
      overflow="hidden"
      ref={ref}
    >
      <Flex gap="2" alignItems="center" backgroundColor="blackAlpha.500" mt="auto" p="2">
        <UserAvatarLink pubkey={event.pubkey} size="sm" />
        <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated />
        <Timestamp timestamp={event.created_at} />
        <Spacer />
        <NoteZapButton event={event} size="sm" colorScheme="yellow" variant="outline" />
      </Flex>
    </Flex>
  );
}

function VideoFile({ event }: { event: NostrEvent }) {
  const url = getFileUrl(event);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <Flex direction="column" gap="2" ref={ref}>
      <Flex gap="2" alignItems="center">
        <UserAvatarLink pubkey={event.pubkey} size="sm" />
        <UserLink pubkey={event.pubkey} fontWeight="bold" />
      </Flex>
      <video src={url} controls />
    </Flex>
  );
}

function FileType({ event }: { event: NostrEvent }) {
  const mimeType = event.tags.find((t) => t[0] === "m" && t[1])?.[1];

  if (!mimeType) throw new Error("Missing MIME type");

  if (IMAGE_TYPES.includes(mimeType)) {
    return (
      <TrustProvider trust>
        <ImageFile event={event} />
      </TrustProvider>
    );
  }
  if (VIDEO_TYPES.includes(mimeType)) {
    return <VideoFile event={event} />;
  }
  return <Text>Unknown mine type {mimeType}</Text>;
}

function FilesPage() {
  const { listId, filter } = usePeopleListContext();
  const relays = useReadRelays();

  const [selectedTypes, setSelectedTypes] = useState<string[]>(IMAGE_TYPES);

  const timeline = useTimelineLoader(
    `${listId}-files`,
    relays,
    { kinds: [FILE_KIND], "#m": selectedTypes, ...filter },
    { enabled: selectedTypes.length > 0 && !!filter },
  );

  const events = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
        <MimeTypePicker selected={selectedTypes} onChange={(v) => setSelectedTypes(v)} />
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid minChildWidth="20rem" spacing="2">
          {events.map((event) => (
            <ErrorBoundary>
              <FileType key={event.id} event={event} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </VerticalPageLayout>
  );
}

export default function FilesView() {
  return (
    <PeopleListProvider>
      <FilesPage />
    </PeopleListProvider>
  );
}
