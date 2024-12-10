import { Box, Flex, FlexProps, IconButton, Spacer } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getMediaAttachments, MediaAttachment } from "applesauce-core/helpers/media-attachment";
import { Carousel, useCarousel } from "nuka-carousel";
import styled from "@emotion/styled";

import { TrustImage, TrustVideo } from "../content/links";
import { isImageURL, isVideoURL } from "applesauce-core/helpers";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import ZapBubbles from "../note/timeline-note/components/zap-bubbles";

function CustomArrows() {
  const { currentPage, totalPages, wrapMode, goBack, goForward } = useCarousel();

  const allowWrap = wrapMode === "wrap";
  const enablePrevNavButton = allowWrap || currentPage > 0;
  const enableNextNavButton = allowWrap || currentPage < totalPages - 1;

  return (
    <Flex justifyContent="space-between" position="absolute" top="50%" right="0" left="0">
      <IconButton
        icon={<ChevronLeftIcon boxSize={8} />}
        onClick={goBack}
        aria-label="previous image"
        variant="ghost"
        h="24"
        w="12"
        isDisabled={!enablePrevNavButton}
      >
        PREV
      </IconButton>
      <IconButton
        icon={<ChevronRightIcon boxSize={8} />}
        onClick={goForward}
        aria-label="next image"
        variant="ghost"
        h="24"
        w="12"
        isDisabled={!enableNextNavButton}
      >
        NEXT
      </IconButton>
    </Flex>
  );
}

function cls(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
function PageIndicators() {
  const { totalPages, currentPage, goToPage } = useCarousel();

  const className = (index: number) =>
    cls("nuka-page-indicator", currentPage === index ? "nuka-page-indicator-active" : "");

  return (
    <div className="nuka-page-container" data-testid="pageIndicatorContainer">
      {[...Array(totalPages)].map((_, index) => (
        <button key={index} onClick={() => goToPage(index)} className={className(index)}>
          <span className="nuka-hidden">{index + 1}</span>
        </button>
      ))}
    </div>
  );
}

function MediaAttachmentSlide({ media }: { media: MediaAttachment }) {
  if (media.type?.startsWith("video/") || isVideoURL(media.url)) {
    return <TrustVideo src={media.url} poster={media.image} aria-description={media.alt} />;
  } else if (media.type?.startsWith("image/") || isImageURL(media.url)) {
    return <TrustImage src={media.url} alt={media.alt} maxH="full" />;
  }

  return (
    <Box aspectRatio={1} minW="lg">
      Unknown media type {media.type ?? "Unknown"}
    </Box>
  );
}

const CustomCarousel = styled(Carousel)`
  & {
    height: 100%;
    overflow: hidden;
  }

  .nuka-slide-container {
    height: 100%;
    overflow: hidden;
  }

  .nuka-overflow {
    overflow-x: scroll;
    overflow-y: hidden;
    height: 100%;
  }

  .nuka-wrapper {
    height: 100%;
  }
`;

export default function MediaPostSlides({
  post,
  showZaps = true,
  ...props
}: { post: NostrEvent; showZaps?: boolean } & Omit<FlexProps, "children">) {
  const attachments = getMediaAttachments(post);

  if (attachments.length === 1)
    return (
      <Flex gap="2" direction="column" {...props}>
        <Flex justifyContent="center" overflow="hidden" flexGrow={1} alignItems="flex-start">
          <MediaAttachmentSlide media={attachments[0]} />
        </Flex>
        {showZaps && <ZapBubbles event={post} px="2" />}
      </Flex>
    );

  return (
    <Flex gap="2" direction="column" {...props}>
      <CustomCarousel
        scrollDistance="screen"
        showDots
        arrows={<CustomArrows />}
        showArrows
        dots={
          <Flex gap="2" justifyContent="space-between" alignItems="center" px="2">
            {showZaps && <ZapBubbles event={post} />}
            <Spacer />
            <PageIndicators />
          </Flex>
        }
      >
        {attachments.map((media) => (
          <MediaAttachmentSlide key={media.sha256 || media.url} media={media} />
        ))}
      </CustomCarousel>
    </Flex>
  );
}
