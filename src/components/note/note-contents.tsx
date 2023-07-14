import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { css } from "@emotion/react";
import { useExpand } from "./expanded";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import {
  embedLightningInvoice,
  embedNostrLinks,
  embedNostrMentions,
  embedNostrHashtags,
  renderWavlakeUrl,
  renderYoutubeUrl,
  renderImageUrl,
  renderTwitterUrl,
  renderAppleMusicUrl,
  renderSpotifyUrl,
  renderTidalUrl,
  renderVideoUrl,
  embedEmoji,
  renderOpenGraphUrl,
} from "../embed-types";
import { ImageGalleryProvider } from "../image-gallery";
import { renderRedditUrl } from "../embed-types/reddit";
import EmbeddedContent from "../embeded-content";

function buildContents(event: NostrEvent | DraftNostrEvent) {
  let content: EmbedableContent = [event.content.trim()];

  // common
  content = embedUrls(content, [
    renderYoutubeUrl,
    renderTwitterUrl,
    renderRedditUrl,
    renderWavlakeUrl,
    renderAppleMusicUrl,
    renderSpotifyUrl,
    renderTidalUrl,
    renderImageUrl,
    renderVideoUrl,
    renderOpenGraphUrl,
  ]);

  // bitcoin
  content = embedLightningInvoice(content);

  // nostr
  content = embedNostrLinks(content);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);
  content = embedEmoji(content, event);

  return content;
}

const gradientOverlayStyles = css`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, var(--chakra-colors-chakra-body-bg) 100%);
  cursor: pointer;
`;

export type NoteContentsProps = {
  event: NostrEvent | DraftNostrEvent;
  maxHeight?: number;
};

export const NoteContents = React.memo(({ event, maxHeight }: NoteContentsProps) => {
  const content = buildContents(event);
  const expand = useExpand();
  const [innerHeight, setInnerHeight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const testHeight = useCallback(() => {
    if (ref.current && maxHeight) {
      const rect = ref.current.getClientRects()[0];
      setInnerHeight(rect.height);
    }
  }, [maxHeight]);

  useEffect(() => {
    testHeight();
  }, [testHeight]);

  const showOverlay = !!maxHeight && !expand?.expanded && innerHeight > maxHeight;

  return (
    <ImageGalleryProvider>
      <Box
        whiteSpace="pre-wrap"
        maxHeight={!expand?.expanded ? maxHeight : undefined}
        position="relative"
        overflow={maxHeight && !expand?.expanded ? "hidden" : "initial"}
        onLoad={() => testHeight()}
        px="2"
      >
        <div ref={ref}>
          <EmbeddedContent content={content} />
        </div>
        {showOverlay && <Box css={gradientOverlayStyles} onClick={expand?.onExpand} />}
      </Box>
    </ImageGalleryProvider>
  );
});
