import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Flex, Heading } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import {
  getEventUID,
  getTagValue,
  hasHiddenTags,
  HiddenTagsSigner,
  isHiddenTagsLocked,
  unlockHiddenTags,
} from "applesauce-core/helpers";

import { useReadRelays } from "../../hooks/use-client-relays";
import useCurrentAccount from "../../hooks/use-current-account";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import { getWalletDescription, getWalletName } from "../../helpers/nostr/wallet";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import useEventUpdate from "../../hooks/use-event-update";
import { eventStore } from "../../services/event-store";

function Wallet({ wallet }: { wallet: NostrEvent }) {
  useEventUpdate(wallet.id);

  const account = useCurrentAccount()!;
  const locked = hasHiddenTags(wallet) && isHiddenTagsLocked(wallet);

  const unlock = useAsyncErrorHandler(async () => {
    const signer = account.signer;
    if (!signer || !signer.nip04) throw new Error("Missing signer");

    await unlockHiddenTags(wallet, signer as HiddenTagsSigner, eventStore);
  }, [wallet, account]);

  return (
    <Card>
      <CardHeader display="flex" gap="2" p="2" alignItems="center">
        <Heading size="md">{getWalletName(wallet) || getTagValue(wallet, "d")}</Heading>
        {locked && <Badge colorScheme="orange">Locked</Badge>}
        <DebugEventButton event={wallet} variant="ghost" ml="auto" size="sm" />
      </CardHeader>
      <CardBody px="2" py="0">
        {getWalletDescription(wallet)}
      </CardBody>
      <CardFooter p="2">
        {locked && (
          <Button onClick={unlock} colorScheme="primary">
            Unlock
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function WalletHomeView() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelays();
  const { timeline } = useTimelineLoader("wallets", readRelays, { kinds: [37375], authors: [account.pubkey] });

  return (
    <Flex direction="column" gap="2">
      {timeline.map((wallet) => (
        <Wallet key={getEventUID(wallet)} wallet={wallet} />
      ))}
    </Flex>
  );
}
