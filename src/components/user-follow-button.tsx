import { Button, ButtonProps } from "@chakra-ui/react";
import { useCurrentAccount } from "../hooks/use-current-account";
import useSubject from "../hooks/use-subject";
import clientFollowingService from "../services/client-following";
import { useUserContacts } from "../hooks/use-user-contacts";
import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../providers/additional-relay-context";

export const UserFollowButton = ({
  pubkey,
  ...props
}: { pubkey: string } & Omit<ButtonProps, "onClick" | "isLoading" | "isDisabled">) => {
  const account = useCurrentAccount();
  const following = useSubject(clientFollowingService.following) ?? [];
  const savingDraft = useSubject(clientFollowingService.savingDraft);

  const readRelays = useReadRelayUrls(useAdditionalRelayContext());
  const userContacts = useUserContacts(pubkey, readRelays);

  const isFollowing = following.some((t) => t[1] === pubkey);
  const isFollowingMe = account && userContacts?.contacts.includes(account.pubkey);

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
      colorScheme={isFollowing ? "orange" : "brand"}
      {...props}
      isLoading={savingDraft}
      onClick={toggleFollow}
      isDisabled={account?.readonly ?? true}
    >
      {isFollowing ? "Unfollow" : isFollowingMe ? "Follow Back" : "Follow"}
    </Button>
  );
};
