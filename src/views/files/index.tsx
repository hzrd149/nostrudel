import {
  Button,
  Checkbox,
  Code,
  Divider,
  Flex,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";
import { parseImageFile } from "../../helpers/nostr/files";
import BlurhashImage from "../../components/blurhash-image";
import { ErrorBoundary } from "../../components/error-boundary";
import useAppSettings from "../../hooks/use-app-settings";
import { useTrusted } from "../../providers/trust";
import BlurredImage from "../../components/blured-image";

const FILE_KIND = 1063;
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
const AUDIO_TYPES = ["audio/webm", "audio/wav", "audio/ogg"];
const TEXT_TYPES = ["text/plain"];

function ImageFile({ event }: { event: NostrEvent }) {
  const parsed = parseImageFile(event);
  const settings = useAppSettings();
  const trust = useTrusted();

  const shouldBlur = settings.blurImages && !trust;

  const showImage = useDisclosure();
  if (shouldBlur && parsed.blurhash && parsed.width && parsed.height && !showImage.isOpen) {
    const aspect = parsed.width / parsed.height;
    return (
      <BlurhashImage
        blurhash={parsed.blurhash}
        width={64 * aspect}
        height={64}
        onClick={showImage.onOpen}
        cursor="pointer"
        w="full"
      />
    );
  }

  const ImageComponent = shouldBlur ? BlurredImage : Image;
  return <ImageComponent src={parsed.url} w="full" />;
}

function FileType({ event }: { event: NostrEvent }) {
  const mimeType = event.tags.find((t) => t[0] === "m" && t[1])?.[1];

  if (!mimeType) throw new Error("missing MIME type");

  if (IMAGE_TYPES.includes(mimeType)) {
    return <ImageFile event={event} />;
  }
  return <Text>Unknown mine type {mimeType}</Text>;
}

export default function FilesView() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(IMAGE_TYPES);
  const toggleType = useCallback(
    (type: string) => {
      setSelectedTypes((arr) => {
        if (arr.includes(type)) {
          return arr.filter((t) => t !== type);
        } else return arr.concat(type);
      });
    },
    [setSelectedTypes]
  );

  const relays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    "files",
    relays,
    { kinds: [FILE_KIND], "#m": selectedTypes },
    { enabled: selectedTypes.length > 0 }
  );

  const events = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2" p="2">
      <Flex>
        <Popover>
          <PopoverTrigger>
            <Button>{selectedTypes.length} Selected types</Button>
          </PopoverTrigger>
          <PopoverContent w="xl">
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverBody>
              <Flex gap="4">
                <Flex gap="2" direction="column">
                  <Checkbox isDisabled>Images</Checkbox>
                  <Divider />
                  {IMAGE_TYPES.map((type) => (
                    <Checkbox key={type} isChecked={selectedTypes.includes(type)} onChange={() => toggleType(type)}>
                      {type}
                    </Checkbox>
                  ))}
                </Flex>
                <Flex gap="2" direction="column">
                  <Checkbox isDisabled>Videos</Checkbox>
                  <Divider />
                  {VIDEO_TYPES.map((type) => (
                    <Checkbox key={type} isChecked={selectedTypes.includes(type)} onChange={() => toggleType(type)}>
                      {type}
                    </Checkbox>
                  ))}
                </Flex>
                <Flex gap="2" direction="column">
                  <Checkbox isDisabled>Audio</Checkbox>
                  <Divider />
                  {AUDIO_TYPES.map((type) => (
                    <Checkbox key={type} isChecked={selectedTypes.includes(type)} onChange={() => toggleType(type)}>
                      {type}
                    </Checkbox>
                  ))}
                </Flex>
                <Flex gap="2" direction="column">
                  <Checkbox isDisabled>Text</Checkbox>
                  <Divider />
                  {TEXT_TYPES.map((type) => (
                    <Checkbox key={type} isChecked={selectedTypes.includes(type)} onChange={() => toggleType(type)}>
                      {type}
                    </Checkbox>
                  ))}
                </Flex>
              </Flex>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>

      <SimpleGrid minChildWidth="20rem" spacing="2">
        {events.map((event) => (
          <ErrorBoundary>
            <FileType key={event.id} event={event} />
            {/* <Code whiteSpace="pre">{JSON.stringify(event, null, 2)}</Code> */}
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </Flex>
  );
}
