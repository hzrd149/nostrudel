import { createUploadService } from "@kehto/services";

import { stripSensitiveMetadataOnFile } from "../../helpers/image";
import { simpleMultiServerUpload } from "../../helpers/media-upload/blossom";
import accounts from "../accounts";

export type UploadConfig = {
  enabled: boolean;
  servers: string[];
};

function blobToFile(data: ArrayBuffer | Blob, filename: string | undefined, mimeType: string | undefined) {
  if (data instanceof File) return data;

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  return new File([blob], filename || "upload", { type: mimeType || blob.type });
}

export function createBlossomUploadService(getUpload: () => UploadConfig) {
  const initialUpload = getUpload();

  return createUploadService({
    uploadInfo: {
      rails: [
        {
          rail: "blossom",
          enabled: initialUpload.enabled,
          returns: ["url", "sha256", "size", "mimeType", "nip94"],
        },
      ],
    },
    uploader: {
      upload: async (request: any, ctx: any) => {
        const upload = getUpload();
        if (!upload.enabled) throw new Error("Blossom upload is not configured");
        if (request.rail && request.rail !== "blossom") throw new Error("Only Blossom uploads are supported");

        const account = accounts.active;
        if (!account) throw new Error("No active account to sign upload auth");

        ctx.onStatus({ ok: true, uploadId: ctx.uploadId, status: "uploading", rail: "blossom" });

        const file = await stripSensitiveMetadataOnFile(blobToFile(request.data, request.filename, request.mimeType));
        const blob = await simpleMultiServerUpload(upload.servers, file, account.signEvent.bind(account));
        const nip94 = (Reflect.get(blob, "nip94") || []) as string[][];

        return {
          ok: true,
          uploadId: ctx.uploadId,
          status: "complete",
          rail: "blossom",
          url: blob.url,
          fallbackUrls: upload.servers.map((server) => `${server.replace(/\/$/, "")}/${blob.sha256}`),
          sha256: blob.sha256,
          size: blob.size ?? file.size,
          mimeType: blob.type || file.type || nip94.find((tag) => tag[0] === "m")?.[1],
          nip94,
        };
      },
    },
  });
}
