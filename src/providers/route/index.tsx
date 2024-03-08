import AppHandlerProvider from "./app-handler-provider";
import DebugModalProvider from "./debug-modal-provider";
import DeleteEventProvider from "./delete-event-provider";
import InvoiceModalProvider from "./invoice-modal";
import MuteModalProvider from "./mute-modal-provider";
import PostModalProvider from "./post-modal-provider";
import RequireReadRelays from "./require-read-relays";

/** Providers that provide functionality to pages (needs to be rendered under a router) */
export function RouteProviders({ children }: { children: React.ReactNode }) {
  return (
    <DeleteEventProvider>
      <MuteModalProvider>
        <DebugModalProvider>
          <InvoiceModalProvider>
            <PostModalProvider>
              <RequireReadRelays>
                <AppHandlerProvider>{children}</AppHandlerProvider>
              </RequireReadRelays>
            </PostModalProvider>
          </InvoiceModalProvider>
        </DebugModalProvider>
      </MuteModalProvider>
    </DeleteEventProvider>
  );
}
