import { Box, Image, ImageProps, Link, useDisclosure } from "@chakra-ui/react";
import appSettings from "../../services/app-settings";
import { ImageGalleryLink } from "../image-gallery";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useTrusted } from "../note/trust";

const BlurredImage = (props: ImageProps) => {
  const { isOpen, onOpen } = useDisclosure();
  return (
    <Box overflow="hidden">
      <Image onClick={onOpen} cursor="pointer" filter={isOpen ? "" : "blur(1.5rem)"} {...props} />
    </Box>
  );
};

const EmbeddedImage = ({ src }: { src: string }) => {
  const isMobile = useIsMobile();
  const trusted = useTrusted();
  const ImageComponent = trusted || !appSettings.value.blurImages ? Image : BlurredImage;
  const thumbnail = appSettings.value.imageProxy
    ? new URL(`/256,fit/${src}`, appSettings.value.imageProxy).toString()
    : src;

  return (
    <ImageGalleryLink href={src} target="_blank" display="block" mx="-2">
      <ImageComponent src={thumbnail} cursor="pointer" maxH={isMobile ? "80vh" : "35vh"} mx={isMobile ? "auto" : "0"} />
    </ImageGalleryLink>
  );
};

// note1n06jceulg3gukw836ghd94p0ppwaz6u3mksnnz960d8vlcp2fnqsgx3fu9
const imageExt = [".svg", ".gif", ".png", ".jpg", ".jpeg", ".webp", ".avif"];
export function renderImageUrl(match: URL) {
  if (!imageExt.some((ext) => match.pathname.endsWith(ext))) return null;

  return <EmbeddedImage src={match.toString()} />;
}

const videoExt = [".mp4", ".mkv", ".webm", ".mov"];
export function renderVideoUrl(match: URL) {
  if (!videoExt.some((ext) => match.pathname.endsWith(ext))) return null;

  return <video src={match.toString()} controls style={{ maxWidth: "30rem", maxHeight: "20rem" }} />;
}

export function renderGenericUrl(match: URL) {
  return (
    <Link color="blue.500" href={match.toString()} target="_blank" isExternal>
      {match.toString()}
    </Link>
  );
}
