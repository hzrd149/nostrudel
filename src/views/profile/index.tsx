import { Flex } from "@chakra-ui/react";
import useSubject from "../../hooks/use-subject";
import identity from "../../services/identity";
import { ProfileEditView } from "./edit";

export const ProfileView = () => {
  const pubkey = useSubject(identity.pubkey);

  return <ProfileEditView />;
};
