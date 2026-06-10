import {
  Alert,
  AlertIcon,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Spinner,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import { useActiveWallet, useNutWalletState, useNutWalletUnlocked, useWallets } from "../../../hooks/use-wallets";
import { removeNwcWallet, setActiveWallet, type WalletBackend } from "../../../services/wallets";
import useSettingsForm from "../use-settings-form";
import AddWalletModal from "./add-wallet-modal";
import UnlockNutWalletModal from "./unlock-nut-wallet-modal";

/** A clickable wallet card to select it as active, with an optional remove button */
function WalletCard({ wallet, active, onRemove }: { wallet: WalletBackend; active: boolean; onRemove?: () => void }) {
  const balance = use$(wallet.balance$);

  return (
    <Card
      variant="outline"
      borderColor={active ? "primary.500" : undefined}
      cursor="pointer"
      onClick={() => setActiveWallet(wallet.id)}
      role="button"
      aria-pressed={active}
      aria-label={`Use ${wallet.name}`}
    >
      <CardBody as={Flex} gap="3" alignItems="center" p="3">
        <Flex direction="column" gap="0.5" overflow="hidden" flex={1}>
          <Text fontWeight="bold" isTruncated>
            {wallet.name}
          </Text>
          <Text fontSize="sm" color="GrayText">
            {balance === undefined ? "—" : balance.toLocaleString()} sats
          </Text>
        </Flex>
        {onRemove && (
          <IconButton
            size="sm"
            variant="ghost"
            colorScheme="red"
            aria-label={`Remove ${wallet.name}`}
            icon={<TrashIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
        )}
      </CardBody>
    </Card>
  );
}

/** Cashu (NIP-60) section — the single wallet tied to the active account */
function CashuSection() {
  const state = useNutWalletState();
  const active = useActiveWallet();
  const unlocked = useNutWalletUnlocked();
  const unlockModal = useDisclosure();

  return (
    <Flex direction="column" gap="2">
      <Heading size="md">Cashu Wallet</Heading>
      <Text fontSize="sm" color="GrayText">
        A NIP-60 ecash wallet stored on your nostr relays and tied to your account.
      </Text>

      {state.status === "signed-out" && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Sign in to use a Cashu wallet.
        </Alert>
      )}
      {state.status === "loading" && (
        <Flex gap="2" alignItems="center" color="GrayText">
          <Spinner size="sm" /> Looking for your Cashu wallet…
        </Flex>
      )}
      {state.status === "missing" && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          You don't have a Cashu wallet set up yet.
        </Alert>
      )}
      {state.status === "ready" && (
        <>
          <WalletCard wallet={state.backend} active={state.backend.id === active?.id} />
          {!unlocked && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Flex align="center" gap="3" w="full">
                <Text fontSize="sm" flex={1}>
                  Your Cashu wallet is locked. Unlock it to see your balance and make payments.
                </Text>
                <Button size="sm" colorScheme="primary" onClick={unlockModal.onOpen}>
                  Unlock
                </Button>
              </Flex>
            </Alert>
          )}
        </>
      )}

      {unlockModal.isOpen && <UnlockNutWalletModal isOpen onClose={unlockModal.onClose} />}
    </Flex>
  );
}

/** WebLN section — the single browser-provided wallet (e.g. the Alby extension) */
function WeblnSection() {
  const wallets = useWallets();
  const active = useActiveWallet();
  const webln = wallets.find((w) => w.type === "webln");

  return (
    <Flex direction="column" gap="2">
      <Heading size="md">WebLN</Heading>
      <Text fontSize="sm" color="GrayText">
        A lightning wallet provided by your browser or a browser extension.
      </Text>

      {webln ? (
        <WalletCard wallet={webln} active={webln.id === active?.id} />
      ) : (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No WebLN provider is available in this browser.
        </Alert>
      )}
    </Flex>
  );
}

/** Nostr Wallet Connect section — the only wallets the user can add and remove */
function WalletConnectSection() {
  const wallets = useWallets();
  const active = useActiveWallet();
  const addModal = useDisclosure();
  const nwc = wallets.filter((w) => w.type === "nwc");

  return (
    <Flex direction="column" gap="2">
      <Flex alignItems="center" gap="2">
        <Heading size="md">Wallet Connect</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={addModal.onOpen}>
          Add Wallet
        </Button>
      </Flex>
      <Text fontSize="sm" color="GrayText">
        Connect to external lightning wallets over Nostr Wallet Connect (NIP-47).
      </Text>

      {nwc.length === 0 ? (
        <Text color="GrayText">No connected wallets yet.</Text>
      ) : (
        nwc.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            active={wallet.id === active?.id}
            onRemove={() => removeNwcWallet(wallet.id)}
          />
        ))
      )}

      {addModal.isOpen && <AddWalletModal isOpen onClose={addModal.onClose} />}
    </Flex>
  );
}

function ZapSettingsForm() {
  const { register, submit, formState } = useSettingsForm();

  return (
    <Flex as="form" onSubmit={submit} direction="column" gap="4">
      <Heading size="md">Zaps</Heading>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoPayWithWebLN" mb="0">
            Auto pay with WebLN
          </FormLabel>
          <Switch id="autoPayWithWebLN" {...register("autoPayWithWebLN")} />
        </Flex>
        <FormHelperText>
          <span>Enabled: Attempt to automatically pay with WebLN if its available</span>
        </FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel htmlFor="customZapAmounts" mb="0">
          Zap Amounts
        </FormLabel>
        <Input
          id="customZapAmounts"
          maxW="sm"
          autoComplete="off"
          {...register("customZapAmounts", {
            validate: (v) => {
              if (!/^[\d,]*$/.test(v)) return "Must be a list of comma separated numbers";
              return true;
            },
          })}
        />
        {formState.errors.customZapAmounts && (
          <FormErrorMessage>{formState.errors.customZapAmounts.message}</FormErrorMessage>
        )}
        <FormHelperText>
          <span>Comma separated list of custom zap amounts</span>
        </FormHelperText>
      </FormControl>

      <Button
        isLoading={formState.isLoading || formState.isValidating || formState.isSubmitting}
        isDisabled={!formState.isDirty}
        colorScheme="primary"
        type="submit"
        flexShrink={0}
        size="sm"
        mr="auto"
      >
        Save
      </Button>
    </Flex>
  );
}

export default function WalletSettings() {
  return (
    <SimpleView gap="6" title="Wallet" maxW="4xl">
      <CashuSection />
      <WeblnSection />
      <WalletConnectSection />
      <ZapSettingsForm />
    </SimpleView>
  );
}
