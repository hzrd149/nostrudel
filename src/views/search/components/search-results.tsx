import { Alert, AlertDescription, AlertIcon, AlertTitle, Heading, Spinner, Text } from "@chakra-ui/react";
import { mapEventsToStore } from "applesauce-core";
import { LRU } from "applesauce-core/helpers";
import { onlyEvents } from "applesauce-relay";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Observable } from "rxjs";

import { eventCache$ } from "../../../services/event-cache";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";
import { lookupUsers, SearchResult } from "../../../services/user-lookup";
import useAsyncAction from "../../../hooks/use-async-action";
import ArticleSearchResults from "./article-results";
import NoteSearchResults from "./note-results";
import ProfileSearchResults from "./profile-results";

export function createSearchAction(relays?: string[]): (filters: Filter[]) => Observable<NostrEvent> {
  return (filters: Filter[]) => {
    // search local
    if (!relays || relays.length === 0) {
      if (!eventCache$.value) throw new Error("No event cache");
      if (!eventCache$.value.search) throw new Error("Event cache does not support search");

      return eventCache$.value.search(filters).pipe(mapEventsToStore(eventStore));
    }

    // search remote
    return pool.request(relays, filters).pipe(onlyEvents(), mapEventsToStore(eventStore));
  };
}

const searchCache = new LRU<NostrEvent[]>(10);
const profileSearchCache = new LRU<SearchResult[]>(10);

export default function SearchResults({ query, relay }: { query: string; relay: string }) {
  const [results, setResults] = useState<NostrEvent[]>([]);
  const [profileResults, setProfileResults] = useState<SearchResult[]>([]);

  const [searching, setSearching] = useState(false);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [error, setError] = useState<Error>();
  const search = useMemo(() => createSearchAction(relay ? [relay] : []), [relay]);

  // Search for profiles using username-search service
  const { loading: loadingProfiles, run: searchProfiles } = useAsyncAction(async (searchQuery: string) => {
    const results = await lookupUsers(searchQuery, 20);
    return results;
  }, []);

  useEffect(() => {
    if (query.length < 3) return;

    setError(undefined);

    // Search for profiles using username-search service
    if (profileSearchCache.has(query)) {
      const cached = profileSearchCache.get(query)!;
      setProfileResults(cached);
      setSearchingProfiles(false);
    } else {
      setProfileResults([]);
      setSearchingProfiles(true);
      searchProfiles(query).then((results) => {
        if (results) {
          setProfileResults(results);
          profileSearchCache.set(query, results);
        }
        setSearchingProfiles(false);
      });
    }

    // Search for notes and articles using relay search
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
        { search: query, kinds: [kinds.ShortTextNote, kinds.LongFormArticle], limit: 200 },
      ]).subscribe((event) => {
        setResults((arr) => {
          const newArr = [...arr, event];
          searchCache.set(query + relay, newArr);
          return newArr;
        });
      });

      return () => sub.unsubscribe();
    }
  }, [query, search, searchProfiles]);

  const notes = results.filter((e) => e.kind === kinds.ShortTextNote);
  const articles = results.filter((e) => e.kind === kinds.LongFormArticle);

  const hasResults = profileResults.length > 0 || results.length > 0;
  const totalResults = profileResults.length + results.length;
  const allSearchesComplete = !searching && !searchingProfiles;

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

  // Show "nothing found" only if all searches are complete and there are no results
  if (!hasResults && allSearchesComplete) {
    return (
      <Heading size="md" mx="auto" my="10">
        Found nothing... :(
      </Heading>
    );
  }

  return (
    <>
      {(hasResults || searching || searchingProfiles) && (
        <Text>
          {hasResults ? (
            `Found ${totalResults} results`
          ) : (
            <>
              <Spinner size="sm" /> Searching...
            </>
          )}
        </Text>
      )}
      {profileResults.length > 0 && <ProfileSearchResults profiles={profileResults} />}
      {notes.length > 0 && <NoteSearchResults notes={notes} />}
      {articles.length > 0 && <ArticleSearchResults articles={articles} />}
    </>
  );
}
