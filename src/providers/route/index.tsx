import DebugModalProvider from "./debug-modal-provider";
import DeleteEventProvider from "./delete-event-provider";
import InvoiceModalProvider from "./invoice-modal";
import MuteModalProvider from "./mute-modal-provider";
import PostModalProvider from "./post-modal-provider";

/** Providers that provide functionality to pages (needs to be rendered under a router) */
export function RouteProviders({ children }: { children: React.ReactNode }) {
  return (
    <DeleteEventProvider>
      <MuteModalProvider>
        <DebugModalProvider>
          <InvoiceModalProvider>
            <PostModalProvider>{children}</PostModalProvider>
          </InvoiceModalProvider>
        </DebugModalProvider>
      </MuteModalProvider>
    </DeleteEventProvider>
  );
}
