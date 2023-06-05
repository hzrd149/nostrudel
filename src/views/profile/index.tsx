import RequireCurrentAccount from "../../providers/require-current-account";
import { ProfileEditView } from "./edit";

export default function ProfileView() {
  return (
    <RequireCurrentAccount>
      <ProfileEditView />
    </RequireCurrentAccount>
  );
}
