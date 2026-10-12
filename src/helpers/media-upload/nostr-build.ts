import { EventTemplate, NostrEvent, nip98 } from "nostr-tools";

import { NOSTR_BUILD_UPLOAD_URL } from "../../const";

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
      type: "picture" | "video" | "audio";
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

export async function nostrBuildUploadImage(file: File, sign?: (draft: EventTemplate) => Promise<NostrEvent>) {
  if (!(file.type.includes("image") || file.type.includes("video") || file.type.includes("audio")))
    throw new Error("Unsupported file type");

  const payload = new FormData();
  payload.append("fileToUpload", file);

  const headers: HeadersInit = {};
  if (sign) {
    const token = await nip98.getToken(NOSTR_BUILD_UPLOAD_URL, "POST", sign, true);
    headers.Authorization = token;
  }

  const response = await fetch(NOSTR_BUILD_UPLOAD_URL, { body: payload, method: "POST", headers }).then(
    (res) => res.json() as Promise<NostrBuildResponse>,
  );

  return response.data[0];
}
