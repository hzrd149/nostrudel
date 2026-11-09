import SimpleView from "../../../components/layout/presets/simple-view";
import NappletPermissionsPanel from "../../napplets/components/napplet-permissions-panel";

export default function AppsSettings() {
  return (
    <SimpleView title="Napplet permissions">
      <NappletPermissionsPanel />
    </SimpleView>
  );
}
