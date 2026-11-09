import { use$ } from "applesauce-react/hooks";
import { combineLatest, map } from "rxjs";
import { messagingStartupError$ } from "../services/messaging";
import useMessaging from "./use-messaging";

export default function useMessageAlerts() {
  const session = useMessaging();
  const errors = use$(() => session?.errors$, [session]) ?? [];
  const startupError = use$(messagingStartupError$);
  const requests =
    use$(
      () =>
        session &&
        combineLatest([session.legacy.authRequests$, session.wrapped.authRequests$]).pipe(
          map(([legacy, wrapped]) => [
            ...new Map([...legacy, ...wrapped].map((request) => [request.url, request])).values(),
          ]),
        ),
      [session],
    ) ?? [];
  return { requests, errors, startupError, hasAlerts: !!(requests.length || errors.length || startupError) };
}
