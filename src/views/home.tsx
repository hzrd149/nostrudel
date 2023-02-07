import { Avatar, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useUserMetadata } from "../hooks/use-user-metadata";

const UserAvatar = ({ pubkey }: { pubkey: string }) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Link to={`/user/${pubkey}`}>
      <Avatar src={metadata?.picture} />
    </Link>
  );
};

export const HomeView = () => {
  return (
    <>
      <HStack spacing=".5rem">
        <UserAvatar pubkey="32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245" />
        <UserAvatar pubkey="6b0d4c8d9dc59e110d380b0429a02891f1341a0fa2ba1b1cf83a3db4d47e3964" />
        <UserAvatar pubkey="00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700" />
        <UserAvatar pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2" />
        <UserAvatar pubkey="85080d3bad70ccdcd7f74c29a44f55bb85cbcd3dd0cbb957da1d215bdb931204" />
        <UserAvatar pubkey="e88a691e98d9987c964521dff60025f60700378a4879180dcbbb4a5027850411" />
        <UserAvatar pubkey="8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168" />
        <UserAvatar pubkey="266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5" />
      </HStack>
    </>
  );
};
