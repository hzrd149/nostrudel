import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Spacer,
  Switch,
  useDisclosure,
} from "@chakra-ui/react";
import Convert from "ansi-to-html";
import { useObservable } from "applesauce-react/hooks";

import Timestamp from "../../../../components/timestamp";
import SimpleView from "../../../../components/layout/presets/simple-view";
import ServicesTree from "./service-tree";
import useBakeryControl from "../../../../hooks/use-bakery-control";

const convert = new Convert();

export default function BakeryServiceLogsView() {
  const control = useBakeryControl();
  const [service, setService] = useState<string | undefined>(undefined);
  const logs = useObservable(control?.logs({ service })) ?? [];
  const raw = useDisclosure();
  const drawer = useDisclosure();

  const scrollBox = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollBox.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const closeToBottom = el.scrollTop > el.scrollHeight - rect.height - 128;
    if (closeToBottom || el.scrollTop === 0) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [logs]);

  useEffect(() => {
    scrollBox.current?.scrollTo({ top: scrollBox.current.scrollHeight });
  }, [logs?.length]);

  return (
    <SimpleView title="Service Logs" maxH="100vh">
      <Flex gap="4" alignItems="center" flexShrink={0}>
        <Button onClick={drawer.onOpen} hideFrom="2xl">
          Select Service
        </Button>
        <Spacer />
        <Switch isChecked={raw.isOpen} onChange={raw.onToggle}>
          Show Raw
        </Switch>
      </Flex>
      <Flex gap="2" overflow="hidden" h="full" flexGrow={1} mx={{ base: -4, md: 0 }} mb={{ base: -4, md: 0 }}>
        <Box
          overflow="auto"
          fontFamily="monospace"
          px={{ base: 2, md: 4 }}
          pt="2"
          pb="10"
          whiteSpace="nowrap"
          ref={scrollBox}
          flexGrow={1}
        >
          {logs &&
            Array.from(logs)
              .reverse()
              .map((entry) => (
                <p key={entry.timestamp + entry.message}>
                  <Timestamp
                    timestamp={Math.round(entry.timestamp / 1000)}
                    color="blue.500"
                    minW="2em"
                    display="inline-block"
                    userSelect="none"
                    mr="2"
                  />
                  {raw.isOpen ? (
                    entry.message
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: convert.toHtml(entry.message) }} />
                  )}
                </p>
              ))}
        </Box>
        <ServicesTree select={setService} selected={service} w="sm" hideBelow="2xl" flexShrink={0} />
      </Flex>

      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Select Service</DrawerHeader>

          <DrawerBody display="flex" flexDirection="column">
            <ServicesTree
              select={(service) => {
                drawer.onClose();
                setService(service);
              }}
              selected={service}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </SimpleView>
  );
}
