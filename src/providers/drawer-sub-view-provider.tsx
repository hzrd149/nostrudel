import {
  PropsWithChildren,
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Heading,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { Location, RouteObject, RouterProvider, To, createMemoryRouter, useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../components/error-boundary";
import ThreadView from "../views/note";
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from "../components/icons";
import { PageProviders } from ".";
import { logger } from "../helpers/debug";

const TorrentDetailsView = lazy(() => import("../views/torrents/torrent"));

type Router = ReturnType<typeof createMemoryRouter>;

const IsInDrawerContext = createContext(false);
const DrawerSubViewContext = createContext<{ openDrawer: (route: To) => void; closeDrawer: () => void }>({
  openDrawer() {},
  closeDrawer() {},
});

function DrawerSubView({
  router,
  openInParent,
  ...props
}: Omit<DrawerProps, "children"> & { router: Router; openInParent: (to: To) => void }) {
  const [title, setTitle] = useState("");

  return (
    <Drawer size="xl" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader p="2">
          <ButtonGroup size="sm">
            <IconButton icon={<ChevronLeftIcon />} aria-label="Back" onClick={() => router.navigate(-1)} />
            <IconButton icon={<ChevronRightIcon />} aria-label="Forward" onClick={() => router.navigate(+1)} />
            <IconButton
              icon={<ExternalLinkIcon />}
              aria-label="Open"
              onClick={() => openInParent(router.state.location)}
            />
          </ButtonGroup>
          {title}
        </DrawerHeader>
        <DrawerBody px="2" pb="2" pt="0">
          <ErrorBoundary>
            <IsInDrawerContext.Provider value={true}>
              <PageProviders>
                <Suspense
                  fallback={
                    <Heading size="md" mx="auto" my="4">
                      <Spinner /> Loading page
                    </Heading>
                  }
                >
                  <RouterProvider router={router} />
                </Suspense>
              </PageProviders>
            </IsInDrawerContext.Provider>
          </ErrorBoundary>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

const routes: RouteObject[] = [
  {
    path: "/n/:id",
    element: <ThreadView />,
  },
  {
    path: "/torrents/:id",
    element: <TorrentDetailsView />,
  },
];

export function useDrawerSubView() {
  return useContext(DrawerSubViewContext);
}

export function useNavigateInDrawer() {
  const navigate = useNavigate();
  const isInDrawer = useContext(IsInDrawerContext);
  const { openDrawer } = useDrawerSubView();

  return isInDrawer ? navigate : openDrawer;
}

const log = logger.extend("DrawerRouter");

export default function DrawerSubViewProvider({
  children,
  parentRouter,
}: PropsWithChildren & { parentRouter: Router }) {
  const [router, setRouter] = useState<Router | null>(null);

  const openInParent = useCallback((to: To) => parentRouter.navigate(to), [parentRouter]);

  const direction = useRef<"up" | "down">();
  const marker = useRef<number>(0);

  useEffect(() => {
    return parentRouter.subscribe((event) => {
      const location = event.location as Location<{ subRouterPath?: To | null } | null>;
      const subRoute = location.state?.subRouterPath;

      if (event.historyAction === "PUSH") marker.current++;
      else if (event.historyAction === "POP") marker.current--;

      if (subRoute) {
        if (router) {
          if (router.state.location.pathname !== subRoute && direction.current !== "up") {
            log("Updating router from parent state");
            direction.current = "down";
            router.navigate(subRoute);
            direction.current = undefined;
          }
        } else {
          log("Create Router");

          const newRouter = createMemoryRouter(routes, { initialEntries: [subRoute] });
          newRouter.subscribe((e) => {
            if (
              e.errors &&
              e.errors["__shim-error-route__"].status === 404 &&
              e.errors["__shim-error-route__"].internal
            ) {
              openInParent(e.location);
            } else if (direction.current !== "down") {
              log("Updating parent state from Router");
              direction.current = "up";
              parentRouter.navigate(parentRouter.state.location, {
                preventScrollReset: true,
                state: { ...parentRouter.state.location.state, subRouterPath: e.location.pathname },
              });
            }
            direction.current = undefined;
          });

          // use the parent routers createHref method so that users can open links in new tabs
          newRouter.createHref = parentRouter.createHref;

          setRouter(newRouter);
        }
      } else if (router) {
        log("Destroy Router");
        setRouter(null);
      }
    });
  }, [parentRouter, router, setRouter]);

  const openDrawer = useCallback(
    (to: To) => {
      marker.current = 0;
      parentRouter.navigate(parentRouter.state.location, {
        preventScrollReset: true,
        state: { ...parentRouter.state.location.state, subRouterPath: to },
      });
    },
    [parentRouter],
  );

  const closeDrawer = useCallback(() => {
    const i = marker.current;
    if (i > 0) {
      log(`Navigating back ${i} entries to the point the drawer was opened`);
      parentRouter.navigate(-i);
    } else {
      log(`Failed to navigate back, clearing state`);
      parentRouter.navigate(parentRouter.state.location, {
        preventScrollReset: true,
        state: { ...parentRouter.state.location.state, subRouterPath: undefined },
      });
    }

    // reset marker
    marker.current = 0;
  }, [parentRouter]);

  const context = useMemo(
    () => ({
      openDrawer,
      closeDrawer,
    }),
    [openDrawer, closeDrawer],
  );

  return (
    <DrawerSubViewContext.Provider value={context}>
      {children}
      {router && <DrawerSubView router={router} isOpen onClose={closeDrawer} openInParent={openInParent} />}
    </DrawerSubViewContext.Provider>
  );
}
