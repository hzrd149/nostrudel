import { PropsWithChildren, createContext, forwardRef, useCallback, useContext, useMemo, useState } from "react";
import { LinkProps, Link, useDisclosure } from "@chakra-ui/react";
import Lightbox, { SlideImage } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

const GalleryContext = createContext({
  isOpen: false,
  openImage(url: string) {},
});
export function useGalleryContext() {
  return useContext(GalleryContext);
}

export const ImageGalleryLink = forwardRef(({ children, href, ...props }: Omit<LinkProps, "onClick">, ref) => {
  const { openImage } = useGalleryContext();

  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        if (href) {
          e.preventDefault();
          openImage(href);
        }
      }}
      ref={ref}
    >
      {children}
    </Link>
  );
});

export function ImageGalleryProvider({ children }: PropsWithChildren) {
  const open = useDisclosure();
  const [slides, setSlides] = useState<SlideImage[]>([]);

  const openImage = useCallback(
    (url: string) => {
      setSlides([{ src: url }]);
      open.onOpen();
    },
    [setSlides, open.onOpen]
  );

  const context = useMemo(() => ({ isOpen: open.isOpen, openImage }), [open.isOpen, openImage]);

  return (
    <GalleryContext.Provider value={context}>
      {children}
      <Lightbox
        open={open.isOpen}
        slides={slides}
        close={open.onClose}
        plugins={[Zoom, Counter, Download]}
        zoom={{ scrollToZoom: true, maxZoomPixelRatio: 4, wheelZoomDistanceFactor: 100 }}
      />
    </GalleryContext.Provider>
  );
}
