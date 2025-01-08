import { useState } from "react";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getTagValue } from "applesauce-core/helpers";
import { BlossomClient } from "blossom-client-sdk";
import { saveAs } from "file-saver";

import useUsersMediaServers from "../../../hooks/use-user-media-servers";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { DownloadIcon } from "../../../components/icons";

export default function FileDownloadButton({
  file,
  children,
  ...props
}: Omit<ButtonProps, "onClick"> & { file: NostrEvent }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { servers } = useUsersMediaServers(file.pubkey);
  const url = getTagValue(file, "url");
  const sha256 = getTagValue(file, "x");
  const name = getTagValue(file, "name");

  const { requestSignature } = useSigningContext();

  const download = async () => {
    setLoading(true);

    try {
      let blob: Blob | undefined = undefined;

      // download from url
      if (url)
        blob = await fetch(url).then(
          (res) => res.blob(),
          () => undefined,
        );

      // download from fallback
      const fallback = file.tags.filter((t) => t[0] === "fallback").map((t) => t[1]);
      if (!url && fallback.length > 0) {
        for (const url of fallback) {
          blob = await fetch(url).then(
            (res) => res.blob(),
            () => undefined,
          );

          if (blob) break;
        }
      }

      // attempt to download from users blossom servers
      if (!blob && servers.length > 0 && sha256) {
        for (const server of servers) {
          blob = await BlossomClient.downloadBlob(server, sha256, {
            onAuth: (server, hash) => BlossomClient.createGetAuth(requestSignature, hash),
          }).then(
            (res) => res.blob(),
            () => undefined,
          );

          if (blob) break;
        }
      }

      if (blob) await saveAs(blob, name || sha256 || "download");
      else throw new Error("Failed to download file");
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }

    setLoading(false);
  };

  return (
    <Button onClick={download} leftIcon={<DownloadIcon boxSize="1.2em" />} {...props}>
      {children || "Download"}
    </Button>
  );
}
