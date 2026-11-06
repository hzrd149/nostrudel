import { Box, Link } from "@chakra-ui/react";
import { BlossomURI } from "applesauce-content/nast";
import { ReactNode, useEffect, useState } from "react";

import { isAudioURL, isImageURL, isStreamURL, isVideoURL } from "../../../helpers/url";
import { getContentBlobUrls } from "../../../helpers/nostr/blossom";
import useAsyncAction from "../../../hooks/use-async-action";
import { useMediaOwnerContext } from "../../../providers/local/media-owner";
import { EmbeddedImage, getPubkeyMediaServers } from "../links/image";
import { TrustVideo, renderStreamUrl } from "../links/video";
import ExpandableEmbed from "./content-embed";

/** Resolve BUD-10 hints before passing a URL to browsers, proxies, or the lightbox. */
export function BlossomLink({ uri, children, embed = false }: { uri: string; children?: ReactNode; embed?: boolean }) {
  const owner = useMediaOwnerContext();
  const [resolved, setResolved] = useState<{ uri: string; urls: string[] }>();
  const [index, setIndex] = useState(0);
  const { run } = useAsyncAction(() => getContentBlobUrls(uri, getPubkeyMediaServers, owner), [uri, owner]);

  useEffect(() => {
    let active = true;
    void run().then((urls) => {
      if (active && urls) {
        setResolved({ uri, urls });
        setIndex(0);
      }
    });
    return () => {
      active = false;
    };
  }, [run, uri]);

  const src = resolved?.uri === uri ? resolved.urls[index] : undefined;
  const link = (
    <Link href={src} isExternal color="blue.500">
      {children ?? uri}
    </Link>
  );
  if (!embed || !src) return link;

  const next = () => {
    if (resolved && index + 1 < resolved.urls.length) setIndex(index + 1);
  };
  const url = new URL(src);
  if (isStreamURL(url)) return renderStreamUrl(url);
  if (isImageURL(url))
    return (
      <ExpandableEmbed label="Image" raw={link}>
        <EmbeddedImage src={src} imageProps={{ maxH: ["initial", "35vh"], onError: next }} />
      </ExpandableEmbed>
    );
  if (isVideoURL(url))
    return (
      <ExpandableEmbed label="Video" raw={link}>
        <TrustVideo src={src} maxH="lg" w="auto" onError={next} />
      </ExpandableEmbed>
    );
  if (isAudioURL(url))
    return (
      <ExpandableEmbed label="Audio" raw={link}>
        <Box as="audio" src={src} controls maxW="full" onError={next} />
      </ExpandableEmbed>
    );
  return link;
}

export default function BlossomContent({ node }: { node: BlossomURI }) {
  return <BlossomLink uri={node.raw} embed />;
}

export function BlossomContentLink({ node }: { node: BlossomURI }) {
  return <BlossomLink uri={node.raw} />;
}
