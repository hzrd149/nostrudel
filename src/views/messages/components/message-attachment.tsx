import { Box, Button, Image, Link, Spinner, Text } from "@chakra-ui/react";
import { isEncryptedFile, type FileMetadataFields } from "applesauce-common/helpers";
import { loadAttachment } from "applesauce-extra/messages";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import { catchError, concatWith, defer, finalize, from, map, NEVER, of } from "rxjs";

export default function MessageAttachment({ file }: { file: FileMetadataFields }) {
  const [attempt, retry] = useState(0);
  const source = use$(
    () =>
      defer(() => {
        const controller = new AbortController();
        let url: string | undefined;
        return (
          isEncryptedFile(file)
            ? from(loadAttachment(file, { signal: controller.signal })).pipe(
                map((blob) => ({ url: (url = URL.createObjectURL(blob)), error: undefined as string | undefined })),
              )
            : of({ url: file.url, error: undefined as string | undefined })
        ).pipe(
          catchError((error) => of({ url: undefined, error: error instanceof Error ? error.message : String(error) })),
          // Keep the object URL alive while rendered; finalize on unsubscription rather than download completion.
          concatWith(NEVER),
          finalize(() => {
            controller.abort();
            if (url) URL.revokeObjectURL(url);
          }),
        );
      }),
    [file, attempt],
  );
  if (!source) return <Spinner aria-label="Decrypting attachment" />;
  if (source.error || !source.url)
    return (
      <Box>
        <Text color="red.500">{source.error ?? "Missing attachment"}</Text>
        <Button onClick={() => retry(attempt + 1)}>Retry download</Button>
      </Box>
    );
  if (file.type?.startsWith("image/"))
    return <Image src={source.url} alt={file.alt ?? "Attachment"} maxH="24rem" objectFit="contain" />;
  if (file.type?.startsWith("video/")) return <Box as="video" src={source.url} controls maxH="24rem" maxW="full" />;
  if (file.type?.startsWith("audio/")) return <Box as="audio" src={source.url} controls maxW="full" />;
  return (
    <Link href={source.url} download>
      Download attachment
    </Link>
  );
}
