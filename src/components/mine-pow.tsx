import { useRef, useState } from "react";
import { Button, ButtonGroup, Flex, Heading, Progress, Text } from "@chakra-ui/react";
import { getEventHash, nip13 } from "nostr-tools";

import { DraftNostrEvent } from "../types/nostr-event";
import CheckCircle from "./icons/check-circle";
import { useMount } from "react-use";

const BATCH_NUMBER = 1000;

function miner(
  draft: DraftNostrEvent & { pubkey: string },
  target: number,
  onProgress: (hash: string, difficulty: number) => void,
  onComplete: (draft: DraftNostrEvent) => void,
) {
  let running = true;
  let nonce = 0;

  let bestDifficulty = nip13.getPow(getEventHash(draft));
  let bestHash: string = getEventHash(draft);

  const nonceTag = ["nonce", "0", String(target)];
  const newDraft = { ...draft, tags: [...draft.tags, nonceTag] };

  const mine = () => {
    for (let i = 0; i < BATCH_NUMBER; i++) {
      nonceTag[1] = String(nonce);
      const hash = getEventHash(newDraft);
      const difficulty = nip13.getPow(hash);
      if (difficulty > bestDifficulty) {
        bestDifficulty = difficulty;
        bestHash = hash;
        onProgress(hash, difficulty);
      }

      if (difficulty >= target) {
        running = false;
        onComplete(newDraft);
        break;
      }
      nonce++;
    }

    if (running) requestIdleCallback(mine);
  };

  mine();

  return () => {
    running = false;
  };
}

export default function MinePOW({
  draft,
  targetPOW,
  onComplete,
  onCancel,
  onSkip,
  successDelay = 800,
}: {
  draft: DraftNostrEvent & { pubkey: string };
  targetPOW: number;
  onComplete: (draft: DraftNostrEvent) => void;
  onCancel: () => void;
  onSkip?: () => void;
  successDelay?: number;
}) {
  const [progress, setProgress] = useState<{ difficulty: number; hash: string }>(() => ({
    difficulty: nip13.getPow(getEventHash(draft)),
    hash: getEventHash(draft),
  }));
  const stop = useRef<() => void>(() => {});

  useMount(() => {
    const stopMiner = miner(
      draft,
      targetPOW,
      (hash, difficulty) => setProgress({ hash, difficulty }),
      (draft) => {
        setTimeout(() => onComplete(draft), successDelay);
      },
    );
    stop.current = stopMiner;
  });

  return (
    <Flex gap="2" direction="column">
      {progress.difficulty > targetPOW ? (
        <>
          <CheckCircle boxSize={12} color="green.500" mx="auto" />
          <Heading size="md" mx="auto" mt="2">
            Found POW
          </Heading>
          <Text mx="auto">{progress.hash}</Text>
        </>
      ) : (
        <>
          <Heading size="sm">Mining POW...</Heading>
          <Text>Best Hash: {progress.hash}</Text>
          <Progress hasStripe value={(progress.difficulty / targetPOW) * 100} />
          <ButtonGroup mx="auto">
            <Button
              onClick={() => {
                stop.current();
                onCancel();
              }}
            >
              Cancel
            </Button>
            {onSkip && (
              <Button
                onClick={() => {
                  stop.current();
                  onSkip();
                }}
              >
                Skip
              </Button>
            )}
          </ButtonGroup>
        </>
      )}
    </Flex>
  );
}
