import {
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  IconButton,
} from "@chakra-ui/react";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
import { RouteObject, RouterProvider, To, createMemoryRouter, useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../components/error-boundary";
import NoteView from "../views/note";
import { ArrowLeftSIcon, ArrowRightSIcon, ExternalLinkIcon } from "../components/icons";
import { PageProviders } from ".";

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
            <IconButton icon={<ArrowLeftSIcon />} aria-label="Back" onClick={() => router.navigate(-1)} />
            <IconButton icon={<ArrowRightSIcon />} aria-label="Forward" onClick={() => router.navigate(+1)} />
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
                <RouterProvider router={router} />
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
    element: <NoteView />,
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

export default function DrawerSubViewProvider({
  children,
  parentRouter,
}: PropsWithChildren & { parentRouter: Router }) {
  const [router, setRouter] = useState<Router | null>(null);

  const openInParent = useCallback(
    (to: To) => {
      parentRouter.navigate(to);
      setRouter(null);
    },
    [parentRouter],
  );

  const openDrawer = useCallback(
    (to: To) => {
      const newRouter = createMemoryRouter(routes, { initialEntries: [to] });
      newRouter.subscribe((e) => {
        if (!!e.errors?.["__shim-error-route__"]) {
          openInParent(e.location);
        }
      });
      setRouter(newRouter);
    },
    [setRouter, openInParent],
  );

  const closeDrawer = useCallback(() => {
    setRouter(null);
  }, [setRouter]);

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
