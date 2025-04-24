import { Button, Flex, FlexProps, Spacer, useDisclosure } from "@chakra-ui/react";
import styled from "@emotion/styled";
import {
  DependencyList,
  MutableRefObject,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import { useUnmount } from "react-use";
import { NostrEvent } from "nostr-tools";

import Lightbox, { RenderSlideContainerProps, Slide } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";

// extend slide type to include eventId
declare module "yet-another-react-lightbox" {
  interface GenericSlide {
    event?: NostrEvent;
  }
}

import { getSharableEventAddress } from "../services/relay-hints";
import UserAvatarLink from "./user/user-avatar-link";
import UserLink from "./user/user-link";

type RefType = MutableRefObject<HTMLElement | null>;

function getElementPath(element: HTMLElement): HTMLElement[] {
  if (!element.parentElement) return [element];
  return [...getElementPath(element.parentElement), element];
}
function comparePaths(a: HTMLElement[] | null, b: HTMLElement[] | null) {
  if (a && !b) return -1;
  if (!b && a) return 1;
  if (!a || !b) return 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i] && a[i].parentElement === b[i].parentElement) {
      const parent = a[i].parentElement;
      if (!parent) return 0;
      const children = Array.from(parent.children);
      return Math.sign(children.indexOf(a[i]) - children.indexOf(b[i]));
    }
  }
  return 0;
}

const LightboxContext = createContext({
  isOpen: false,
  removeSlide(ref: RefType) {},
  showSlide(ref: RefType) {},
  addSlide(ref: RefType, slide: Slide) {},
});
export function useLightbox() {
  return useContext(LightboxContext);
}

export function useRegisterSlide(ref?: RefType, slide?: Slide, watch: DependencyList[] = []) {
  const { showSlide, addSlide, removeSlide } = useLightbox();
  const show = useCallback(() => {
    if (ref) showSlide(ref);
  }, [ref, showSlide]);

  useEffect(() => {
    if (ref && slide) addSlide(ref, slide);
  }, [ref, ...watch]);

  useUnmount(() => {
    if (ref) removeSlide(ref);
  });

  return { show };
}

type DynamicSlide = {
  ref: RefType;
  slide: Slide;
};

const refPaths = new WeakMap<RefType, HTMLElement[]>();
function getRefPath(ref: RefType) {
  if (ref.current === null) return null;
  const cache = refPaths.get(ref);
  if (cache) return cache;
  const path = getElementPath(ref.current);
  refPaths.set(ref, path);
  return path;
}

function EventSlideHeader({ event, ...props }: { event: NostrEvent } & Omit<FlexProps, "children">) {
  const encoded = useMemo(() => getSharableEventAddress(event), [event]);

  return (
    <Flex gap="2" alignItems="center" p="2" {...props}>
      <UserAvatarLink pubkey={event.pubkey} size={["xs", "sm"]} />
      <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
      <Spacer />
      <Button as={RouterLink} to={`/n/${encoded}`} colorScheme="primary" size="sm" aria-label="View note details">
        View Note
      </Button>
    </Flex>
  );
}

const StyledContainer = styled(Flex)`
  & > .yarl__fullsize {
    overflow: hidden;
  }
`;
export function CustomSlideContainer({ slide, children }: RenderSlideContainerProps) {
  if (slide.event) {
    return (
      <StyledContainer direction="column" w="full" h="full" overflow="hidden">
        <EventSlideHeader event={slide.event} w="full" maxW="4xl" mx="auto" bg="Background" flexShrink={0} />
        {children}
      </StyledContainer>
    );
  }
  return <>{children}</>;
}

export function LightboxProvider({ children }: PropsWithChildren) {
  const lightbox = useDisclosure();
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState<DynamicSlide[]>([]);

  const orderedSlides = useRef<DynamicSlide[]>([]);
  orderedSlides.current = Array.from(Object.values(slides)).sort((a, b) =>
    comparePaths(getRefPath(a.ref), getRefPath(b.ref)),
  );

  const addSlide = useCallback(
    (ref: RefType, slide: Slide) => {
      setSlides((arr) => {
        if (arr.some((s) => s.ref === ref)) {
          return arr.map((s) => (s.ref === ref ? { ref, slide } : s));
        }
        return arr.concat({ ref, slide });
      });
    },
    [setSlides],
  );
  const removeSlide = useCallback(
    (ref: RefType) => {
      setSlides((arr) => arr.filter((s) => s.ref !== ref));
    },
    [setSlides],
  );
  const showSlide = useCallback(
    (ref: RefType) => {
      for (let i = 0; i < orderedSlides.current.length; i++) {
        if (orderedSlides.current[i].ref === ref) {
          // set slide index
          setIndex(i);
          lightbox.onOpen();
          return;
        }
      }

      // else select first image
      setIndex(0);
      lightbox.onOpen();
    },
    [lightbox.onOpen, setIndex],
  );

  const context = useMemo(
    () => ({ isOpen: lightbox.isOpen, removeSlide, addSlide, showSlide }),
    [lightbox.isOpen, removeSlide, addSlide, showSlide],
  );

  const lightboxSlides = useMemo(() => orderedSlides.current.map((s) => s.slide), [orderedSlides.current, slides]);

  const handleView = useCallback(
    ({ index }: { index: number }) => {
      setIndex(index);
    },
    [setIndex],
  );

  return (
    <LightboxContext.Provider value={context}>
      {children}
      <Lightbox
        index={index}
        open={lightbox.isOpen}
        slides={lightboxSlides}
        close={lightbox.onClose}
        plugins={[Zoom, Counter, Download]}
        zoom={{ scrollToZoom: true, maxZoomPixelRatio: 4, wheelZoomDistanceFactor: 500 }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        on={{ view: handleView }}
        render={{
          slideContainer: CustomSlideContainer,
        }}
      />
    </LightboxContext.Provider>
  );
}
