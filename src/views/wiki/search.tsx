import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Flex, Heading, Input, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";
import { useForm } from "react-hook-form";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { subscribeMany } from "../../helpers/relay";
import { SEARCH_RELAYS } from "../../const";

export default function WikiSearchView() {
  const { value: query, setValue: setQuery } = useRouteSearchValue("q");
  if (!query) return <Navigate to="/wiki" />;

  const { register, handleSubmit } = useForm({ defaultValues: { search: query } });
  const onSubmit = handleSubmit((values) => {
    setQuery(values.search);
  });

  const [results, setResults] = useState<NostrEvent[]>([]);

  // useEffect(() => {
  //   const sub = subscribeMany([SEARCH_RELAYS]);
  // }, [query]);

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
    </VerticalPageLayout>
  );
}
