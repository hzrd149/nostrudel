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
import { Link as RouterLink } from "react-router-dom";

import { useReadRelays } from "../../../hooks/use-client-relays";
import { getPageSummary } from "../../../helpers/nostr/wiki";
import UserName from "../../../components/user/user-name";
import { getWebOfTrust } from "../../../services/web-of-trust";
import { getSharableEventAddress } from "../../../helpers/nip19";
import dictionaryService from "../../../services/dictionary";
import useSubject from "../../../hooks/use-subject";

export default function WikiLink({
  children,
  node,
  href,
  maxVersions = 4,
  topic,
  ...props
}: LinkProps & ExtraProps & { maxVersions?: number; topic?: string }) {
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
  const events = useSubject(subject);

  const sorted = useMemo(() => {
    if (!events) return [];
    const arr = getWebOfTrust().sortByDistanceAndConnections(Array.from(events.values()), (e) => e.pubkey);
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
  }, [events]);

  // if there is only one result, redirect to it
  const to = sorted?.length === 1 ? "/wiki/page/" + getSharableEventAddress(sorted[0]) : "/wiki/topic/" + topic;

  return (
    <Popover returnFocusOnClose={false} isOpen={isOpen} onClose={onClose} placement="top" closeOnBlur={true}>
      <PopoverTrigger>
        <Link as={RouterLink} color="blue.500" {...props} to={to} onMouseEnter={onOpen} onMouseLeave={onClose}>
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
