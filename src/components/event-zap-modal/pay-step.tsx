import {
  Alert,
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spacer,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { PayRequest } from ".";
import { useActiveWallet, useWallets } from "../../hooks/use-wallets";
import { type WalletBackend } from "../../services/wallets";
import { CheckIcon, ChevronDownIcon, ErrorIcon, LightningIcon } from "../icons";
import { InvoiceModalContent } from "../invoice-modal";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";

function UserCard({ children, pubkey }: PropsWithChildren & { pubkey: string }) {
  return (
    <Flex gap="2" alignItems="center" overflow="hidden">
      <UserAvatar pubkey={pubkey} size="md" />
      <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
      <Spacer />
      {children}
    </Flex>
  );
}

function PaidCard({ pubkey }: { pubkey: string }) {
  return (
    <UserCard pubkey={pubkey}>
      <Button size="sm" variant="outline" leftIcon={<CheckIcon />}>
        Paid
      </Button>
    </UserCard>
  );
}

function ErrorCard({ pubkey, error }: { pubkey: string; error: any }) {
  const showMore = useDisclosure();

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <Button size="sm" variant="outline" leftIcon={<ErrorIcon />} onClick={showMore.onToggle}>
          Error
        </Button>
      </UserCard>
      {showMore.isOpen && <Alert status="error">{error.message}</Alert>}
    </Flex>
  );
}

/**
 * A single zap invoice. Offers to pay with the active wallet, a menu to pay with any other connected wallet,
 * and a manual invoice (QR / copy / open in app) fallback.
 */
function PayRequestCard({
  pubkey,
  invoice,
  onPaid,
  disabled,
}: {
  pubkey: string;
  invoice: string;
  onPaid: () => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const wallets = useWallets();
  const active = useActiveWallet();
  const [paying, setPaying] = useState(false);
  // Default to showing the manual invoice when there is no wallet to pay with
  const showInvoice = useDisclosure({ defaultIsOpen: !active });

  const payWith = async (wallet: WalletBackend) => {
    setPaying(true);
    try {
      await wallet.payInvoice(invoice);
      onPaid();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
      // Reveal the manual options so the user can still pay another way
      showInvoice.onOpen();
    }
    setPaying(false);
  };

  const others = wallets.filter((w) => w.id !== active?.id);

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        {active ? (
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              leftIcon={<LightningIcon />}
              onClick={() => payWith(active)}
              isLoading={paying}
              isDisabled={paying || disabled}
            >
              {active.name}
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<ChevronDownIcon />}
                aria-label="Other payment options"
                isDisabled={paying || disabled}
              />
              <MenuList>
                {others.map((wallet) => (
                  <MenuItem key={wallet.id} icon={<LightningIcon />} onClick={() => payWith(wallet)} isDisabled={paying || disabled}>
                    {wallet.name}
                  </MenuItem>
                ))}
                {others.length > 0 && <MenuDivider />}
                <MenuItem onClick={showInvoice.onToggle}>Show invoice</MenuItem>
              </MenuList>
            </Menu>
          </ButtonGroup>
        ) : (
          <Button size="sm" variant="outline" onClick={showInvoice.onToggle}>
            Show invoice
          </Button>
        )}
      </UserCard>
      {showInvoice.isOpen && <InvoiceModalContent invoice={invoice} onPaid={onPaid} />}
    </Flex>
  );
}

export default function PayStep({
  callbacks,
  onComplete,
  ...props
}: Omit<FlexProps, "children"> & { callbacks: PayRequest[]; onComplete: () => void }) {
  const [paid, setPaid] = useState<string[]>([]);
  const active = useActiveWallet();

  const markPaid = (pubkey: string) => setPaid((a) => (a.includes(pubkey) ? a : a.concat(pubkey)));

  // Always attempt to pay every invoice with the active wallet once it is available
  const attempted = useRef(false);
  const [payingAll, setPayingAll] = useState(false);
  useEffect(() => {
    if (attempted.current || !active) return;
    attempted.current = true;

    (async () => {
      setPayingAll(true);
      for (const { invoice, pubkey } of callbacks) {
        if (!invoice) continue;
        try {
          await active.payInvoice(invoice);
          markPaid(pubkey);
        } catch (e) {
          // Leave it for the user to pay manually or with another wallet
        }
      }
      setPayingAll(false);
    })();
  }, [active]);

  // Complete once every invoice has been paid
  useEffect(() => {
    const withInvoice = callbacks.filter((p) => !!p.invoice);
    const hasUnpaid = withInvoice.some(({ pubkey }) => !paid.includes(pubkey));
    if (withInvoice.length > 0 && !hasUnpaid) onComplete();
  }, [paid]);

  return (
    <Flex direction="column" gap="4" {...props}>
      {callbacks.map(({ pubkey, invoice, error }) => {
        if (paid.includes(pubkey)) return <PaidCard key={pubkey} pubkey={pubkey} />;
        if (error) return <ErrorCard key={pubkey} pubkey={pubkey} error={error} />;
        if (invoice)
          return (
            <PayRequestCard
              key={pubkey}
              pubkey={pubkey}
              invoice={invoice}
              onPaid={() => markPaid(pubkey)}
              disabled={payingAll}
            />
          );
        return null;
      })}
      {payingAll && (
        <Button isLoading loadingText="Paying…" variant="outline" isDisabled>
          Paying…
        </Button>
      )}
    </Flex>
  );
}
