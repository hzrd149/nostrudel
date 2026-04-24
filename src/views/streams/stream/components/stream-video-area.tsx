import { Box, BoxProps, Flex, Heading, Text } from "@chakra-ui/react";
import { isStreamURL, isVideoURL } from "applesauce-core/helpers";
import { Stream } from "applesauce-common/casts";
import { ReactNode } from "react";

import LiveVideoPlayer from "../../../../components/live-video-player";
import Timestamp from "../../../../components/timestamp";

function Placeholder({ title, description, icon }: { title: string; description?: ReactNode; icon: string }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100%"
      w="100%"
      bg="black"
      color="white"
      gap="2"
      p="4"
      textAlign="center"
    >
      <Box fontSize="6xl" aria-hidden>
        {icon}
      </Box>
      <Heading size="md">{title}</Heading>
      {description && (
        <Text color="whiteAlpha.700" whiteSpace="pre-wrap">
          {description}
        </Text>
      )}
    </Flex>
  );
}

/**
 * Renders the main stream viewing area for a NIP-53 stream.
 *
 * Picks between the live player, a recording, or a status-specific placeholder
 * depending on the stream's status and available media.
 */
export default function StreamVideoArea({ cast, ...props }: Omit<BoxProps, "children"> & { cast: Stream }) {
  const image = cast.image;
  const status = cast.status;
  const videoStreams = cast.streamingVideos;
  const recording = cast.recording;
  const videoRecording = recording && (isVideoURL(recording) || isStreamURL(recording)) ? recording : undefined;

  const liveSrc = videoStreams[0];

  // Live: play the live stream
  if (status === "live" && liveSrc) {
    return <LiveVideoPlayer stream={liveSrc} autoPlay poster={image} {...props} />;
  }

  // Ended with a recording: play the recording
  if (status === "ended" && videoRecording) {
    return <LiveVideoPlayer stream={videoRecording} poster={image} {...props} />;
  }

  // Status-specific placeholders
  return (
    <Box {...props} bg="black" overflow="hidden" aspectRatio={16 / 9}>
      {status === "ended" ? (
        <Placeholder
          icon="📺"
          title="Stream has ended"
          description="This stream is no longer live and has no recording available."
        />
      ) : status === "planned" ? (
        <Placeholder
          icon="⏰"
          title="Stream is planned"
          description={
            cast.startTime ? (
              <>
                Starts <Timestamp timestamp={cast.startTime} as="span" />
              </>
            ) : (
              "This stream hasn't started yet."
            )
          }
        />
      ) : (
        <Placeholder icon="❌" title="No stream available" description="No streaming URL found for this stream." />
      )}
    </Box>
  );
}
