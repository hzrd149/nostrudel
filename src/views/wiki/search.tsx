import { Button, Flex, Heading, Input, Link } from "@chakra-ui/react";
import { getEventUID } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, Link as RouterLink } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { DEFAULT_SEARCH_RELAYS, WIKI_RELAYS } from "../../const";
import { WIKI_PAGE_KIND } from "../../helpers/nostr/wiki";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { eventStore } from "../../services/event-store";
import { sortByDistanceAndConnections } from "../../services/social-graph";
import { createSearchAction } from "../search/components/search-results";
import WikiPageResult from "./components/wiki-page-result";

export default function WikiSearchView() {
  const { value: query, setValue: setQuery } = useRouteSearchValue("q");
  if (!query) return <Navigate to="/wiki" />;

  const { register, handleSubmit } = useForm({ defaultValues: { search: query } });
  const onSubmit = handleSubmit((values) => {
    setQuery(values.search);
  });

  const [results, setResults] = useState<NostrEvent[]>([]);
  const search = useMemo(() => createSearchAction([...DEFAULT_SEARCH_RELAYS, ...WIKI_RELAYS]), []);

  useEffect(() => {
    setResults([]);

    const filter: Filter = { kinds: [WIKI_PAGE_KIND], search: query };

    const seen = new Set<string>();
    const handleEvent = (event: NostrEvent) => {
      if (seen.has(getEventUID(event))) return;
      setResults((arr) => arr.concat(event));
      seen.add(getEventUID(event));
    };

    const sub = search([filter]).subscribe((event) => {
      eventStore.add(event);
      handleEvent(event);
    });

    return () => sub.unsubscribe();
  }, [query, setResults]);

  const sorted = sortByDistanceAndConnections(results, (p) => p.pubkey);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Heading mr="4">
          <Link as={RouterLink} to="/wiki">
            Wikifreedia
          </Link>
        </Heading>
        <Flex gap="2" as="form" maxW="md" onSubmit={onSubmit} w="full">
          <Input
            {...register("search", { required: true })}
            type="search"
            name="search"
            autoComplete="on"
            w="sm"
            placeholder="Search Wikifreedia"
            isRequired
          />
          <Button type="submit" colorScheme="primary">
            Search
          </Button>
        </Flex>
      </Flex>
      {sorted.map((page) => (
        <ErrorBoundary key={page.id}>
          <WikiPageResult page={page} />
        </ErrorBoundary>
      ))}
    </VerticalPageLayout>
  );
}
