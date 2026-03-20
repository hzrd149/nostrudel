import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Progress,
  Textarea,
  VisuallyHiddenInput,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { unzipSync } from "fflate";
import { parse as parseTOML } from "smol-toml";
import { EventTemplate, nip19 } from "nostr-tools";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { usePublishEvent } from "../../providers/global/publish-provider";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUsersMediaServers from "../../hooks/use-user-blossom-servers";
import { simpleMultiServerUpload } from "../../helpers/media-upload/blossom";
import { WEBXDC_KIND, WEBXDC_MIME_TYPE } from "../../helpers/nostr/webxdc";

type FormValues = {
  name: string;
  summary: string;
  imageUrl: string;
};

export default function NewWebxdcView() {
  const account = useActiveAccount();
  const navigate = useNavigate();
  const publish = usePublishEvent();

  const { mediaUploadService } = useAppSettings();
  const mediaServers = useUsersMediaServers(account?.pubkey) || [];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedName, setExtractedName] = useState<string>("");
  const [extractedImage, setExtractedImage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
    defaultValues: { name: "", summary: "", imageUrl: "" },
  });

  const signer = async (draft: EventTemplate) => {
    if (!account) throw new Error("No account");
    return await account.signEvent(draft);
  };

  /** When a .xdc file is selected, read its manifest to pre-fill form fields */
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);

    try {
      const buf = await file.arrayBuffer();
      const unzipped = unzipSync(new Uint8Array(buf));

      // Try to read manifest.toml for metadata (standard webxdc metadata file)
      let name = file.name.replace(/\.xdc$/i, "");
      let icon: string | undefined;

      const manifestBytes = unzipped["manifest.toml"];
      if (manifestBytes) {
        try {
          const text = new TextDecoder().decode(manifestBytes);
          const manifest = parseTOML(text);
          if (typeof manifest.name === "string") name = manifest.name;
        } catch {
          // Silently ignore malformed TOML
        }
      }

      // Try to extract icon.png or icon.jpg
      const iconPng = unzipped["icon.png"];
      const iconJpg = unzipped["icon.jpg"] ?? unzipped["icon.jpeg"];
      const iconBytes = iconPng ?? iconJpg;
      if (iconBytes && iconBytes.length > 0) {
        const isPng = !!iconPng;
        const mimeType = isPng ? "image/png" : "image/jpeg";
        const blob = new Blob([iconBytes.buffer as ArrayBuffer], { type: mimeType });
        icon = URL.createObjectURL(blob);
        setExtractedImage(icon);
      }

      setExtractedName(name);
      setValue("name", name);
      if (icon) setValue("imageUrl", ""); // will be uploaded separately
    } catch {
      // Non-fatal: fall back to filename
      const name = file.name.replace(/\.xdc$/i, "");
      setExtractedName(name);
      setValue("name", name);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedFile) return;
    setUploadError(null);

    try {
      if (mediaUploadService !== "blossom" || mediaServers.length === 0) {
        throw new Error("Blossom media servers are required to upload .xdc files. Please configure them in Settings.");
      }

      setUploadProgress(10);

      // Compute SHA-256 hash of the .xdc file for integrity verification
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const sha256 = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setUploadProgress(30);

      // Create a File object with the correct MIME type for blossom
      const xdcFile = new File([selectedFile], selectedFile.name, { type: WEBXDC_MIME_TYPE });

      // Upload to blossom
      const blob = await simpleMultiServerUpload(
        mediaServers.map((s) => s.toString()),
        xdcFile,
        signer,
      );

      setUploadProgress(80);

      // Generate a unique webxdc coordination identifier
      const webxdcId = nanoid();

      // Build the kind 1063 file metadata event
      const tags: string[][] = [
        ["url", blob.url],
        ["m", WEBXDC_MIME_TYPE],
        ["x", sha256],
        ["webxdc", webxdcId],
        ["alt", `Webxdc app: ${values.name}`],
      ];

      if (values.name) tags.push(["name", values.name]);
      if (values.summary) tags.push(["summary", values.summary]);
      if (values.imageUrl) tags.push(["image", values.imageUrl]);
      if (selectedFile.size) tags.push(["size", String(selectedFile.size)]);

      const draft: EventTemplate = {
        kind: WEBXDC_KIND,
        content: values.summary || "",
        tags,
        created_at: dayjs().unix(),
      };

      const pub = await publish("Publish Webxdc App", draft);
      setUploadProgress(100);

      if (pub) navigate(`/webxdc/${nip19.noteEncode(pub.event.id)}`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
      setUploadProgress(null);
    }
  });

  return (
    <VerticalPageLayout as="form" onSubmit={onSubmit}>
      <Heading size="lg">Share Webxdc App</Heading>

      {!account && (
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>You need to be signed in to share webxdc apps.</AlertDescription>
        </Alert>
      )}

      {uploadError && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* File picker */}
      <FormControl isRequired>
        <FormLabel>Webxdc App File (.xdc)</FormLabel>
        <VisuallyHiddenInput
          type="file"
          accept=".xdc,application/x-webxdc,application/zip"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        <Flex gap="2" alignItems="center">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            {selectedFile ? "Change File" : "Select .xdc File"}
          </Button>
          {selectedFile && (
            <span>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </Flex>
        <FormHelperText>Select a .xdc webxdc app file to share</FormHelperText>
      </FormControl>

      {/* App name */}
      <FormControl isRequired>
        <FormLabel>App Name</FormLabel>
        <Input placeholder={extractedName || "Chess"} {...register("name", { required: true })} />
        <FormHelperText>Display name for the app</FormHelperText>
      </FormControl>

      {/* Description */}
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          placeholder="A collaborative chess game. Play with friends over Nostr!"
          rows={4}
          {...register("summary")}
        />
      </FormControl>

      {/* Icon / thumbnail */}
      <FormControl>
        <FormLabel>Icon URL</FormLabel>
        <Input type="url" placeholder="https://example.com/icon.png" {...register("imageUrl")} />
        <FormHelperText>
          Optional URL to an icon image for the app.
          {extractedImage ? " (Icon found inside .xdc — provide a hosted URL if you want one shown)" : ""}
        </FormHelperText>
      </FormControl>

      {uploadProgress !== null && <Progress value={uploadProgress} size="sm" colorScheme="primary" borderRadius="md" />}

      <Flex justifyContent="flex-end">
        <Button
          type="submit"
          colorScheme="primary"
          isLoading={formState.isSubmitting}
          isDisabled={!selectedFile || !account}
        >
          Publish
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}
