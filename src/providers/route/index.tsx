import DeleteEventProvider from "./delete-event-provider";
import InvoiceModalProvider from "./invoice-modal";
import MuteModalProvider from "./mute-modal-provider";
import PostModalProvider from "./post-modal-provider";

/** Providers that provider functionality to pages (needs to be rendered under a router) */
export function RouteProviders({ children }: { children: React.ReactNode }) {
  return (
    <DeleteEventProvider>
      <MuteModalProvider>
        <InvoiceModalProvider>
          <PostModalProvider>{children}</PostModalProvider>
        </InvoiceModalProvider>
      </MuteModalProvider>
    </DeleteEventProvider>
  );
}
