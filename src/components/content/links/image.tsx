import { Image, ImageProps, Link, LinkProps } from "@chakra-ui/react";
import {
  getHashFromURL,
  getServersFromServerListEvent,
  handleMediaFallbacks,
  USER_BLOSSOM_SERVER_LIST_KIND,
} from "blossom-client-sdk";
import { defined } from "applesauce-core/observable";
import { NostrEvent } from "nostr-tools";
import { forwardRef, MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { firstValueFrom, map, of, timeout } from "rxjs";

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

const MEDIA_SERVERS_TIMEOUT = 2000;

export function getPubkeyMediaServers(pubkey?: string) {
  if (!pubkey) return;

  // Wait briefly for the server list to load, then give up so the fallback chain is not left hanging
  return firstValueFrom(
    eventStore.replaceable(USER_BLOSSOM_SERVER_LIST_KIND, pubkey).pipe(
      defined(),
      map((event) => getServersFromServerListEvent(event)),
      timeout({ first: MEDIA_SERVERS_TIMEOUT, with: () => of(undefined) }),
    ),
    { defaultValue: undefined },
  );
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
      if (!e.isPropagationStopped()) show();
      e.preventDefault();
    },
    [show],
  );

  useEffect(() => {
    if (ref.current) handleMediaFallbacks(ref.current, getPubkeyMediaServers);
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
