import { useEffect, useMemo, useState } from "react";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { AbstractRelay, Subscription, SubscriptionParams } from "nostr-tools/abstract-relay";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Heading, Spinner, Text } from "@chakra-ui/react";
import { LRU } from "tiny-lru";

import relayPoolService from "../../../services/relay-pool";
import ProfileSearchResults from "./profile-results";
import NoteSearchResults from "./note-results";
import ArticleSearchResults from "./article-results";
import { eventStore } from "../../../services/event-store";

function createSearchAction(url: string | AbstractRelay) {
  let sub: Subscription | undefined = undefined;

  let running = true;
  const search = async (filters: Filter[], params: Partial<SubscriptionParams>) => {
    running = true;
    const relay = typeof url === "string" ? await relayPoolService.requestRelay(url, false) : url;
    await relayPoolService.requestConnect(relay);

    sub = relay.subscribe(filters, {
      onevent: (event) => running && params.onevent?.(event),
      oneose: () => {
        sub?.close();
        params.oneose?.();
      },
      onclose: params.onclose,
    });
  };

  const cancel = () => {
    running = false;
    if (sub) sub.close();
  };

  return { search, cancel, relay: url };
}

const searchCache = new LRU<NostrEvent[]>(10);

export default function SearchResults({ query, relay }: { query: string; relay: string | AbstractRelay }) {
  const [results, setResults] = useState<NostrEvent[]>([]);

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error>();
  const search = useMemo(() => createSearchAction(relay), [relay]);

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
      search
        .search([{ search: query, kinds: [kinds.Metadata, kinds.ShortTextNote, kinds.LongFormArticle], limit: 200 }], {
          onevent: (event) => {
            event = eventStore.add(event, typeof search.relay === "string" ? search.relay : search.relay.url);

            setResults((arr) => {
              const newArr = [...arr, event];
              searchCache.set(query + relay, newArr);
              return newArr;
            });
          },
          oneose: () => setSearching(false),
        })
        .catch((err) => setError(err));

      return () => search.cancel();
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
