import { useCallback, useEffect, useMemo } from "react";
import { ButtonGroup, Flex, IconButton, Input, Select } from "@chakra-ui/react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { useForm } from "react-hook-form";

import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import { CopyToClipboardIcon, SearchIcon, SettingsIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider from "../../providers/local/people-list-provider";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import SearchResults from "./components/search-results";
import useSearchRelays from "../../hooks/use-search-relays";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { localRelay } from "../../services/local-relay";
import WasmRelay from "../../services/wasm-relay";
import relayPoolService from "../../services/relay-pool";

export function SearchPage() {
  const navigate = useNavigate();
  const searchRelays = useSearchRelays();
  const { info: localRelayInfo } = useRelayInfo(localRelay instanceof AbstractRelay ? localRelay : undefined, true);
  const localSearchSupported =
    localRelay instanceof WasmRelay ||
    (localRelay instanceof AbstractRelay && !!localRelayInfo?.supported_nips?.includes(50));

  const autoFocusSearch = useBreakpointValue({ base: false, lg: true });

  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("q") || "";

  const relayURL = params.get("relay");
  let searchRelay = useMemo(() => {
    if (relayURL === "local") return localRelay;
    else if (relayURL) return relayPoolService.requestRelay(relayURL);
    else if (localSearchSupported) return localRelay;
    else return relayPoolService.requestRelay(searchRelays[0]);
  }, [relayURL, localSearchSupported, localRelay, searchRelays[0]]);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { query: searchQuery, relay: searchRelay === localRelay ? "local" : searchRelay?.url },
    mode: "all",
  });

  // reset the relay when the search relay changes
  useEffect(
    () => setValue("relay", searchRelay === localRelay ? "local" : searchRelay?.url),
    [searchRelay, localRelay],
  );

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
      setParams(newParams);
    }
  });

  const shouldSearch = searchQuery && searchRelay;

  return (
    <VerticalPageLayout>
      <Flex as="form" gap="2" wrap="wrap" onSubmit={submit}>
        <ButtonGroup>
          <QRCodeScannerButton onData={handleSearchText} />
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
        <Select w="auto" {...register("relay")}>
          {localSearchSupported && <option value="local">Local Relay</option>}
          {searchRelays.map((url) => (
            <option key={url} value={url}>
              {url}
            </option>
          ))}
        </Select>
        <ButtonGroup>
          <IconButton type="submit" aria-label="Search" icon={<SearchIcon boxSize={5} />} colorScheme="primary" />
          <IconButton
            as={RouterLink}
            type="button"
            aria-label="Advanced"
            icon={<SettingsIcon boxSize={5} />}
            to="/relays/search"
          />
        </ButtonGroup>
      </Flex>

      <Flex direction="column" gap="2">
        {shouldSearch ? <SearchResults relay={searchRelay as AbstractRelay} query={searchQuery} /> : null}
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
