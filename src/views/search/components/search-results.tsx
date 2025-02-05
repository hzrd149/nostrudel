import { useEffect, useMemo, useState } from "react";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Heading, Spinner, Text } from "@chakra-ui/react";
import { map, Observable } from "rxjs";
import { LRU } from "applesauce-core/helpers";

import ProfileSearchResults from "./profile-results";
import NoteSearchResults from "./note-results";
import ArticleSearchResults from "./article-results";
import { eventStore } from "../../../services/event-store";
import { createRxOneshotReq, EventPacket } from "rx-nostr";
import rxNostr from "../../../services/rx-nostr";
import { cacheRequest } from "../../../services/cache-relay";

export function createSearchAction(relays?: string[]): (filters: Filter[]) => Observable<EventPacket> {
  return (filters: Filter[]) => {
    // search local
    if (!relays || relays.length === 0)
      return cacheRequest(filters).pipe(
        map(
          (event) =>
            ({
              event,
              from: "",
              subId: "cache",
              type: "EVENT",
              message: ["EVENT", "cache", event],
            }) as EventPacket,
        ),
      );

    // search remote
    const req = createRxOneshotReq({ filters });
    return rxNostr.use(req, { on: { relays } });
  };
}

const searchCache = new LRU<NostrEvent[]>(10);

export default function SearchResults({ query, relay }: { query: string; relay: string }) {
  const [results, setResults] = useState<NostrEvent[]>([]);

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error>();
  const search = useMemo(() => createSearchAction(relay ? [relay] : []), [relay]);

  useEffect(() => {
    if (query.length < 3) return;

    setError(undefined);
    if (searchCache.has(query + relay)) {
      // restore search from cache
      const events = searchCache.get(query + relay)!;
      setResults(events);
      setSearching(false);
    } else {
      // run a new search
      setResults([]);
      setSearching(true);

      const sub = search([
        { search: query, kinds: [kinds.Metadata, kinds.ShortTextNote, kinds.LongFormArticle], limit: 200 },
      ]).subscribe((packet) => {
        const event = eventStore.add(packet.event, packet.from);

        setResults((arr) => {
          const newArr = [...arr, event];
          searchCache.set(query + relay, newArr);
          return newArr;
        });
      });

      return () => sub.unsubscribe();
    }
  }, [query, search]);

  const profiles = results.filter((e) => e.kind === kinds.Metadata);
  const notes = results.filter((e) => e.kind === kinds.ShortTextNote);
  const articles = results.filter((e) => e.kind === kinds.LongFormArticle);

  if (searching && results.length === 0) {
    return (
      <Heading size="md" mx="auto" my="10">
        <Spinner /> Searching relay...
      </Heading>
    );
  }

  if (error) {
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          {error.name}
        </AlertTitle>
        <AlertDescription maxWidth="sm" whiteSpace="pre">
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (results.length === 0) {
    return (
      <Heading size="md" mx="auto" my="10">
        Found nothing... :(
      </Heading>
    );
  }

  return (
    <>
      {results.length > 0 && <Text>Found {results.length} results</Text>}
      {profiles.length > 0 && <ProfileSearchResults profiles={profiles} />}
      {notes.length > 0 && <NoteSearchResults notes={notes} />}
      {articles.length > 0 && <ArticleSearchResults articles={articles} />}
    </>
  );
}
