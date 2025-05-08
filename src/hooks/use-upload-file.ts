import { FileMetadata } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";

import { stripSensitiveMetadataOnFile } from "~/helpers/image";
import { simpleMultiServerUpload } from "~/helpers/media-upload/blossom";
import { nostrBuildUploadImage } from "~/helpers/media-upload/nostr-build";
import { useSigningContext } from "~/providers/global/signing-provider";
import useAsyncAction from "./use-async-action";
import useAppSettings from "./use-user-app-settings";
import useUsersMediaServers from "./use-user-media-servers";

export default function useUploadFile() {
  const account = useActiveAccount();
  const { mediaUploadService } = useAppSettings();
  const mediaServers = useUsersMediaServers(account?.pubkey) || [];
  const { requestSignature } = useSigningContext();

  return useAsyncAction(
    async (file: File): Promise<FileMetadata | undefined> => {
      const safeFile = await stripSensitiveMetadataOnFile(file);

      if (mediaUploadService === "blossom" && mediaServers.length) {
        const blob = await simpleMultiServerUpload(
          mediaServers.map((s) => s.toString()),
          safeFile,
          requestSignature,
        );

        const nip94: string[][] = Reflect.get(blob, "nip94") || [];

        return {
          url: blob.url,
          type: blob.type || safeFile.type || nip94.find((t) => t[0] === "m")?.[1],
          size: blob.size,
          sha256: blob.sha256,
          dimensions: nip94.find((t) => t[0] === "dim")?.[1],
          blurhash: nip94.find((t) => t[0] === "blurhash")?.[1],
          magnet: nip94.find((t) => t[0] === "magnet")?.[1],
          thumbnail: nip94.find((t) => t[0] === "thumb")?.[1],
        };
      } else if (mediaUploadService === "nostr.build") {
        const response = await nostrBuildUploadImage(safeFile, requestSignature);

        return {
          url: response.url,
          type: response.mime || safeFile.type,
          size: response.size || safeFile.size,
          sha256: response.sha256,
          dimensions: `${response.dimensions.width}x${response.dimensions.height}`,
          blurhash: response.blurhash,
          thumbnail: response.thumbnail,
        };
      }
    },
    [mediaServers, mediaUploadService],
  );
}
