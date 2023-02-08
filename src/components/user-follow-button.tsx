import { Button, ButtonProps } from "@chakra-ui/react";
import { useReadonlyMode } from "../hooks/use-readonly-mode";
import useSubject from "../hooks/use-subject";
import followingService from "../services/following";

export const UserFollowButton = ({
  pubkey,
  ...props
}: { pubkey: string } & Omit<ButtonProps, "onClick" | "isLoading" | "isDisabled">) => {
  const readonly = useReadonlyMode();
  const following = useSubject(followingService.following);
  const savingDraft = useSubject(followingService.savingDraft);

  const isFollowing = following.some((t) => t[1] === pubkey);

  const toggleFollow = async () => {
    if (isFollowing) {
      followingService.removeContact(pubkey);
    } else {
      followingService.addContact(pubkey);
    }

    await followingService.savePendingDraft();
  };

  return (
    <Button colorScheme="brand" {...props} isLoading={savingDraft} onClick={toggleFollow} isDisabled={readonly}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};
