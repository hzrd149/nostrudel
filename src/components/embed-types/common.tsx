import { Box, Image, ImageProps, Link, useDisclosure } from "@chakra-ui/react";
import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import appSettings from "../../services/app-settings";
import { ImageGalleryLink } from "../image-gallery";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { matchImageUrls } from "../../helpers/regexp";

const BlurredImage = (props: ImageProps) => {
  const { isOpen, onOpen } = useDisclosure();
  return (
    <Box overflow="hidden">
      <Image onClick={onOpen} cursor="pointer" filter={isOpen ? "" : "blur(1.5rem)"} {...props} />
    </Box>
  );
};

const EmbeddedImage = ({ src, blue }: { src: string; blue: boolean }) => {
  const isMobile = useIsMobile();
  const ImageComponent = blue || !appSettings.value.blurImages ? Image : BlurredImage;
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
export function embedImages(content: EmbedableContent, trusted = false) {
  return embedJSX(content, {
    regexp: matchImageUrls,
    render: (match) => <EmbeddedImage blue={trusted} src={match[0]} />,
    name: "Image",
  });
}

export function embedVideos(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Video",
    regexp:
      /https?:\/\/([\dA-z\.-]+\.[A-z\.]{2,12})((?:\/[\+~%\/\.\w\-_]*)?\.(?:mp4|mkv|webm|mov))(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/i,
    render: (match) => <video src={match[0]} controls style={{ maxWidth: "30rem", maxHeight: "20rem" }} />,
  });
}

export function embedLinks(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Link",
    regexp: /https?:\/\/([\dA-z\.-]+\.[A-z\.]{2,12})(\/[\+~%\/\.\w\-_]*)?([\?#][^\s]+)?/i,
    render: (match) => (
      <Link color="blue.500" href={match[0]} target="_blank" isExternal>
        {match[0]}
      </Link>
    ),
  });
}
