import { Image, ImageProps, Link, LinkProps } from "@chakra-ui/react";
import {
  getHashFromURL,
  getServersFromServerListEvent,
  handleImageFallbacks,
  USER_BLOSSOM_SERVER_LIST_KIND,
} from "blossom-client-sdk";
import { NostrEvent } from "nostr-tools";
import { forwardRef, MouseEventHandler, useCallback, useEffect, useRef } from "react";

import { buildImageProxyURL } from "../../../helpers/image";
import { isImageURL } from "../../../helpers/url";
import useMediaBlur from "../../../hooks/use-media-blur";
import { useMediaOwnerContext } from "../../../providers/local/media-owner";
import { eventStore } from "../../../services/event-store";
import { useRegisterSlide } from "../../lightbox-provider";
import ExpandableEmbed from "../components/content-embed";
import { BlobDetailsButton } from "./common";

export type TrustImageProps = ImageProps;

export const TrustImage = forwardRef<HTMLImageElement, TrustImageProps>((props, ref) => {
  const { onClick, style } = useMediaBlur();

  const handleClick = useCallback<MouseEventHandler<HTMLImageElement>>(
    (e) => {
      onClick(e);
      if (props.onClick && !e.isPropagationStopped()) {
        props.onClick(e);
      }
    },
    [onClick, props.onClick],
  );

  return <Image {...props} onClick={handleClick} style={{ ...style, ...props.style }} ref={ref} />;
});

export type EmbeddedImageProps = Omit<LinkProps, "children" | "href" | "onClick"> & {
  src?: string;
  event?: NostrEvent;
  imageProps?: TrustImageProps;
};

export function getPubkeyMediaServers(pubkey?: string) {
  if (!pubkey) return;

  return new Promise<URL[] | undefined>((res) => {
    const event = eventStore.getReplaceable(USER_BLOSSOM_SERVER_LIST_KIND, pubkey);
    const servers = event && getServersFromServerListEvent(event);

    if (servers) res(servers);
  });
}

export function useImageThumbnail(src?: string) {
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

  return (
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
      actions={hash ? <BlobDetailsButton src={match} original={hash} zIndex={1} /> : undefined}
    >
      <EmbeddedImage src={match.toString()} imageProps={{ maxH: ["initial", "35vh"] }} />
    </ExpandableEmbed>
  );
}
