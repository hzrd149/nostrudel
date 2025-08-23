import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { TrustImage, TrustVideo } from "../../../components/content/links";
import useUsersMediaServers from "../../../hooks/use-user-blossom-servers";
import STLViewer from "../../../components/stl-viewer";
import FileDownloadButton from "../components/download-button";

export default function FilePreview({ file }: { file: NostrEvent }) {
  const type = getTagValue(file, "m");
  const sha256 = getTagValue(file, "x");
  const servers = useUsersMediaServers(file.pubkey) || [];

  let url = getTagValue(file, "url");
  if (!url && servers && sha256 && servers.length > 0) url = new URL(sha256, servers[0]).toString();

  if (url) {
    if (type?.startsWith("image/")) return <TrustImage h="full" src={url} />;
    if (type?.startsWith("video/")) return <TrustVideo h="full" src={url} />;

    if (type === "model/stl")
      return <STLViewer aspectRatio={16 / 10} width={1920} height={1080} w="full" h="auto" url={url} />;
  }

  const image = getTagValue(file, "image");
  if (image) return <TrustImage h="full" src={image} />;

  return (
    <Alert
      status="info"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        No preview!
      </AlertTitle>
      <AlertDescription maxWidth="sm">There is no preview for {type} files</AlertDescription>
      <FileDownloadButton file={file} colorScheme="primary" mx="auto" mt="4" />
    </Alert>
  );
}
