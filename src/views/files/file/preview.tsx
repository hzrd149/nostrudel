import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import { TrustImage, TrustVideo } from "../../../components/content/links";
import useUsersMediaServers from "../../../hooks/use-user-blossom-servers";
import FileDownloadButton from "../components/download-button";
import { loadSTLViewerComponent } from "../../../helpers/stl-viewer-loader";
import { createRequestProxyUrl } from "../../../helpers/request";

function STLViewerWrapper({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const corsProxy = createRequestProxyUrl("").toString();

  useEffect(() => {
    loadSTLViewerComponent().then(() => setLoaded(true));
  }, []);

  if (!loaded) return <Box w="full" aspectRatio={16 / 10}>Loading viewer...</Box>;

  return (
    <Box w="full" aspectRatio={16 / 10}>
      <stl-viewer src={url} cors-proxy={corsProxy} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
}

export default function FilePreview({ file }: { file: NostrEvent }) {
  const type = getTagValue(file, "m");
  const sha256 = getTagValue(file, "x");
  const servers = useUsersMediaServers(file.pubkey) || [];

  let url = getTagValue(file, "url");
  if (!url && servers && sha256 && servers.length > 0) url = new URL(sha256, servers[0]).toString();

  if (url) {
    if (type?.startsWith("image/")) return <TrustImage h="full" src={url} />;
    if (type?.startsWith("video/")) return <TrustVideo h="full" src={url} />;

    if (type === "model/stl") return <STLViewerWrapper url={url} />;
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
