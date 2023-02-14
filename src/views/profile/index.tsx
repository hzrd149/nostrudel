import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";
import { ProfileEditView } from "./edit";

export const ProfileView = () => {
  const pubkey = useSubject(accountService.pubkey) ?? "";

  return <ProfileEditView />;
};
