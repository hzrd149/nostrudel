import RequireActiveAccount from "../../components/router/require-active-account";
import { ProfileEditView } from "./edit";

export default function ProfileView() {
  return (
    <RequireActiveAccount>
      <ProfileEditView />
    </RequireActiveAccount>
  );
}
