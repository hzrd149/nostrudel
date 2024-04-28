import {
  Code,
  Heading,
  HeadingProps,
  Image,
  Link,
  LinkProps,
  ListItem,
  OrderedList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Spinner,
  Table,
  TableContainer,
  TableProps,
  Tbody,
  Td,
  Text,
  TextProps,
  Tfoot,
  Th,
  Thead,
  Tr,
  UnorderedList,
  useDisclosure,
} from "@chakra-ui/react";
import styled from "@emotion/styled";
import { NostrEvent } from "nostr-tools";
import { forwardRef, useCallback, useMemo, useState } from "react";
import Markdown, { Components, ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import wikiLinkPlugin from "remark-wiki-link";
import { Link as RouterLink } from "react-router-dom";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { subscribeMany } from "../../../helpers/relay";
import { WIKI_PAGE_KIND, getPageSummary } from "../../../helpers/nostr/wiki";
import replaceableEventsService from "../../../services/replaceable-events";
import { getEventUID } from "nostr-idb";
import UserName from "../../../components/user/user-name";
import { getWebOfTrust } from "../../../services/web-of-trust";
import { getSharableEventAddress } from "../../../helpers/nip19";

const StyledMarkdown = styled(Markdown)`
  pre > code {
    display: block;
    padding-block: var(--chakra-space-2);
    padding-inline: var(--chakra-space-4);
  }
`;

function H1({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h1" size="2xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H2({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h2" size="xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H3({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h3" size="lg" mt="4" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H4({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h4" size="md" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H5({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h5" size="sm" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H6({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h6" size="xs" my="2" {...props}>
      {children}
    </Heading>
  );
}

const MAX_VERSIONS = 4;
function WikiLink({ children, node, href, ...props }: LinkProps & ExtraProps) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const readRelays = useReadRelays();

  const properties = node!.properties as { className: string; href: string };
  const topic = properties.href.replace(/^#\/page\//, "");

  const [events, setEvents] = useState<NostrEvent[]>();

  const load = useCallback(() => {
    const arr: NostrEvent[] = [];

    const sub = subscribeMany(Array.from(readRelays), [{ kinds: [WIKI_PAGE_KIND], "#d": [topic] }], {
      onevent: (event) => {
        replaceableEventsService.handleEvent(event);
        if (event.content) arr.push(event);
      },
      oneose: () => {
        setEvents(arr);
        sub.close();
      },
    });
  }, [topic, setEvents, readRelays]);

  const open = useCallback(() => {
    if (!events) load();
    onOpen();
  }, [onOpen, events]);

  const sorted = useMemo(() => {
    if (!events) return [];
    const arr = getWebOfTrust().sortByDistanceAndConnections(events, (e) => e.pubkey);
    const seen = new Set<string>();
    const unique: NostrEvent[] = [];

    for (const event of arr) {
      const summary = getPageSummary(event);
      if (!seen.has(summary)) {
        seen.add(summary);
        unique.push(event);
        if (unique.length >= MAX_VERSIONS) break;
      }
    }

    return unique;
  }, [events]);

  // if there is only one result, redirect to it
  const to = events?.length === 1 ? "/wiki/page/" + getSharableEventAddress(events[0]) : "/wiki/topic/" + topic;

  return (
    <Popover returnFocusOnClose={false} isOpen={isOpen} onClose={onClose} placement="top" closeOnBlur={true}>
      <PopoverTrigger>
        <Link as={RouterLink} color="blue.500" {...props} to={to} onMouseEnter={open} onMouseLeave={onClose}>
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
            {events?.length === 0 && <Text fontStyle="italic">There is no entry for this topic</Text>}
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
function A({ children, node, href, ...props }: LinkProps & ExtraProps) {
  const properties: { className?: string; href?: string } | undefined = node?.properties;

  if (properties?.className?.includes("internal") && properties.href) {
    return (
      <WikiLink href={href} node={node} {...props}>
        {children}
      </WikiLink>
    );
  }

  return (
    <Link color="blue.500" isExternal href={href} {...props}>
      {children}
    </Link>
  );
}
function P({ children, node, ...props }: TextProps & ExtraProps) {
  return (
    <Text my="2" {...props}>
      {children}
    </Text>
  );
}
function TableWithContainer({ children, node, ...props }: TableProps & ExtraProps) {
  return (
    <TableContainer>
      <Table size="sm" mb="4" {...props}>
        {children}
      </Table>
    </TableContainer>
  );
}

const components: Partial<Components> = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  a: A,
  img: Image,
  p: P,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  table: TableWithContainer,
  thead: Thead,
  tbody: Tbody,
  tfoot: Tfoot,
  tr: Tr,
  td: Td,
  th: Th,
  code: Code,
};

export const CharkaMarkdown = forwardRef<HTMLDivElement, { children: string }>(({ children }, ref) => {
  return (
    <div ref={ref}>
      <StyledMarkdown remarkPlugins={[remarkGfm, wikiLinkPlugin]} components={components}>
        {children}
      </StyledMarkdown>
    </div>
  );
});

export default function MarkdownContent({ event }: { event: NostrEvent }) {
  return <CharkaMarkdown>{event.content}</CharkaMarkdown>;
}
