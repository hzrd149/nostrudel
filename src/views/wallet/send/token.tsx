import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Flex, IconButton, Spacer } from "@chakra-ui/react";
import { ANIMATED_QR_INTERVAL, encodeTokenToEmoji, sendAnimated } from "applesauce-wallet/helpers";
import { getDecodedToken, Proof, ProofState } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";
import { useActionRunner } from "applesauce-react/hooks";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Share } from "@capacitor/share";
import { useAsync } from "react-use";

import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import { CopyIconButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import { getCashuWallet } from "../../../services/cashu-mints";
import { ShareIcon } from "../../../components/icons";
import useAsyncAction from "../../../hooks/use-async-action";
import couch from "../../../services/cashu-couch";

export default function WalletSendTokenView() {
  const navigate = useNavigate();
  const location = useLocation();
  const token: string = location.state?.token;
  if (!token) return <Navigate to="/wallet" />;

  const actions = useActionRunner();

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

  // subscribe to proof spent state; navigate away when token is claimed
  const cancellerRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let active = true;
    const decoded = getDecodedToken(token);

    getCashuWallet(decoded.mint).then((wallet) => {
      if (!active) return;

      wallet
        .onProofStateUpdates(
          decoded.proofs,
          (state: ProofState & { proof: Proof }) => {
            if (state.state === "SPENT" && active) {
              active = false;
              cancellerRef.current?.();
              navigate("/wallet");
            }
          },
          (err: Error) => console.error("Proof state update error:", err),
        )
        .then((canceller) => {
          if (!active) {
            // subscription started but we already unmounted – cancel immediately
            canceller();
          } else {
            cancellerRef.current = canceller;
          }
        })
        .catch((err) => console.error("Failed to subscribe to proof states:", err));
    });

    return () => {
      active = false;
      cancellerRef.current?.();
      cancellerRef.current = null;
    };
  }, [token, navigate]);

  const { run: cancel, loading: canceling } = useAsyncAction(async () => {
    // Reclaim the token back into the wallet using couch for safety
    await actions.run(ReceiveToken, getDecodedToken(token), { couch });
    navigate("/wallet");
  }, [actions, token, navigate]);

  const { value: canShare } = useAsync(async () => Share.canShare());

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
        {canShare?.value && (
          <IconButton
            aria-label="Share token"
            icon={<ShareIcon boxSize={5} />}
            onClick={async () => {
              try {
                await Share.share({
                  title: "Share Token",
                  text: token,
                  dialogTitle: "Share your token",
                });
              } catch (error) {
                console.error("Error sharing", error);
              }
            }}
          />
        )}
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
