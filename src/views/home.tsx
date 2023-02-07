import { HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../components/user-avatar";
import { UserAvatarLink } from "../components/user-avatar-link";

export const HomeView = () => {
  return (
    <>
      <HStack spacing=".5rem">
        <UserAvatarLink pubkey="32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245" />
        <UserAvatarLink pubkey="6b0d4c8d9dc59e110d380b0429a02891f1341a0fa2ba1b1cf83a3db4d47e3964" />
        <UserAvatarLink pubkey="00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700" />
        <UserAvatarLink pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2" />
        <UserAvatarLink pubkey="85080d3bad70ccdcd7f74c29a44f55bb85cbcd3dd0cbb957da1d215bdb931204" />
        <UserAvatarLink pubkey="e88a691e98d9987c964521dff60025f60700378a4879180dcbbb4a5027850411" />
        <UserAvatarLink pubkey="8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168" />
        <UserAvatarLink pubkey="c4eabae1be3cf657bc1855ee05e69de9f059cb7a059227168b80b89761cbc4e0" />
        <UserAvatarLink pubkey="e33fe65f1fde44c6dc17eeb38fdad0fceaf1cae8722084332ed1e32496291d42" />
        <UserAvatarLink pubkey="c5cfda98d01f152b3493d995eed4cdb4d9e55a973925f6f9ea24769a5a21e778" />
        <UserAvatarLink pubkey="3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d" />
        <UserAvatarLink pubkey="04c915daefee38317fa734444acee390a8269fe5810b2241e5e6dd343dfbecc9" />
      </HStack>
    </>
  );
};
