import { Box, Button, Flex, Grid, IconButton, Spinner } from "@chakra-ui/react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useEffect, useMemo } from "react";
import { matchImageUrls } from "../../helpers/regexp";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { ImageGalleryLink, ImageGalleryProvider } from "../../components/image-gallery";
import { ExternalLinkIcon } from "../../components/icons";
import { getSharableNoteId } from "../../helpers/nip19";
import { useMount, useUnmount } from "react-use";
import useSubject from "../../hooks/use-subject";
import userTimelineService from "../../services/user-timeline";

const matchAllImages = new RegExp(matchImageUrls, "ig");

const UserMediaTab = () => {
  const isMobile = useIsMobile();
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const timeline = useMemo(() => userTimelineService.getTimeline(pubkey), [pubkey]);

  const events = useSubject(timeline.events);
  const loading = useSubject(timeline.loading);

  useEffect(() => {
    timeline.setRelays(contextRelays);
  }, [timeline, contextRelays.join("|")]);

  useMount(() => timeline.open());
  useUnmount(() => timeline.close());

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

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      <ImageGalleryProvider>
        <Grid templateColumns={`repeat(${isMobile ? 2 : 5}, 1fr)`} gap="4">
          {images.map((image) => (
            <ImageGalleryLink key={image.eventId + "-" + image.index} href={image.src} position="relative">
              <Box
                aspectRatio={1}
                backgroundImage={`url(${image.src})`}
                backgroundSize="cover"
                backgroundPosition="center"
              />
              <IconButton
                as={RouterLink}
                icon={<ExternalLinkIcon />}
                aria-label="Open note"
                to={`/n/${getSharableNoteId(image.eventId)}`}
                position="absolute"
                right="2"
                top="2"
                size="sm"
              />
            </ImageGalleryLink>
          ))}
        </Grid>
      </ImageGalleryProvider>
      {loading ? (
        <Spinner ml="auto" mr="auto" mt="8" mb="8" />
      ) : (
        <Button onClick={() => timeline.loadMore()}>Load More</Button>
      )}
    </Flex>
  );
};

export default UserMediaTab;
