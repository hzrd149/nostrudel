import { Box, Image, ImageProps, Link, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import appSettings from "../../services/settings/app-settings";
import { ImageGalleryLink } from "../image-gallery";
import { useTrusted } from "../../providers/trust";
import OpenGraphCard from "../open-graph-card";
import { EmbedableContent, defaultGetLocation } from "../../helpers/embeds";
import { matchLink } from "../../helpers/regexp";

const BlurredImage = (props: ImageProps) => {
  const { isOpen, onOpen } = useDisclosure();
  return (
    <Box overflow="hidden">
      <Image
        onClick={
          !isOpen
            ? (e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpen();
              }
            : undefined
        }
        cursor="pointer"
        filter={isOpen ? "" : "blur(1.5rem)"}
        {...props}
      />
    </Box>
  );
};

const EmbeddedImage = ({ src, inGallery }: { src: string; inGallery?: boolean }) => {
  const trusted = useTrusted();
  const ImageComponent = trusted || !appSettings.value.blurImages ? Image : BlurredImage;
  const thumbnail = appSettings.value.imageProxy
    ? new URL(`/256,fit/${src}`, appSettings.value.imageProxy).toString()
    : src;

  if (inGallery) {
    return (
      <ImageGalleryLink href={src} target="_blank">
        <ImageComponent src={thumbnail} cursor="pointer" />
      </ImageGalleryLink>
    );
  }

  return (
    <ImageGalleryLink href={src} target="_blank" display="block" mx="-2">
      <ImageComponent src={thumbnail} cursor="pointer" maxH={["initial", "35vh"]} mx={["auto", 0]} />
    </ImageGalleryLink>
  );
};

function ImageGallery({ images }: { images: string[] }) {
  return (
    <SimpleGrid columns={[2, 2, 3, 3, 4]}>
      {images.map((src) => (
        <EmbeddedImage key={src} src={src} inGallery />
      ))}
    </SimpleGrid>
  );
}

const imageExt = [".svg", ".gif", ".png", ".jpg", ".jpeg", ".webp", ".avif"];

// nevent1qqs8397rp8tt60f3lm8zldt8uqljuqw9axp8z79w0qsmj3r96lmg4tgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3zamnwvaz7tmwdaehgun4v5hxxmmd0mkwa9
export function embedImageGallery(content: EmbedableContent): EmbedableContent {
  return content
    .map((subContent, i) => {
      if (typeof subContent === "string") {
        const matches = Array.from(subContent.matchAll(matchLink));

        const newContent: EmbedableContent = [];
        let lastBatchEnd = 0;
        let batch: RegExpMatchArray[] = [];

        const renderBatch = () => {
          if (batch.length > 1) {
            // render previous batch
            const lastMatchPosition = defaultGetLocation(batch[batch.length - 1]);
            const before = subContent.substring(lastBatchEnd, defaultGetLocation(batch[0]).start);
            const render = <ImageGallery images={batch.map((m) => m[0])} />;

            newContent.push(before, render);
            lastBatchEnd = lastMatchPosition.end;
          }

          batch = [];
        };

        for (const match of matches) {
          try {
            const url = new URL(match[0]);
            if (!imageExt.some((ext) => url.pathname.endsWith(ext))) throw new Error("not an image");

            // if this is the first image, add it to the batch
            if (batch.length === 0) {
              batch = [match];
              continue;
            }

            const last = defaultGetLocation(batch[batch.length - 1]);
            const position = defaultGetLocation(match);
            const space = subContent.substring(last.end, position.start).trim();

            // if there was a non-space between this and the last batch
            if (space.length > 0) renderBatch();

            batch.push(match);
          } catch (e) {
            // start a new batch without current match
            batch = [];
          }
        }

        renderBatch();

        newContent.push(subContent.substring(lastBatchEnd));

        return newContent;
      }

      return subContent;
    })
    .flat();
}

// nostr:nevent1qqsfhafvv705g5wt8rcaytkj6shsshw3dwgamgfe3za8knk0uq4yesgpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqsrnltk
export function renderImageUrl(match: URL) {
  if (!imageExt.some((ext) => match.pathname.endsWith(ext))) return null;

  return <EmbeddedImage src={match.toString()} />;
}

const videoExt = [".mp4", ".mkv", ".webm", ".mov"];
export function renderVideoUrl(match: URL) {
  if (!videoExt.some((ext) => match.pathname.endsWith(ext))) return null;

  return <video src={match.toString()} controls style={{ maxWidth: "30rem", maxHeight: "20rem", width: "100%" }} />;
}

export function renderGenericUrl(match: URL) {
  return (
    <Link href={match.toString()} isExternal color="blue.500">
      {match.toString()}
    </Link>
  );
}

export function renderOpenGraphUrl(match: URL) {
  return <OpenGraphCard url={match} maxW="lg" />;
}
