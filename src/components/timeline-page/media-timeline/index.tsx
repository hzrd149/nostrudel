import { useMemo } from "react";
import { kinds } from "nostr-tools";
import { Photo } from "react-photo-album";

import { getMatchLink } from "../../../helpers/regexp";
import { LightboxProvider } from "../../lightbox-provider";
import { isImageURL } from "../../../helpers/url";
import { EmbeddedImageProps } from "../../content/links";
import { TrustProvider } from "../../../providers/local/trust-provider";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";
import { NostrEvent } from "../../../types/nostr-event";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { GalleryImage } from "../../content/gallery";

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
    var images: PhotoWithEvent[] = [];

    for (const event of timeline) {
      if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) continue;
      const urls = event.content.matchAll(getMatchLink());

      let i = 0;
      for (const match of urls) {
        if (isImageURL(match[0])) images.push({ event, src: match[0] });
      }
    }

    return images;
  }, [timeline]);

  return (
    <LightboxProvider>
      <TrustProvider trust>
        <ImageGallery images={images} />
      </TrustProvider>
    </LightboxProvider>
  );
}
