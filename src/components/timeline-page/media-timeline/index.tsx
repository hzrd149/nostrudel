import { Expressions } from "applesauce-content/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { Photo } from "react-photo-album";

import { isImageURL } from "../../../helpers/url";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { GalleryImage } from "../../content/components/gallery";
import { EmbeddedImageProps } from "../../content/links";
import { LightboxProvider } from "../../lightbox-provider";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";

function CustomGalleryImage({ event, ...props }: EmbeddedImageProps & { event: NostrEvent }) {
  const ref = useEventIntersectionRef<HTMLImageElement>(event);

  return <GalleryImage {...props} event={event} ref={ref} />;
}

type PhotoWithEvent = PhotoWithoutSize & { event: NostrEvent };
function ImageGallery({ images }: { images: PhotoWithEvent[] }) {
  const rowMultiplier = useBreakpointValue({ base: 2, sm: 3, md: 3, lg: 4, xl: 5 }) ?? 2;

  return (
    <PhotoGallery<Photo & { event: NostrEvent }>
      layout="masonry"
      photos={images}
      renderPhoto={({ photo, imageProps }) => (
        <CustomGalleryImage src={imageProps.src} event={photo.event} style={imageProps.style} />
      )}
      columns={rowMultiplier}
    />
  );
}

export default function MediaTimeline({ timeline }: { timeline: NostrEvent[] }) {
  const images = useMemo(() => {
    const images: PhotoWithEvent[] = [];

    for (const event of timeline) {
      if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) continue;
      const urls = event.content.matchAll(Expressions.link);

      for (const match of urls) {
        if (isImageURL(match[0])) images.push({ event, src: match[0] });
      }
    }

    return images;
  }, [timeline]);

  return (
    <LightboxProvider>
      <ImageGallery images={images} />
    </LightboxProvider>
  );
}
