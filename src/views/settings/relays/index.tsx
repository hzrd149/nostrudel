import SimpleView from "../../../components/layout/presets/simple-view";
import UnhealthyRelaysSettings from "./components/dead-relay-settings";
import ExtraPublishRelaySettings from "./components/extra-publish-relay-settings";
import FallbackRelaySettings from "./components/fallback-relay-settings";
import LookupRelaySettings from "./components/lookup-relay-settings";

export default function AppRelaysView() {
  return (
    <SimpleView title="Relay Settings" maxW="6xl">
      <LookupRelaySettings />
      <FallbackRelaySettings />
      <ExtraPublishRelaySettings />
      <UnhealthyRelaysSettings />
    </SimpleView>
  );
}
