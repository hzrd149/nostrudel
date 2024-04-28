import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Router, Location, To, createMemoryRouter, RouteObject } from "react-router-dom";
import { useRouterMarker } from "../../providers/drawer-sub-view-provider";
import { logger } from "../../helpers/debug";
import { RouteProviders } from "../../providers/route";
import InspectRelayView from "./network/inspect-relay";

import TaskManagerModal from "./modal";
import TaskManagerLayout from "./layout";
import TaskManagerNetwork from "./network";
import TaskManagerDatabase from "./database";
import PublishLogView from "./publish-log";

type Router = ReturnType<typeof createMemoryRouter>;

const log = logger.extend("TaskManagerProvider");

const TaskManagerContext = createContext<{ openTaskManager: (route: To) => void; closeTaskManager: () => void }>({
  openTaskManager() {},
  closeTaskManager() {},
});

export function useTaskManagerContext() {
  return useContext(TaskManagerContext);
}

const routes: RouteObject[] = [
  {
    path: "",
    element: <TaskManagerLayout />,
    children: [
      {
        path: "network",
        element: <TaskManagerNetwork />,
        children: [
          {
            path: ":url",
            element: (
              <RouteProviders>
                <InspectRelayView />
              </RouteProviders>
            ),
          },
        ],
      },
      { path: "publish-log", element: <PublishLogView /> },
      {
        path: "database",
        element: <TaskManagerDatabase />,
      },
    ],
  },
];

export default function TaskManagerProvider({ children, parentRouter }: PropsWithChildren & { parentRouter: Router }) {
  const [router, setRouter] = useState<Router | null>(null);

  const openInParent = useCallback((to: To) => parentRouter.navigate(to), [parentRouter]);

  const direction = useRef<"up" | "down">();
  const marker = useRouterMarker(parentRouter);

  useEffect(() => {
    return parentRouter.subscribe((event) => {
      const location = event.location as Location<{ taskManagerRoute?: To | null } | null>;
      const subRoute = location.state?.taskManagerRoute;

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
                state: { ...parentRouter.state.location.state, taskManagerRoute: e.location.pathname },
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

  const openTaskManager = useCallback(
    (to: To) => {
      marker.set();
      parentRouter.navigate(parentRouter.state.location, {
        preventScrollReset: true,
        state: { ...parentRouter.state.location.state, taskManagerRoute: to },
      });
    },
    [parentRouter],
  );

  const closeTaskManager = useCallback(() => {
    const i = marker.index.current;
    if (i !== null && i > 0) {
      log(`Navigating back ${i} entries to the point the task manager was opened`);
      parentRouter.navigate(-i);
    } else {
      log(`Failed to navigate back, clearing state`);
      parentRouter.navigate(parentRouter.state.location, {
        preventScrollReset: true,
        state: { ...parentRouter.state.location.state, taskManagerRoute: undefined },
      });
    }

    // reset marker
    marker.reset();
  }, [parentRouter]);

  const context = useMemo(
    () => ({
      openTaskManager,
      closeTaskManager,
    }),
    [openTaskManager, closeTaskManager],
  );

  return (
    <TaskManagerContext.Provider value={context}>
      {children}
      {router && <TaskManagerModal router={router} isOpen onClose={closeTaskManager} />}
    </TaskManagerContext.Provider>
  );
}
