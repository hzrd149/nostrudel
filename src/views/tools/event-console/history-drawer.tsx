import { useRef, useState } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Input,
} from "@chakra-ui/react";
import ClockRewind from "../../../components/icons/clock-rewind";
import { CopyIconButton } from "../../../components/copy-icon-button";

type HistoryDrawerProps = Omit<DrawerProps, "children"> & {
  history: string[];
  onClear: () => void;
  onSelect: (item: string) => void;
};

export default function HistoryDrawer({ onClose, isOpen, history, onClear, onSelect }: HistoryDrawerProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");

  const filteredHistory = search.length > 1 ? history.filter((query) => query.includes(search)) : history;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} initialFocusRef={searchRef} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="2" pt="2" pb="0">
          <ClockRewind boxSize="6" /> History
        </DrawerHeader>

        <DrawerBody p="2" overflowX="hidden" overflowY="auto">
          <Input
            placeholder="Search"
            type="search"
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Flex direction="column" gap="2" mt="2">
            {filteredHistory.map((query) => (
              <Flex key={query} gap="2" alignItems="center">
                <Button
                  variant="ghost"
                  fontFamily="monospace"
                  fontWeight="normal"
                  fontSize="xs"
                  size="sm"
                  w="full"
                  justifyContent="flex-start"
                  onClick={() => onSelect(query)}
                >
                  {query}
                </Button>
                <CopyIconButton
                  text={query}
                  aria-label="Copy Filter"
                  title="Copy Filter"
                  size="xs"
                  ml="auto"
                  tabIndex={-1}
                />
              </Flex>
            ))}
          </Flex>
        </DrawerBody>

        <DrawerFooter p="2">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
