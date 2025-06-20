import { forwardRef, MouseEventHandler, MutableRefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "@chakra-ui/react";
import { handleImageFallbacks } from "blossom-client-sdk/image";
import { NostrEvent } from "nostr-tools";

import { EmbeddedImageProps, getPubkeyMediaServers, TrustImage, useImageThumbnail } from "../links";
import { useRegisterSlide } from "../../lightbox-provider";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import ExpandableEmbed from "./content-embed";

// nevent1qqs8397rp8tt60f3lm8zldt8uqljuqw9axp8z79w0qsmj3r96lmg4tgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3zamnwvaz7tmwdaehgun4v5hxxmmd0mkwa9
export const GalleryImage = forwardRef<HTMLImageElement | null, EmbeddedImageProps>(
  ({ src, event, imageProps, ...props }, ref) => {
    const thumbnail = useImageThumbnail(src);

    ref = ref || useRef<HTMLImageElement | null>(null);
    const { show } = useRegisterSlide(
      ref as MutableRefObject<HTMLImageElement | null>,
      src ? { type: "image", src, event } : undefined,
    );
    const handleClick = useCallback<MouseEventHandler<HTMLElement>>(
      (e) => {
        !e.isPropagationStopped() && show();
        e.preventDefault();
      },
      [show],
    );

    useEffect(() => {
      const el = (ref as MutableRefObject<HTMLImageElement | null>).current;
      if (el) handleImageFallbacks(el, getPubkeyMediaServers);
    }, []);

    return (
      <Link href={src} isExternal onClick={handleClick} {...props}>
        <TrustImage src={thumbnail} cursor="pointer" ref={ref} onClick={handleClick} w="full" {...imageProps} />
      </Link>
    );
  },
);

export function ImageGallery({ images, event }: { images: string[]; event?: NostrEvent }) {
  const photos = useMemo(() => {
    return images.map((img) => {
      const photo: PhotoWithoutSize = { src: img, key: img };
      return photo;
    });
  }, [images]);

  const rowMultiplier = useBreakpointValue({ base: 1.5, sm: 2, md: 3, lg: 4, xl: 5 }) ?? 4;

  return (
    <ExpandableEmbed
      label="Image Gallery"
      raw={images.map((img) => (
        <Link key={img} color="blue.500" href={img} isExternal noOfLines={1}>
          {img}
        </Link>
      ))}
    >
      <PhotoGallery
        layout="rows"
        photos={photos}
        renderPhoto={({ photo, imageProps, wrapperStyle }) => (
          <GalleryImage src={imageProps.src} style={imageProps.style} />
        )}
        targetRowHeight={(containerWidth) => containerWidth / rowMultiplier}
      />
    </ExpandableEmbed>
  );
}
