import { Button, ButtonProps } from "@chakra-ui/react";
import { useCurrentAccount } from "../hooks/use-current-account";
import useSubject from "../hooks/use-subject";
import clientFollowingService from "../services/client-following";
import clientRelaysService from "../services/client-relays";
import { useUserContacts } from "../hooks/use-user-contacts";

export const UserFollowButton = ({
  pubkey,
  ...props
}: { pubkey: string } & Omit<ButtonProps, "onClick" | "isLoading" | "isDisabled">) => {
  const account = useCurrentAccount();
  const following = useSubject(clientFollowingService.following) ?? [];
  const savingDraft = useSubject(clientFollowingService.savingDraft);

  const isFollowing = following.some((t) => t[1] === pubkey);

  const userContacts = useUserContacts(pubkey, clientRelaysService.getReadUrls());

  const toggleFollow = async () => {
    if (isFollowing) {
      clientFollowingService.removeContact(pubkey);
    } else {
      clientFollowingService.addContact(pubkey);
    }

    await clientFollowingService.savePending();
  };

  return (
    <Button
      colorScheme="brand"
      {...props}
      isLoading={savingDraft}
      onClick={toggleFollow}
      isDisabled={account?.readonly ?? true}
    >
      {isFollowing ? "Unfollow" : account && userContacts?.contacts.includes(account.pubkey) ? "Follow Back" : "Follow"}
    </Button>
  );
};
