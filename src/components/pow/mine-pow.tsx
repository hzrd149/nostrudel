import { useRef, useState } from "react";
import { useMount } from "react-use";
import { Button, ButtonGroup, Flex, Heading, Progress, Text } from "@chakra-ui/react";
import { getEventHash, nip13, UnsignedEvent } from "nostr-tools";
import CheckCircle from "../icons/check-circle";

type MinerCleanup = () => void;

function getNumThreads() {
  // Check if the property is supported
  if (navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  } else {
    // Default to a reasonable number if the property is not supported
    return 2; // Or any other value you prefer
  }
}

function miner(
  draft: UnsignedEvent,
  target: number,
  onProgress: (hash: string, difficulty: number) => void,
  onComplete: (draft: UnsignedEvent & { id: string }) => void,
  stopMiner: MinerCleanup, // Pass the stopMiner function to the miner
): MinerCleanup {
  if (typeof Worker !== "undefined") {
    const numThreads = getNumThreads();
    const nonceRangeSize = 1000000; // Size of each nonce range
    let miningComplete = false; // Flag to track mining completion
    let bestHash = getEventHash(draft); // Initialize best hash with the starting hash
    let bestDifficulty = nip13.getPow(bestHash); // Initialize best difficulty with starting hash's difficulty

    const handleMessage = (msg: any) => {
      if (miningComplete) return; // Ignore messages if mining is already complete

      if (msg.type === "progress") {
        const { hash, difficulty } = msg;
        if (difficulty > bestDifficulty) {
          bestHash = hash; // Update the best hash if a better one is found
          bestDifficulty = difficulty; // Update the best difficulty
          onProgress(bestHash, bestDifficulty); // Call onProgress with the new best hash and difficulty
        }
      } else if (msg.type === "complete") {
        miningComplete = true; // Set the flag to indicate mining completion
        onComplete(msg.draft);
        stopMiner(); // Call stopMiner when mining is complete
        cleanup; // Call stopMiner when mining is complete
      }
    };

    const workers: Worker[] = [];
    for (let i = 0; i < numThreads; i++) {
      const startNonce = i * nonceRangeSize; // Calculate start nonce for each worker
      const endNonce = (i + 1) * nonceRangeSize - 1; // Calculate end nonce for each worker
      const worker = new Worker(new URL("./miner.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event) => handleMessage(event.data);
      workers.push(worker);
      worker.postMessage({ draft, target, startNonce, endNonce }); // Pass nonce range to worker
    }

    const cleanup: MinerCleanup = () => {
      workers.forEach((worker) => {
        worker.terminate();
      });
    };

    return cleanup;
  } else {
    console.error("Web Workers are not supported in this environment.");
    return () => {};
  }
}

interface MinePOWProps {
  draft: UnsignedEvent;
  targetPOW: number;
  onComplete: (draft: UnsignedEvent & { id: string }) => void;
  onCancel: () => void;
  onSkip?: () => void;
  successDelay?: number;
}

export default function MinePOW({
  draft,
  targetPOW,
  onComplete,
  onCancel,
  onSkip,
  successDelay = 800,
}: MinePOWProps): JSX.Element {
  const [bestProgress, setBestProgress] = useState<{ difficulty: number; hash: string }>(() => ({
    difficulty: nip13.getPow(getEventHash(draft)),
    hash: getEventHash(draft),
  }));
  const stopMiner = useRef<MinerCleanup>(() => {});

  useMount(() => {
    const stopMinerFunc = miner(
      draft,
      targetPOW,
      (hash, difficulty) => {
        // Update the best progress only if a better hash is found
        if (difficulty > bestProgress.difficulty) {
          setBestProgress({ hash, difficulty });
        }
      },
      (draft) => {
        setTimeout(() => onComplete(draft), successDelay);
      },
      stopMiner.current, // Pass the current stopMiner function to the miner
    );
    stopMiner.current = stopMinerFunc;
  });

  return (
    <Flex gap="2" direction="column">
      {bestProgress.difficulty > targetPOW ? (
        <>
          <CheckCircle boxSize={12} color="green.500" mx="auto" />
          <Heading size="md" mx="auto" mt="2">
            Found POW
          </Heading>
          <Text mx="auto">{bestProgress.hash}</Text>
        </>
      ) : (
        <>
          <Heading size="sm">Mining POW...</Heading>
          <Text>Best Hash: {bestProgress.hash}</Text>
          <Progress hasStripe value={(bestProgress.difficulty / targetPOW) * 100} />
          <ButtonGroup mx="auto">
            <Button
              onClick={() => {
                stopMiner.current();
                onCancel();
              }}
            >
              Cancel
            </Button>
            {onSkip && (
              <Button
                onClick={() => {
                  stopMiner.current();
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
