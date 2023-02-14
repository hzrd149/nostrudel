import useSubject from "../../hooks/use-subject";
import identityService from "../../services/identity";
import { ProfileEditView } from "./edit";

export const ProfileView = () => {
  const pubkey = useSubject(identityService.pubkey) ?? "";

  return <ProfileEditView />;
};
