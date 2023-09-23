import { nip98 } from "nostr-tools";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";

type NostrBuildResponse = {
  status: "success" | "error";
  message: string;
  data: [
    {
      input_name: "APIv2";
      name: string;
      url: string;
      thumbnail: string;
      responsive: {
        "240p": string;
        "360p": string;
        "480p": string;
        "720p": string;
        "1080p": string;
      };
      blurhash: string;
      sha256: string;
      type: "picture" | "video";
      mime: string;
      size: number;
      metadata: Record<string, string>;
      dimensions: {
        width: number;
        height: number;
      };
    },
  ];
};

export async function nostrBuildUploadImage(image: File, sign?: (draft: DraftNostrEvent) => Promise<NostrEvent>) {
  if (!image.type.includes("image")) throw new Error("Only images are supported");

  const url = "https://nostr.build/api/v2/upload/files";

  const payload = new FormData();
  payload.append("fileToUpload", image);

  const headers: HeadersInit = {};
  if (sign) {
    // @ts-ignore
    const token = await nip98.getToken(url, "post", sign, true);
    headers.Authorization = token;
  }

  const response = await fetch(url, { body: payload, method: "POST", headers }).then(
    (res) => res.json() as Promise<NostrBuildResponse>,
  );

  return response.data[0];
}
