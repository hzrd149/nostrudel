import { useEffect, useState } from "react";
import { filter, from, Observable, switchMap, take } from "rxjs";
import { Button, ButtonGroup, Flex, Spacer, useToast } from "@chakra-ui/react";
import { ANIMATED_QR_INTERVAL, encodeTokenToEmoji, sendAnimated } from "applesauce-wallet/helpers";
import { getDecodedToken, Proof, ProofState } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";
import { useActionHub } from "applesauce-react/hooks";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import { CopyIconButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import { getCashuWallet } from "../../../services/cashu-mints";

export default function WalletSendTokenView() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const token: string = location.state?.token;
  if (!token) return <Navigate to="/wallet" />;

  const actions = useActionHub();

  const [speed, setSpeed] = useState(ANIMATED_QR_INTERVAL.MEDIUM);
  const [data, setData] = useState<string>();

  const shouldAnimate = token.length > 256;

  // update qr code data
  useEffect(() => {
    if (shouldAnimate) {
      const sub = sendAnimated(token, { interval: speed }).subscribe((part) => setData(part));
      return () => sub.unsubscribe();
    } else setData(token);
  }, [token, speed, shouldAnimate]);

  // subscribe to redeemed state
  useEffect(() => {
    const decoded = getDecodedToken(token);
    const sub = from(getCashuWallet(decoded.mint))
      .pipe(
        switchMap((wallet) => {
          // subscribe to proof states
          return new Observable<ProofState & { proof: Proof }>((observer) => {
            // TODO: cancel subscription
            wallet.onProofStateUpdates(
              decoded.proofs,
              (state) => observer.next(state),
              (err) => observer.error(err),
            );
          });
        }),
        // look for spent proofs
        filter((state) => state.state === "SPENT"),
        // only wait for one to be spent
        take(1),
      )
      .subscribe(() => {
        toast({ status: "success", description: "Tokens sent" });
        navigate("/wallet");
      });

    return () => sub.unsubscribe();
  }, [token]);

  const [canceling, setCanceling] = useState(false);
  const cancel = async () => {
    setCanceling(true);
    try {
      await actions.run(ReceiveToken, getDecodedToken(token));
      navigate("/wallet");
    } catch (error) {}
    setCanceling(false);
  };

  return (
    <SimpleView title="Cashu Token" maxW="xl" center>
      {data && <QrCodeSvg content={data} w="full" aspectRatio={1} />}

      {shouldAnimate && (
        <ButtonGroup size="xs" mx="auto">
          <Button
            colorScheme={speed === ANIMATED_QR_INTERVAL.SLOW ? "primary" : undefined}
            onClick={() => setSpeed(ANIMATED_QR_INTERVAL.SLOW)}
          >
            Slow
          </Button>
          <Button
            colorScheme={speed === ANIMATED_QR_INTERVAL.MEDIUM ? "primary" : undefined}
            onClick={() => setSpeed(ANIMATED_QR_INTERVAL.MEDIUM)}
          >
            Normal
          </Button>
          <Button
            colorScheme={speed === ANIMATED_QR_INTERVAL.FAST ? "primary" : undefined}
            onClick={() => setSpeed(ANIMATED_QR_INTERVAL.FAST)}
          >
            Fast
          </Button>
        </ButtonGroup>
      )}

      <Flex gap="2">
        <CopyIconButton value={token} aria-label="Copy token" />
        <CopyIconButton value={encodeTokenToEmoji(token)} aria-label="Copy emoji" icon={<span>🥜</span>} />
        <Spacer />
        <Button onClick={cancel} isLoading={canceling}>
          Cancel
        </Button>
        <Button as={RouterLink} to="/wallet" colorScheme="primary">
          Done
        </Button>
      </Flex>
    </SimpleView>
  );
}
