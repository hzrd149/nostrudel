import { ButtonGroup, Flex, IconButton, Input } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import { CopyToClipboardIcon, SearchIcon, SettingsIcon } from "../../components/icons";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import useSearchRelays, { useCacheRelaySupportsSearch } from "../../hooks/use-search-relays";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import PeopleListProvider from "../../providers/local/people-list-provider";
import { eventCache$ } from "../../services/event-cache";
import SearchRelayPicker from "./components/search-relay-picker";
import SearchResults from "./components/search-results";

export function SearchPage() {
  const eventCache = useObservableEagerState(eventCache$);
  const navigate = useNavigate();
  const searchRelays = useSearchRelays();
  const localSearchSupported = useCacheRelaySupportsSearch();

  const autoFocusSearch = useBreakpointValue({ base: false, lg: true });

  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("q") || "";

  const relay = params.get("relay") ?? (localSearchSupported ? "" : undefined) ?? searchRelays[0] ?? "";

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { query: searchQuery, relay },
    mode: "all",
  });

  // when the relay changes update the form
  useEffect(() => {
    setValue("relay", relay);
  }, [relay]);

  const handleSearchText = (text: string) => {
    const cleanText = text.trim();

    if (cleanText.startsWith("nostr:") || cleanText.startsWith("web+nostr:") || safeDecode(text)) {
      navigate({ pathname: "/l/" + encodeURIComponent(text) }, { replace: true });
      return true;
    }

    const hashTagMatch = getMatchHashtag().exec(cleanText);
    if (hashTagMatch) {
      navigate({ pathname: "/t/" + hashTagMatch[2].toLocaleLowerCase() }, { replace: true });
      return true;
    }

    return false;
  };

  const readClipboard = useCallback(async () => {
    handleSearchText(await navigator.clipboard.readText());
  }, []);

  // set the search when the form is submitted
  const submit = handleSubmit((values) => {
    if (!handleSearchText(values.query)) {
      const newParams = new URLSearchParams(params);
      newParams.set("q", values.query);
      if (values.relay) newParams.set("relay", values.relay);
      else newParams.delete("relay");
      setParams(newParams);
    }
  });

  const shouldSearch = !!searchQuery && (!!relay || (localSearchSupported && !!eventCache?.search));

  return (
    <VerticalPageLayout>
      <Flex as="form" gap="2" wrap="wrap" onSubmit={submit}>
        <ButtonGroup>
          <QRCodeScannerButton onResult={handleSearchText} />
          {!!navigator.clipboard?.readText && (
            <IconButton
              onClick={readClipboard}
              icon={<CopyToClipboardIcon boxSize={5} />}
              aria-label="Read clipboard"
            />
          )}
        </ButtonGroup>
        <Input
          type="search"
          isRequired
          autoFocus={autoFocusSearch}
          w="auto"
          flexGrow={1}
          {...register("query", { required: true, minLength: 3 })}
          autoComplete="off"
        />
        <SearchRelayPicker {...register("relay")} showLocal />
        <ButtonGroup>
          <IconButton type="submit" aria-label="Search" icon={<SearchIcon boxSize={5} />} colorScheme="primary" />
          <IconButton
            as={RouterLink}
            type="button"
            aria-label="Advanced"
            icon={<SettingsIcon boxSize={5} />}
            to="/settings/search"
          />
        </ButtonGroup>
      </Flex>

      <Flex direction="column" gap="2">
        {shouldSearch ? <SearchResults relay={relay} query={searchQuery} /> : null}
      </Flex>
    </VerticalPageLayout>
  );
}

export default function SearchView() {
  return (
    <PeopleListProvider initList="global">
      <SearchPage />
    </PeopleListProvider>
  );
}
