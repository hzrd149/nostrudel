import { getEventHash, nip13 } from "nostr-tools";

const BATCH_NUMBER = 1000;
// Listen for messages from the main thread
self.onmessage = (event) => {
  const { draft, target } = event.data;
  let running = true;
  let nonce = 0;
  let bestDifficulty = nip13.getPow(getEventHash(draft));
  let bestHash = getEventHash(draft);

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
        postMessage({ type: "progress", hash, difficulty });
      }

      if (difficulty >= target) {
        running = false;
        postMessage({ type: "complete", draft: newDraft });
        break;
      }
      nonce++;
    }

    if (running) setTimeout(mine, 0);
  };

  mine();
};
