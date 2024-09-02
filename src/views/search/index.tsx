import { useCallback, useEffect } from "react";
import { ButtonGroup, Flex, IconButton, Input, Select } from "@chakra-ui/react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";

import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import { CopyToClipboardIcon, SearchIcon, SettingsIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider from "../../providers/local/people-list-provider";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import { useForm } from "react-hook-form";
import SearchResults from "./components/search-results";
import useSearchRelays from "../../hooks/use-search-relays";

export function SearchPage() {
  const navigate = useNavigate();
  const searchRelays = useSearchRelays();

  const autoFocusSearch = useBreakpointValue({ base: false, lg: true });

  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("q") || "";
  const searchRelay = params.get("relay") || searchRelays[0];

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { query: searchQuery, relay: searchRelay },
    mode: "all",
  });

  // reset the relay when the search relay changes
  useEffect(() => setValue("relay", searchRelay), [searchRelay]);

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
      newParams.set("relay", values.relay);
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
        {shouldSearch ? <SearchResults relay={searchRelay} query={searchQuery} /> : null}
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
