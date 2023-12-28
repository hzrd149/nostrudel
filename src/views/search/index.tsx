import { useCallback, useEffect, useState } from "react";
import { Button, ButtonGroup, Flex, IconButton, Input, Link, useDisclosure } from "@chakra-ui/react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { SEARCH_RELAYS } from "../../const";
import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import { CommunityIcon, CopyToClipboardIcon, NotesIcon, QrCodeIcon } from "../../components/icons";
import QrScannerModal from "../../components/qr-scanner-modal";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider from "../../providers/local/relay-selection-provider";
import VerticalPageLayout from "../../components/vertical-page-layout";
import User01 from "../../components/icons/user-01";
import Feather from "../../components/icons/feather";
import ProfileSearchResults from "./profile-results";
import NoteSearchResults from "./note-results";
import ArticleSearchResults from "./article-results";
import CommunitySearchResults from "./community-results";
import PeopleListProvider from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useRouteSearchValue from "../../hooks/use-route-search-value";

export function SearchPage() {
  const navigate = useNavigate();
  const qrScannerModal = useDisclosure();

  const typeParam = useRouteSearchValue("type", "users");
  const queryParam = useRouteSearchValue("q", "");

  const [searchInput, setSearchInput] = useState(queryParam.value);

  // update the input value when search changes
  useEffect(() => {
    setSearchInput(queryParam.value);
  }, [queryParam.value]);

  const handleSearchText = (text: string) => {
    const cleanText = text.trim();

    if (cleanText.startsWith("nostr:") || cleanText.startsWith("web+nostr:") || safeDecode(text)) {
      navigate({ pathname: "/l/" + encodeURIComponent(text) }, { replace: true });
      return;
    }

    const hashTagMatch = getMatchHashtag().exec(cleanText);
    if (hashTagMatch) {
      navigate({ pathname: "/t/" + hashTagMatch[2].toLocaleLowerCase() }, { replace: true });
      return;
    }

    queryParam.setValue(cleanText);
  };

  const readClipboard = useCallback(async () => {
    handleSearchText(await navigator.clipboard.readText());
  }, []);

  // set the search when the form is submitted
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleSearchText(searchInput);
  };

  let SearchResults = ProfileSearchResults;
  switch (typeParam.value) {
    case "users":
      SearchResults = ProfileSearchResults;
      break;
    case "notes":
      SearchResults = NoteSearchResults;
      break;
    case "articles":
      SearchResults = ArticleSearchResults;
      break;
    case "communities":
      SearchResults = CommunitySearchResults;
      break;
  }

  return (
    <VerticalPageLayout>
      <QrScannerModal isOpen={qrScannerModal.isOpen} onClose={qrScannerModal.onClose} onData={handleSearchText} />

      <form onSubmit={handleSubmit}>
        <Flex gap="2" wrap="wrap">
          <Flex gap="2" grow={1}>
            <IconButton onClick={qrScannerModal.onOpen} icon={<QrCodeIcon />} aria-label="Qr Scanner" />
            {!!navigator.clipboard?.readText && (
              <IconButton onClick={readClipboard} icon={<CopyToClipboardIcon />} aria-label="Read clipboard" />
            )}
            <Input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <Button type="submit">Search</Button>
          </Flex>
        </Flex>
      </form>

      <Flex gap="2">
        <PeopleListSelection size="sm" />
        <ButtonGroup size="sm" isAttached variant="outline" flexWrap="wrap">
          <Button
            leftIcon={<User01 />}
            colorScheme={typeParam.value === "users" ? "primary" : undefined}
            onClick={() => typeParam.setValue("users")}
          >
            Users
          </Button>
          <Button
            leftIcon={<NotesIcon />}
            colorScheme={typeParam.value === "notes" ? "primary" : undefined}
            onClick={() => typeParam.setValue("notes")}
          >
            Notes
          </Button>
          <Button
            leftIcon={<Feather />}
            colorScheme={typeParam.value === "articles" ? "primary" : undefined}
            onClick={() => typeParam.setValue("articles")}
          >
            Articles
          </Button>
          <Button
            leftIcon={<CommunityIcon />}
            colorScheme={typeParam.value === "communities" ? "primary" : undefined}
            onClick={() => typeParam.setValue("communities")}
          >
            Communities
          </Button>
        </ButtonGroup>
        <RelaySelectionButton ml="auto" size="sm" />
      </Flex>

      <Flex direction="column" gap="4">
        {queryParam.value ? (
          <SearchResults search={queryParam.value} />
        ) : (
          <Link isExternal href="https://nostr.band" color="blue.500" mx="auto">
            Advanced Search
          </Link>
        )}
      </Flex>
    </VerticalPageLayout>
  );
}

export default function SearchView() {
  return (
    <RelaySelectionProvider overrideDefault={SEARCH_RELAYS}>
      <PeopleListProvider initList="global">
        <SearchPage />
      </PeopleListProvider>
    </RelaySelectionProvider>
  );
}
