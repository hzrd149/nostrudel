import { useMemo, useRef, useState } from "react";
import { VisuallyHidden } from "@chakra-ui/react";
import SimpleMDE, { SimpleMDEReactProps } from "react-simplemde-editor";
import ReactDOMServer from "react-dom/server";
import { Global, css } from "@emotion/react";

import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import useUsersMediaServers from "../../../hooks/use-user-media-servers";
import useAppSettings from "../../../hooks/use-app-settings";
import useCurrentAccount from "../../../hooks/use-current-account";

import { CharkaMarkdown } from "../../../components/markdown/markdown";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { simpleMultiServerUpload } from "../../../helpers/media-upload/blossom";
import { stripSensitiveMetadataOnFile } from "../../../helpers/image";

const fixCodeMirrorFont = css`
  .EasyMDEContainer .CodeMirror {
    font-family: monospace !important;
  }
`;

export default function MarkdownEditor({ options, ...props }: SimpleMDEReactProps) {
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const { mediaUploadService } = useAppSettings();
  const { servers } = useUsersMediaServers(account?.pubkey);

  const [_, setPreview] = useState<HTMLElement>();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const customOptions = useMemo(() => {
    const uploads = mediaUploadService === "blossom";
    async function imageUploadFunction(file: File, onSuccess: (url: string) => void, onError: (error: string) => void) {
      if (!servers) return onError("No media servers set");
      try {
        const safeFile = await stripSensitiveMetadataOnFile(file);
        const blob = await simpleMultiServerUpload(servers, safeFile, requestSignature);

        if (blob) onSuccess(blob.url);
      } catch (error) {
        if (error instanceof Error) onError(error.message);
      }
    }

    return {
      minHeight: "60vh",
      uploadImage: uploads,
      imageUploadFunction: uploads ? imageUploadFunction : undefined,
      toolbar: [
        "undo",
        "redo",
        "|",
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "table",
        "code",
        "|",
        "link",
        "image",
        ...(uploads
          ? [
              {
                name: "upload-image",
                title: "Upload Image",
                className: "fa fa-upload",
                action: EasyMDE.drawUploadedImage,
              },
            ]
          : []),
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        "guide",
      ],
      previewRender(text, element) {
        return previewRef.current?.innerHTML || ReactDOMServer.renderToString(<CharkaMarkdown>{text}</CharkaMarkdown>);
      },
    } satisfies SimpleMDEReactProps["options"];
  }, [servers, requestSignature, setPreview]);

  return (
    <>
      <Global styles={fixCodeMirrorFont} />
      <SimpleMDE options={customOptions} {...props} />
      <VisuallyHidden>
        <CharkaMarkdown ref={previewRef}>{props.value ?? ""}</CharkaMarkdown>
      </VisuallyHidden>
    </>
  );
}
