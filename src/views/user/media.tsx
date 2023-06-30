import React, { useCallback, useMemo, useRef } from "react";
import { Box, Flex, Grid, IconButton } from "@chakra-ui/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { matchImageUrls } from "../../helpers/regexp";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { ImageGalleryLink, ImageGalleryProvider } from "../../components/image-gallery";
import { ExternalLinkIcon } from "../../components/icons";
import { getSharableNoteId } from "../../helpers/nip19";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { truncatedId } from "../../helpers/nostr-event";

type ImagePreview = { eventId: string; src: string; index: number };
const matchAllImages = new RegExp(matchImageUrls, "ig");

const ImagePreview = React.memo(({ image }: { image: ImagePreview }) => {
  const navigate = useNavigate();

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, image.eventId);

  return (
    <ImageGalleryLink href={image.src} position="relative" ref={ref}>
      <Box aspectRatio={1} backgroundImage={`url(${image.src})`} backgroundSize="cover" backgroundPosition="center" />
      <IconButton
        icon={<ExternalLinkIcon />}
        aria-label="Open note"
        position="absolute"
        right="2"
        top="2"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/n/${getSharableNoteId(image.eventId)}`);
        }}
      />
    </ImageGalleryLink>
  );
});

const UserMediaTab = () => {
  const isMobile = useIsMobile();
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const eventFilter = useCallback((e: NostrEvent) => e.kind === 1 && !!e.content.match(matchAllImages), []);
  const timeline = useTimelineLoader(
    truncatedId(pubkey) + "-notes",
    contextRelays,
    {
      authors: [pubkey],
      kinds: [1, 6],
    },
    { eventFilter }
  );

  const events = useSubject(timeline.timeline);

  const images = useMemo(() => {
    var images: { eventId: string; src: string; index: number }[] = [];

    for (const event of events) {
      const urls = event.content.matchAll(matchAllImages);

      let i = 0;
      for (const url of urls) {
        images.push({ eventId: event.id, src: url[0], index: i++ });
      }
    }

    return images;
  }, [events]);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex direction="column" gap="2" px="2" pb="8" h="full" overflowY="auto" ref={scrollBox}>
        <ImageGalleryProvider>
          <Grid templateColumns={`repeat(${isMobile ? 2 : 5}, 1fr)`} gap="4">
            {images.map((image) => (
              <ImagePreview key={image.eventId + "-" + image.index} image={image} />
            ))}
          </Grid>
        </ImageGalleryProvider>

        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
};

export default UserMediaTab;
