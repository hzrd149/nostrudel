import { Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import Play from "../../../components/icons/play";
import { LiveAudioPlayer } from "../../../components/live-audio-player";
import { getDownloadURL, getStreamURL, getWaveform } from "../../../helpers/nostr/stemstr";

export default function TrackPlayer({ track }: { track: NostrEvent }) {
  const streamUrl = getStreamURL(track);
  const downloadUrl = getDownloadURL(track);
  const waveform = getWaveform(track);

  const showPlayer = useDisclosure();

  if (!showPlayer.isOpen)
    return (
      <Flex
        gap="2px"
        h="20"
        alignItems="center"
        px="4"
        py="2"
        overflow="hidden"
        borderColor="primary.500"
        borderWidth="1px"
        borderRadius="lg"
        position="relative"
      >
        <IconButton aria-label="Play" mr="4" icon={<Play />} onClick={showPlayer.onOpen} size="md" variant="outline" />
        {waveform?.map((v, i) => <Box key={v + i} h={v + "%"} w="3px" bg="primary.800" />)}
      </Flex>
    );

  if (streamUrl) {
    return <LiveAudioPlayer stream={streamUrl.url} w="full" autoPlay h="20" />;
  } else if (downloadUrl) {
    return (
      <Box as="audio" controls w="full" autoPlay h="20">
        <source src={downloadUrl.url} type={downloadUrl.format} />
      </Box>
    );
  } else return null;
}
