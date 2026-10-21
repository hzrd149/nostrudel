import { Alert, AlertDescription, AlertIcon, AlertTitle, Heading, Spinner, Text } from "@chakra-ui/react";
import { LRU } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import { defer, from, mergeMap, Observable, of } from "rxjs";

import { createSearchAction } from "../../../services/search";
import { lookupUsers, SearchResult } from "../../../services/user-lookup";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import ArticleSearchResults from "./article-results";
import NoteSearchResults from "./note-results";
import ProfileSearchResults from "./profile-results";

const searchCache = new LRU<NostrEvent[]>(10);
const profileSearchCache = new LRU<SearchResult[]>(10);

type SearchState<T> = { results: T[]; loading: boolean; error?: Error };
const IDLE: SearchState<never> = { results: [], loading: false };

/** Collects a finite result stream into a growing list, marking it done on complete or error */
function collect<T>(source: Observable<T>, onDone?: (results: T[]) => void): Observable<SearchState<T>> {
  return new Observable((observer) => {
    const results: T[] = [];
    observer.next({ results: [], loading: true });
    return source.subscribe({
      next: (value) => {
        results.push(value);
        observer.next({ results: [...results], loading: true });
      },
      error: (err) => {
        observer.next({
          results: [...results],
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
        observer.complete();
      },
      complete: () => {
        onDone?.(results);
        observer.next({ results, loading: false });
        observer.complete();
      },
    });
  });
}

export default function SearchResults({ query, relay }: { query: string; relay: string }) {
  // Search for profiles using username-search service. use$ switches to the new
  // observable when the query changes, so stale lookups can't overwrite newer results.
  const profiles =
    use$(() => {
      if (query.length < 3) return of(IDLE);
      const cached = profileSearchCache.get(query);
      if (cached) return of<SearchState<SearchResult>>({ results: cached, loading: false });
      return collect(defer(() => from(lookupUsers(query, 20))).pipe(mergeMap((results) => results)), (results) =>
        profileSearchCache.set(query, results),
      );
    }, [query]) ?? IDLE;

  // Search for notes and articles using relay search
  const events =
    use$(() => {
      if (query.length < 3) return of(IDLE);
      const key = query + relay;
      const cached = searchCache.get(key);
      if (cached) return of<SearchState<NostrEvent>>({ results: cached, loading: false });
      const search = createSearchAction(relay ? [relay] : []);
      return collect(
        defer(() => search([{ search: query, kinds: [kinds.ShortTextNote, kinds.LongFormArticle], limit: 200 }])),
        (results) => searchCache.set(key, results),
      );
    }, [query, relay]) ?? IDLE;

  const profileResults = profiles.results;
  const results = events.results;
  const searching = events.loading;
  const searchingProfiles = profiles.loading;
  const error = events.error ?? profiles.error;

  const muteFilter = useClientSideMuteFilter();
  const visibleResults = useMemo(() => results.filter((e) => !muteFilter(e)), [results, muteFilter]);
  const notes = visibleResults.filter((e) => e.kind === kinds.ShortTextNote);
  const articles = visibleResults.filter((e) => e.kind === kinds.LongFormArticle);

  const hasResults = profileResults.length > 0 || visibleResults.length > 0;
  const totalResults = profileResults.length + visibleResults.length;
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
