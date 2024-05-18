import {
  MouseEvent,
  MouseEventHandler,
  MutableRefObject,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Code,
  Image,
  ImageProps,
  Link,
  LinkProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import {
  getHashFromURL,
  handleImageFallbacks,
  getServersFromServerListEvent,
  USER_BLOSSOM_SERVER_LIST_KIND,
} from "blossom-client-sdk";

import { EmbedableContent, defaultGetLocation } from "../../../helpers/embeds";
import { getMatchLink } from "../../../helpers/regexp";
import { useRegisterSlide } from "../../lightbox-provider";
import { isImageURL } from "../../../helpers/url";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";
import { NostrEvent } from "../../../types/nostr-event";
import useAppSettings from "../../../hooks/use-app-settings";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import useElementTrustBlur from "../../../hooks/use-element-trust-blur";
import { buildImageProxyURL } from "../../../helpers/image";
import ExpandableEmbed from "../expandable-embed";
import { useMediaOwnerContext } from "../../../providers/local/media-owner-provider";
import replaceableEventsService from "../../../services/replaceable-events";
import clientRelaysService from "../../../services/client-relays";

export type TrustImageProps = ImageProps;

export const TrustImage = forwardRef<HTMLImageElement, TrustImageProps>((props, ref) => {
  const { blurImages } = useAppSettings();
  const { onClick, style } = useElementTrustBlur();

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

export type EmbeddedImageProps = Omit<LinkProps, "children" | "href" | "onClick"> & {
  src?: string;
  event?: NostrEvent;
  imageProps?: TrustImageProps;
};

function getPubkeyMediaServers(pubkey?: string) {
  if (!pubkey) return;

  return new Promise<URL[] | undefined>((res) => {
    const sub = replaceableEventsService.requestEvent(
      clientRelaysService.readRelays.value,
      USER_BLOSSOM_SERVER_LIST_KIND,
      pubkey,
    );

    if (sub.value) res(getServersFromServerListEvent(sub.value));
    else {
      sub.once((event) => res(getServersFromServerListEvent(event)));
    }
  });
}

function useImageThumbnail(src?: string) {
  return (src && buildImageProxyURL(src, "512,fit")) ?? src;
}

export function EmbeddedImage({ src, event, imageProps, ...props }: EmbeddedImageProps) {
  const owner = useMediaOwnerContext();
  const thumbnail = useImageThumbnail(src);

  const ref = useRef<HTMLImageElement | null>(null);
  const { show } = useRegisterSlide(ref, src ? { type: "image", src, event } : undefined);
  const handleClick = useCallback<MouseEventHandler<HTMLElement>>(
    (e) => {
      !e.isPropagationStopped() && show();
      e.preventDefault();
    },
    [show],
  );

  useEffect(() => {
    if (ref.current) handleImageFallbacks(ref.current, getPubkeyMediaServers);
  }, []);

  // NOTE: the parent <div> has display=block and and <a> has inline-block
  // this is so that the <a> element can act like a block without being full width
  return (
    <div>
      <Link href={src} isExternal onClick={handleClick} display="inline-block" {...props}>
        <TrustImage
          {...imageProps}
          src={thumbnail}
          cursor="pointer"
          ref={ref}
          onClick={handleClick}
          data-pubkey={owner}
        />
      </Link>
    </div>
  );
}

export const GalleryImage = forwardRef<HTMLImageElement, EmbeddedImageProps>(
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
    <ExpandableEmbed label="Image Gallery" hideOnDefaultOpen urls={images}>
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

function VerifyImageButton({ src, original }: { src: URL; original: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const modal = useDisclosure();
  const [downloaded, setDownloaded] = useState<string>();
  const [matches, setMatches] = useState<boolean>();
  const verify = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      if (matches !== undefined) return modal.onOpen();

      setLoading(true);
      try {
        const buff = await fetch(src).then((res) => res.arrayBuffer());
        const downloaded = bytesToHex(sha256.create().update(new Uint8Array(buff)).digest());
        setDownloaded(downloaded);

        setMatches(original === downloaded);
      } catch (error) {
        if (error instanceof Error) toast({ status: "error", description: error.message });
      }
      setLoading(false);
    },
    [src, matches],
  );

  return (
    <>
      <Button
        onClick={verify}
        isLoading={loading}
        colorScheme={matches === undefined ? undefined : matches ? "green" : "red"}
      >
        [ {matches === undefined ? "Verify" : matches ? "Valid" : "Invalid!"} ]
      </Button>
      {modal.isOpen && downloaded && (
        <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Invalid Hash</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pb="4" pt="0">
              <Text fontWeight="bold">Original:</Text>
              <Code>{original}</Code>

              <Text fontWeight="bold">Downloaded:</Text>
              <Code>{downloaded}</Code>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

// nostr:nevent1qqsfhafvv705g5wt8rcaytkj6shsshw3dwgamgfe3za8knk0uq4yesgpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqsrnltk
export function renderImageUrl(match: URL) {
  if (!isImageURL(match)) return null;

  const hash = getHashFromURL(match);

  return (
    <ExpandableEmbed
      label="Image"
      url={match}
      actions={hash ? <VerifyImageButton src={match} original={hash} /> : undefined}
      hideOnDefaultOpen={!hash}
    >
      <EmbeddedImage src={match.toString()} imageProps={{ maxH: ["initial", "35vh"] }} />
    </ExpandableEmbed>
  );
}
