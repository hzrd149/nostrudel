import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  IconButton,
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useAsync } from "react-use";
import { LightningIcon, QrCodeIcon } from "../../components/icons";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity";
import ZapModal from "../../components/zap-modal";
import { convertTimestampToDate } from "../../helpers/date";
import { truncatedId } from "../../helpers/nostr-event";
import QrScannerModal from "../../components/qr-scanner-modal";

type relay = string;
type NostrBandSearchResults = {
  query: string;
  page: number;
  page_size: number;
  nip05_count: number;
  timeline: any[];
  page_count: number;
  result_count: number;
  serp: any[];
  people_count: number;
  people: [
    {
      i: number;
      pubkey: string;
      name: string;
      about: string;
      picture: string;
      nip05: string;
      nip05_verified: boolean;
      website: string;
      display_name: string;
      lud06: string;
      lud16: string;
      lud06_url: string;
      first_tm: number;
      last_tm: number;
      last_tm_str: string;
      followed_count: number;
      following_count: number;
      zappers: number;
      zap_amount: number;
      zapped_pubkeys: number;
      zap_amount_sent: number;
      zap_amount_processed: number;
      zapped_pubkeys_processed: number;
      zappers_processed: number;
      twitter?: {
        verified: boolean;
        verify_event: string;
        handle: string;
        name: string;
        bio: string;
        picture: string;
        followers: number;
        tweet: string;
      };
      relays: number[];
    }
  ];
  relays: Record<number | string, relay>;
};

export default function SearchView() {
  const navigate = useNavigate();
  const { isOpen: donateOpen, onOpen: openDonate, onClose: closeDonate } = useDisclosure();
  const { isOpen: qrScannerOpen, onOpen: openScanner, onClose: closeScanner } = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // update the input value when search changes
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  // set the search when the form is submitted
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSearchParams({ q: search }, { replace: true });
  };

  // fetch search data from nostr.band
  const { value: searchResults, loading } = useAsync(async () => {
    if (!searchParams.has("q")) return;
    return await fetch(`https://nostr.realsearch.cc/nostr?method=search&count=10&q=${searchParams.get("q")}`).then(
      (res) => res.json() as Promise<NostrBandSearchResults>
    );
  }, [searchParams.get("q")]);

  // handle data from qr code scanner
  const handleQrCodeData = (text: string) => {
    // if its a nostr: link pass it on the the link handler
    if (text.startsWith("nostr:")) {
      navigate({ pathname: "/nostr-link", search: `q=${text}` }, { replace: true });
    } else {
      setSearchParams({ q: text }, { replace: true });
    }
  };

  return (
    <Flex direction="column" overflowX="hidden" overflowY="auto" height="100%" p="2" gap="2">
      <QrScannerModal isOpen={qrScannerOpen} onClose={closeScanner} onData={handleQrCodeData} />

      <form onSubmit={handleSubmit}>
        <Flex gap="2">
          <IconButton onClick={openScanner} icon={<QrCodeIcon />} aria-label="Qr Scanner" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" isLoading={loading}>
            Search
          </Button>
        </Flex>
      </form>

      {searchResults && (
        <Flex gap="2" alignItems="center" justifyContent="center">
          <Text>Find what you where looking for?</Text>
          <Button leftIcon={<LightningIcon color="yellow.400" />} size="sm" onClick={openDonate} flexShrink={0}>
            Support Creator
          </Button>
          {donateOpen && (
            <ZapModal
              isOpen={donateOpen}
              pubkey="3356de61b39647931ce8b2140b2bab837e0810c0ef515bbe92de0248040b8bdd"
              initialAmount={500}
              initialComment="Thanks for creating nostr.band"
              onClose={closeDonate}
            />
          )}
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {searchResults?.people.map((person) => (
          <Card key={person.pubkey} overflow="hidden" variant="outline" size="sm">
            <CardHeader display="flex" gap="4" alignItems="flex-start">
              <UserAvatarLink pubkey={person.pubkey} />
              <Flex alignItems="center" gap="2">
                <Heading size="md" overflow="hidden">
                  {person.name || truncatedId(person.pubkey)}
                </Heading>
                <UserDnsIdentityIcon pubkey={person.pubkey} onlyIcon />
              </Flex>
              <Button
                as={RouterLink}
                variant="solid"
                colorScheme="blue"
                to={`/u/${person.pubkey}`}
                size="sm"
                ml="auto"
                flexShrink={0}
              >
                View Profile
              </Button>
            </CardHeader>
            <CardBody py={0}>
              <Text>{person.about}</Text>
            </CardBody>
            <CardFooter display="flex" gap="2">
              <Text>{person.followed_count} Followers</Text>
              <Text>Created: {convertTimestampToDate(person.first_tm).toLocaleDateString()}</Text>
            </CardFooter>
          </Card>
        ))}
      </Flex>
    </Flex>
  );
}
