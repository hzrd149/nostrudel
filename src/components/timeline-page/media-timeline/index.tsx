import React, { useMemo, useRef } from "react";
import { Box, IconButton, Link } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { TimelineLoader } from "../../../classes/timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { matchLink } from "../../../helpers/regexp";
import { LightboxProvider, useRegisterSlide } from "../../lightbox-provider";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getSharableNoteId } from "../../../helpers/nip19";
import { ExternalLinkIcon } from "../../icons";
import { isImageURL } from "../../../helpers/url";

type ImagePreview = { eventId: string; src: string; index: number };

const ImagePreview = React.memo(({ image }: { image: ImagePreview }) => {
  const navigate = useNavigate();

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, image.eventId);

  const { show } = useRegisterSlide(ref, { type: "image", src: image.src });

  return (
    <Link
      href={image.src}
      position="relative"
      onClick={(e) => {
        if (image.src) {
          e.preventDefault();
          show();
        }
      }}
    >
      <Box
        aspectRatio={1}
        backgroundImage={`url(${image.src})`}
        backgroundSize="cover"
        backgroundPosition="center"
        ref={ref}
      />
      <IconButton
        icon={<ExternalLinkIcon />}
        aria-label="Open note"
        position="absolute"
        right="2"
        top="2"
        size="sm"
        colorScheme="brand"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/n/${getSharableNoteId(image.eventId)}`);
        }}
      />
    </Link>
  );
});

export default function MediaTimeline({ timeline }: { timeline: TimelineLoader }) {
  const events = useSubject(timeline.timeline);

  const images = useMemo(() => {
    var images: { eventId: string; src: string; index: number }[] = [];

    for (const event of events) {
      const urls = event.content.matchAll(matchLink);

      let i = 0;
      for (const match of urls) {
        if (isImageURL(match[0])) images.push({ eventId: event.id, src: match[0], index: i++ });
      }
    }

    return images;
  }, [events]);

  return (
    <LightboxProvider>
      {images.map((image) => (
        <ImagePreview key={image.eventId + "-" + image.index} image={image} />
      ))}
    </LightboxProvider>
  );
}
