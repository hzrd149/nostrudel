import { useCallback, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  IconButton,
  Image,
  Input,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useAsync } from "react-use";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { NostrEvent } from "../../../types/nostr-event";
import { formatBytes } from "../../../helpers/number";
import { CopyIconButton } from "../../../components/copy-icon-button";
import Timestamp from "../../../components/timestamp";
import { SatelliteCDNFile, getAccount, getAccountAuthToken, uploadFile } from "../../../helpers/satellite-cdn";
import FileDeleteButton from "./delete-file-button";
import { matchSorter } from "match-sorter";
import ShareFileButton from "./share-file-button";
import { DownloadIcon, TorrentIcon } from "../../../components/icons";

function FileUploadButton() {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const handleInputChange = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const upload = await uploadFile(file, requestSignature);
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [requestSignature],
  );

  return (
    <>
      <Input
        type="file"
        hidden
        ref={inputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleInputChange(e.target.files[0]);
        }}
      />
      <Button colorScheme="primary" onClick={() => inputRef.current?.click()} isLoading={loading}>
        Upload File
      </Button>
    </>
  );
}

function FileRow({ file }: { file: SatelliteCDNFile }) {
  return (
    <>
      <Tr>
        <Td>
          <Link isExternal href={file.url}>
            {file.name}
          </Link>
          <CopyIconButton text={file.url} aria-label="Copy URL" title="Copy URL" size="xs" variant="ghost" ml="2" />
        </Td>
        <Td isNumeric>{formatBytes(file.size)}</Td>
        <Td>{file.type}</Td>
        <Td>
          <Timestamp timestamp={file.created} />
        </Td>
        <Td isNumeric>
          <ButtonGroup size="sm" variant="ghost">
            <ShareFileButton file={file} />
            <IconButton
              as={Link}
              href={file.url}
              icon={<DownloadIcon />}
              aria-label="Download"
              download={file.name}
              isExternal
            />
            <IconButton as={Link} href={file.magnet} icon={<TorrentIcon />} aria-label="Open Magnet" isExternal />
            <FileDeleteButton file={file} />
          </ButtonGroup>
        </Td>
      </Tr>
    </>
  );
}

function FilesTable({ files }: { files: SatelliteCDNFile[] }) {
  return (
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th isNumeric>Size</Th>
            <Th>Type</Th>
            <Th>Created</Th>
            <Th isNumeric />
          </Tr>
        </Thead>
        <Tbody>
          {files.map((file) => (
            <FileRow key={file.sha256} file={file} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export default function SatelliteCDNView() {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const [authToken, setAuthToken] = useState<NostrEvent>();

  const { value: account, loading: isLoadingAccount } = useAsync(
    async () => authToken && (await getAccount(authToken)),
    [authToken],
  );

  const [loading, setLoading] = useState(false);
  const handleAuthClick = useCallback(async () => {
    setLoading(true);
    try {
      setAuthToken(await getAccountAuthToken(requestSignature));
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  }, [requestSignature]);

  const [search, setSearch] = useState("");

  const renderContent = () => {
    if (!account)
      return (
        <Button
          onClick={handleAuthClick}
          mx="auto"
          px="10"
          my="8"
          colorScheme="primary"
          isLoading={loading || isLoadingAccount}
          autoFocus
        >
          Unlock Account
        </Button>
      );

    if (search) {
      const filteredFiles = account.files.filter((f) =>
        f.name.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
      );
      const sortedFiles = matchSorter(filteredFiles, search.toLocaleLowerCase().trim(), { keys: ["name"] });
      return <FilesTable files={sortedFiles} />;
    } else return <FilesTable files={account.files} />;
  };

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Image src="https://satellite.earth/image.png" w="12" />
        <Heading>Satellite CDN</Heading>
        <ButtonGroup ml="auto">
          <Button
            as={Link}
            href="https://github.com/lovvtide/satellite-web/blob/master/docs/cdn.md"
            isExternal
            variant="ghost"
          >
            View Docs
          </Button>
          <FileUploadButton />
        </ButtonGroup>
      </Flex>
      {account && (
        <Flex gap="2">
          <Input
            type="Search"
            placeholder="Search files"
            w={{ base: "full", md: "md" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Flex>
      )}
      {renderContent()}
    </VerticalPageLayout>
  );
}
