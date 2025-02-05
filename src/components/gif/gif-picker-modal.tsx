import { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
} from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { getEventUID, getTagValue } from "applesauce-core/helpers";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import SearchRelayPicker from "../../views/search/components/search-relay-picker";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { ListId, usePeopleListSelect } from "../../providers/local/people-list-provider";

function GifCard({ gif, onClick }: Omit<FlexProps, "children" | "onClick"> & { gif: NostrEvent; onClick: () => void }) {
  const url = getTagValue(gif, "url");
  const thumb = getTagValue(gif, "thumb");

  const ref = useEventIntersectionRef(gif);

  if (!url) return null;

  return (
    <Flex ref={ref} alignItems="center" justifyContent="center" position="relative">
      {/* <Flex direction="column" h="full">
        <UserAvatarLink pubkey={gif.pubkey} size="sm" />
        <SingleZapButton event={gif} showEventPreview={false} variant="ghost" size="sm" />
        <DebugEventButton event={gif} position="absolute" variant="ghost" size="sm" mt="auto" />
      </Flex> */}
      <button onClick={onClick}>
        <Image src={thumb || url} rounded="md" minH="20" minW="20" />
      </button>
    </Flex>
  );
}

type GifPickerProps = Omit<ModalProps, "children"> & { onSelect: (gif: NostrEvent) => void };

export default function GifPickerModal({ onClose, isOpen, onSelect, ...props }: GifPickerProps) {
  const [search, setSearch] = useState<string>();
  const [searchRelay, setSearchRelay] = useState<string>("");

  const [list, setList] = useState<ListId>("global");
  const { selected, setSelected, filter, listId } = usePeopleListSelect(list, setList);

  const [debounceSearch, setDebounceSearch] = useState<string>();
  useEffect(() => {
    setDebounceSearch(undefined);
    const t = setTimeout(() => setDebounceSearch(search), 600);

    return () => clearTimeout(t);
  }, [search, setDebounceSearch]);

  const baseFilter = {
    kinds: [kinds.FileMetadata],
    "#m": ["image/gif"],
    ...filter,
  };

  const readRelays = useReadRelays();
  const { loader, timeline } = useTimelineLoader(
    [listId, "gifs", searchRelay ?? "all", debounceSearch ?? "all"].join("-"),
    !!searchRelay ? [searchRelay] : readRelays,
    debounceSearch !== undefined ? { ...baseFilter, search: debounceSearch } : baseFilter,
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size={{ base: "full", md: "6xl" }} {...props}>
      <ModalOverlay />
      <IntersectionObserverProvider callback={callback}>
        <ModalContent>
          <ModalHeader p="2" pr="16">
            <Flex gap="2" wrap="wrap">
              <Input
                type="search"
                maxW="sm"
                placeholder="Search gifs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchRelayPicker value={searchRelay} onChange={(e) => setSearchRelay(e.target.value)} />
              <Button type="submit">Search</Button>
            </Flex>
            <ButtonGroup size="xs">
              <Button colorScheme={selected === "global" ? "primary" : undefined} onClick={() => setSelected("global")}>
                Global
              </Button>
              <Button
                colorScheme={selected === "following" ? "primary" : undefined}
                onClick={() => setSelected("following")}
              >
                Follows
              </Button>
              <Button colorScheme={selected === "self" ? "primary" : undefined} onClick={() => setSelected("self")}>
                Personal
              </Button>
            </ButtonGroup>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="4">
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="2">
              {timeline.map((gif) => (
                <GifCard
                  key={getEventUID(gif)}
                  gif={gif}
                  onClick={() => {
                    onSelect(gif);
                    onClose();
                  }}
                />
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </IntersectionObserverProvider>
    </Modal>
  );
}
