import {
  CSSProperties,
  MouseEventHandler,
  MutableRefObject,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, ImageProps, useBreakpointValue } from "@chakra-ui/react";

import appSettings from "../../services/settings/app-settings";
import { useTrusted } from "../../providers/trust";
import { EmbedableContent, defaultGetLocation } from "../../helpers/embeds";
import { getMatchLink } from "../../helpers/regexp";
import { useRegisterSlide } from "../lightbox-provider";
import { isImageURL } from "../../helpers/url";
import PhotoGallery, { PhotoWithoutSize } from "../photo-gallery";
import { NostrEvent } from "../../types/nostr-event";
import useAppSettings from "../../hooks/use-app-settings";

function useElementBlur(initBlur = false): { style: CSSProperties; onClick: MouseEventHandler } {
  const [blur, setBlur] = useState(initBlur);

  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      if (blur) {
        e.stopPropagation();
        e.preventDefault();
        setBlur(false);
      }
    },
    [blur],
  );

  const style: CSSProperties = blur ? { filter: "blur(1.5rem)", cursor: "pointer" } : {};

  return { onClick, style };
}

export type TrustImageProps = ImageProps;

export const TrustImage = forwardRef<HTMLImageElement, TrustImageProps>((props, ref) => {
  const { blurImages } = useAppSettings();
  const trusted = useTrusted();
  const { onClick, style } = useElementBlur(!trusted);

  const handleClick = useCallback<MouseEventHandler<HTMLImageElement>>(
    (e) => {
      onClick(e);
      if (props.onClick && !e.isPropagationStopped()) {
        props.onClick(e);
      }
    },
    [onClick, props.onClick],
  );

  if (!blurImages) return <Image {...props} ref={ref} />;
  else return <Image {...props} onClick={handleClick} style={{ ...style, ...props.style }} ref={ref} />;
});

export type EmbeddedImageProps = TrustImageProps & {
  event?: NostrEvent;
};

export const EmbeddedImage = forwardRef<HTMLImageElement, EmbeddedImageProps>(({ src, event, ...props }, ref) => {
  const thumbnail = appSettings.value.imageProxy
    ? new URL(`/256,fit/${src}`, appSettings.value.imageProxy).toString()
    : src;

  ref = ref || useRef<HTMLImageElement | null>(null);
  const { show } = useRegisterSlide(
    ref as MutableRefObject<HTMLImageElement | null>,
    src ? { type: "image", src, event } : undefined,
  );

  return <TrustImage {...props} src={thumbnail} cursor="pointer" ref={ref} onClick={show} />;
});

export function ImageGallery({ images, event }: { images: string[]; event?: NostrEvent }) {
  const photos = useMemo(() => {
    return images.map((img) => {
      const photo: PhotoWithoutSize = { src: img };
      return photo;
    });
  }, [images]);

  const rowMultiplier = useBreakpointValue({ base: 1.5, sm: 2, md: 3, lg: 4, xl: 5 }) ?? 4;

  return (
    <PhotoGallery
      layout="rows"
      photos={photos}
      renderPhoto={({ photo, imageProps, wrapperStyle }) => <EmbeddedImage {...imageProps} />}
      targetRowHeight={(containerWidth) => containerWidth / rowMultiplier}
    />
  );
}

// nevent1qqs8397rp8tt60f3lm8zldt8uqljuqw9axp8z79w0qsmj3r96lmg4tgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3zamnwvaz7tmwdaehgun4v5hxxmmd0mkwa9
export function embedImageGallery(content: EmbedableContent, event?: NostrEvent): EmbedableContent {
  return content
    .map((subContent, i) => {
      if (typeof subContent === "string") {
        const matches = Array.from(subContent.matchAll(getMatchLink()));

        const newContent: EmbedableContent = [];
        let lastBatchEnd = 0;
        let batch: RegExpMatchArray[] = [];

        const renderBatch = () => {
          if (batch.length > 1) {
            // render previous batch
            const lastMatchPosition = defaultGetLocation(batch[batch.length - 1]);
            const before = subContent.substring(lastBatchEnd, defaultGetLocation(batch[0]).start);
            const render = <ImageGallery images={batch.map((m) => m[0])} event={event} />;

            newContent.push(before, render);
            lastBatchEnd = lastMatchPosition.end;
          }

          batch = [];
        };

        for (const match of matches) {
          try {
            const url = new URL(match[0]);
            if (!isImageURL(url)) throw new Error("not an image");

            // if this is the first image, add it to the batch
            if (batch.length === 0) {
              batch = [match];
              continue;
            }

            const last = defaultGetLocation(batch[batch.length - 1]);
            const position = defaultGetLocation(match);
            const space = subContent.substring(last.end, position.start).trim();

            // if there was a non-space between this and the last batch
            if (space.length > 0) renderBatch();

            batch.push(match);
          } catch (e) {
            // start a new batch without current match
            batch = [];
          }
        }

        renderBatch();

        newContent.push(subContent.substring(lastBatchEnd));

        return newContent;
      }

      return subContent;
    })
    .flat();
}

// nostr:nevent1qqsfhafvv705g5wt8rcaytkj6shsshw3dwgamgfe3za8knk0uq4yesgpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqsrnltk
export function renderImageUrl(match: URL) {
  if (!isImageURL(match)) return null;

  return <EmbeddedImage src={match.toString()} maxH={["initial", "35vh"]} />;
}
