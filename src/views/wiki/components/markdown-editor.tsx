import { VisuallyHidden } from "@chakra-ui/react";
import { Global, css } from "@emotion/react";
import { useMemo, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import SimpleMDE, { SimpleMDEReactProps } from "react-simplemde-editor";
import { useActiveAccount } from "applesauce-react/hooks";

import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import useAppSettings from "../../../hooks/use-user-app-settings";
import useUsersMediaServers from "../../../hooks/use-user-media-servers";

import { CharkaMarkdown } from "../../../components/markdown/markdown";
import { stripSensitiveMetadataOnFile } from "../../../helpers/image";
import { simpleMultiServerUpload } from "../../../helpers/media-upload/blossom";
import { useSigningContext } from "../../../providers/global/signing-provider";

const fixCodeMirrorFont = css`
  .EasyMDEContainer .CodeMirror {
    font-family: monospace !important;
  }
`;

export default function MarkdownEditor({ options, ...props }: SimpleMDEReactProps) {
  const account = useActiveAccount();
  const { requestSignature } = useSigningContext();
  const { mediaUploadService } = useAppSettings();
  const servers = useUsersMediaServers(account?.pubkey);

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
