import { useMemo, useRef } from "react";
import { ImageProps, useBreakpointValue } from "@chakra-ui/react";

import { TimelineLoader } from "../../../classes/timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getMatchLink } from "../../../helpers/regexp";
import { LightboxProvider } from "../../lightbox-provider";
import { isImageURL } from "../../../helpers/url";
import { EmbeddedImage } from "../../embed-types";
import { TrustProvider } from "../../../providers/trust";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { Photo } from "react-photo-album";

function GalleryImage({ eventId, ...props }: ImageProps & { eventId: string }) {
  const ref = useRef<HTMLImageElement | null>(null);
  useRegisterIntersectionEntity(ref, eventId);

  return <EmbeddedImage {...props} ref={ref} />;
}

type PhotoWithEventId = PhotoWithoutSize & { eventId: string };
function ImageGallery({ images }: { images: PhotoWithEventId[] }) {
  const rowMultiplier = useBreakpointValue({ base: 2, sm: 3, md: 3, lg: 4, xl: 5 }) ?? 2;

  return (
    <PhotoGallery<Photo & { eventId: string }>
      layout="masonry"
      photos={images}
      renderPhoto={({ photo, imageProps }) => <GalleryImage eventId={photo.eventId} {...imageProps} />}
      columns={rowMultiplier}
    />
  );
}

export default function MediaTimeline({ timeline }: { timeline: TimelineLoader }) {
  const events = useSubject(timeline.timeline);

  const images = useMemo(() => {
    var images: { eventId: string; src: string; index: number }[] = [];

    for (const event of events) {
      const urls = event.content.matchAll(getMatchLink());

      let i = 0;
      for (const match of urls) {
        if (isImageURL(match[0])) images.push({ eventId: event.id, src: match[0], index: i++ });
      }
    }

    return images;
  }, [events]);

  return (
    <LightboxProvider>
      <TrustProvider trust>
        <ImageGallery images={images} />
      </TrustProvider>
    </LightboxProvider>
  );
}
