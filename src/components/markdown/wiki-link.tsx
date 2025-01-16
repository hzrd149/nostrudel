import { useMemo } from "react";
import {
  Link,
  LinkProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ExtraProps } from "react-markdown";
import { getEventUID } from "nostr-idb";
import { Link as RouterLink } from "react-router";
import { useObservable } from "applesauce-react/hooks";

import { useReadRelays } from "../../hooks/use-client-relays";
import { getPageDefer, getPageSummary } from "../../helpers/nostr/wiki";
import UserName from "../user/user-name";
import dictionaryService from "../../services/dictionary";
import { useWebOfTrust } from "../../providers/global/web-of-trust-provider";

export default function WikiLink({
  children,
  node,
  href,
  maxVersions = 4,
  topic,
  ...props
}: LinkProps & ExtraProps & { maxVersions?: number; topic?: string }) {
  const webOfTrust = useWebOfTrust();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const readRelays = useReadRelays();

  if (node) {
    const properties = node.properties as { className: string; href: string };
    topic = properties.href.replace(/^#\/page\//, "");
  }

  const subject = useMemo(
    () => (topic ? dictionaryService.requestTopic(topic, readRelays) : undefined),
    [topic, readRelays],
  );
  const events = useObservable(subject);

  const sorted = useMemo(() => {
    if (!events) return [];

    let arr = Array.from(events.values());
    if (webOfTrust) arr = webOfTrust.sortByDistanceAndConnections(arr, (e) => e.pubkey);
    arr = arr.filter((p) => !getPageDefer(p));

    const seen = new Set<string>();
    const unique: NostrEvent[] = [];

    for (const event of arr) {
      const summary = getPageSummary(event);
      if (!seen.has(summary)) {
        seen.add(summary);
        unique.push(event);
        if (unique.length >= maxVersions) break;
      }
    }

    return unique;
  }, [events, maxVersions, webOfTrust]);

  return (
    <Popover returnFocusOnClose={false} isOpen={isOpen} onClose={onClose} placement="top" closeOnBlur={true}>
      <PopoverTrigger>
        <Link
          as={RouterLink}
          color="blue.500"
          {...props}
          to={"/wiki/topic/" + topic}
          onMouseEnter={onOpen}
          onMouseLeave={onClose}
        >
          {children}
        </Link>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w="lg">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="bold">{children}</PopoverHeader>
          <PopoverBody>
            {events === undefined && <Spinner />}
            {sorted.map((page) => (
              <Text key={getEventUID(page)} noOfLines={2} mb="2">
                <UserName pubkey={page.pubkey} />: {getPageSummary(page)}
              </Text>
            ))}
            {events?.size === 0 && <Text fontStyle="italic">There is no entry for this topic</Text>}
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
