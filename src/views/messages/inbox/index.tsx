import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import useMessaging from "../../../hooks/use-messaging";
import GiftWrapSync from "./components/gift-wrap-sync";
import LockedMessagesSection from "./components/locked-messages";
import ClientStatus from "./components/client-status";
import ReadAuthRequiredAlert from "../components/read-auth-required-alert";

export default function InboxView() {
  useAppTitle("Messages inbox");

  // Keep a subscription open for NIP-04 and NIP-17 messages
  useMessaging();
  return (
    <SimpleView title="Inbox">
      <ReadAuthRequiredAlert />
      <ClientStatus />
      <GiftWrapSync />
      <LockedMessagesSection />
    </SimpleView>
  );
}
