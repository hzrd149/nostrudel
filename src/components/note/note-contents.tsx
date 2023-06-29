import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import styled from "@emotion/styled";
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
import { useTrusted } from "./trust";
import { renderRedditUrl } from "../embed-types/reddit";

function buildContents(event: NostrEvent | DraftNostrEvent, trusted = false) {
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

const GradientOverlay = styled.div`
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
  const trusted = useTrusted();
  const content = buildContents(event, trusted);
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
          {content.map((part, i) =>
            typeof part === "string" ? (
              <Text as="span" key={"part-" + i}>
                {part}
              </Text>
            ) : (
              React.cloneElement(part, { key: "part-" + i })
            )
          )}
        </div>
        {showOverlay && <GradientOverlay onClick={expand?.onExpand} />}
      </Box>
    </ImageGalleryProvider>
  );
});
