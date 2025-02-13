import { useCallback, useState } from "react";
import { stripSensitiveMetadataOnFile } from "../helpers/image";
import { nostrBuildUploadImage } from "../helpers/media-upload/nostr-build";
import { useToast } from "@chakra-ui/react";
import useUsersMediaServers from "./use-user-media-servers";
import { useSigningContext } from "../providers/global/signing-provider";
import { useActiveAccount } from "applesauce-react/hooks";
import useAppSettings from "./use-user-app-settings";
import { simpleMultiServerUpload } from "~/helpers/media-upload/blossom";

export default function useUploadFile() {
  const toast = useToast();
  const account = useActiveAccount();
  const { mediaUploadService } = useAppSettings();
  const { servers: mediaServers } = useUsersMediaServers(account?.pubkey);
  const { requestSignature } = useSigningContext();

  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      let imageUrl: string | undefined = undefined;

      setUploading(true);
      try {
        const safeFile = await stripSensitiveMetadataOnFile(file);
        if (mediaUploadService === "nostr.build") {
          const response = await nostrBuildUploadImage(safeFile, requestSignature);
          imageUrl = response.url;
        } else if (mediaUploadService === "blossom" && mediaServers.length) {
          const blob = await simpleMultiServerUpload(
            mediaServers.map((s) => s.toString()),
            safeFile,
            requestSignature,
          );
          imageUrl = blob.url;
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);

      return imageUrl;
    },
    [toast, setUploading, mediaServers, mediaUploadService],
  );

  return {
    uploadFile,
    uploading,
  };
}
