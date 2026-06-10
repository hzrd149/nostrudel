/**
 * Create and manage signers with password-based encryption for private keys
 * @tags nip-19, nip-49, signers, password, encryption
 * @related signers/accounts
 */
import { PasswordSigner } from "applesauce-signers";
import { generateSecretKey, nip19 } from "nostr-tools";
import { useCallback, useState } from "react";
import { useLocalStorage } from "react-use";

const STORAGE_KEY = "nip49-example-ncryptsec";

// Component to display user's profile information
function ProfileCard({ pubkey, handleLock }: { pubkey: string; handleLock: () => void }) {
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure className="px-10 pt-10">
        <div className="avatar">
          <div className="w-24 rounded-full">
            <img src={`https://robohash.org/${pubkey}.png`} className="rounded" />
          </div>
        </div>
      </figure>
      <div className="card-body">
        <div>
          <div className="font-semibold">Hex Public Key:</div>
          <div className="text-sm break-all">{pubkey}</div>
        </div>
        <div>
          <div className="font-semibold">Npub:</div>
          <div className="text-sm break-all">{npub}</div>
        </div>
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleLock}>
            Lock
          </button>
        </div>
      </div>
    </div>
  );
}
// Component for the unlock form
function UnlockForm({
  onUnlock,
  onReset,
  error,
}: {
  onUnlock: (password: string) => Promise<void>;
  onReset: () => void;
  error?: string;
}) {
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    await onUnlock(password);
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Unlock Your Profile</h2>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Enter your password</span>
          </label>
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        <div className="card-actions justify-end gap-2">
          <button className="btn btn-ghost" onClick={onReset}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// Component for the initial setup form
function SetupForm({
  onSubmit,
  error,
}: {
  onSubmit: (data: { nsec: string; password: string }) => Promise<void>;
  error?: string;
}) {
  const [nsec, setNsec] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    await onSubmit({ nsec, password });
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Setup Your Profile</h2>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Enter your nsec (optional)</span>
          </label>
          <input
            type="password"
            placeholder="nsec1..."
            className="input input-bordered w-full"
            value={nsec}
            onChange={(e) => setNsec(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt">Leave empty to generate new keys</span>
          </label>
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Choose an encryption password</span>
          </label>
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component that manages state and orchestrates the other components
export default function Nip49Profile() {
  const [signer] = useState(() => new PasswordSigner());
  const [pubkey, setPubkey] = useState<string>();
  const [error, setError] = useState<string>();
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [saved, setSaved] = useLocalStorage<string>(STORAGE_KEY, undefined, { raw: true });

  // Check for stored encrypted key on mount
  if (saved) signer.ncryptsec = saved;

  const [isSetup, setIsSetup] = useState(signer.ncryptsec !== undefined);

  const handleInitialSetup = useCallback(
    async ({ nsec, password }: { nsec: string; password: string }) => {
      try {
        setError(undefined);

        // Generate new key if nsec is empty
        let privateKey: Uint8Array;
        if (!nsec) {
          privateKey = generateSecretKey();
        } else {
          // Decode nsec if provided
          try {
            const decoded = nip19.decode(nsec);
            if (decoded.type !== "nsec") throw new Error("Invalid nsec");
            privateKey = decoded.data;
          } catch {
            throw new Error("Invalid nsec format");
          }
        }

        // Set the key and encrypt it
        signer.key = privateKey;
        await signer.setPassword(password);

        if (!signer.ncryptsec) throw new Error("Failed to encrypt key");

        // Store encrypted key
        setSaved(signer.ncryptsec);

        // Get and set public key
        const pubkey = await signer.getPublicKey();
        setPubkey(pubkey);
        setIsUnlocked(true);
        setIsSetup(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error occurred");
      }
    },
    [signer, setSaved],
  );

  const handleReset = useCallback(() => {
    signer.key = null;
    signer.ncryptsec = undefined;
    setSaved(undefined);
    setIsSetup(false);
  }, [setSaved, signer]);

  const handleUnlock = useCallback(
    async (password: string) => {
      try {
        setError(undefined);
        await signer.unlock(password);
        const pubkey = await signer.getPublicKey();
        setPubkey(pubkey);
        setIsUnlocked(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to unlock");
      }
    },
    [signer],
  );

  const handleLock = useCallback(() => {
    signer.lock();
    setIsUnlocked(false);
    setPubkey(undefined);
  }, [signer]);

  // Render the appropriate component based on state
  if (isUnlocked && pubkey)
    return (
      <div className="flex justify-center items-center h-full">
        <ProfileCard pubkey={pubkey} handleLock={handleLock} />
      </div>
    );

  if (isSetup && !isUnlocked)
    return (
      <div className="flex justify-center items-center h-full">
        <UnlockForm onUnlock={handleUnlock} onReset={handleReset} error={error} />
      </div>
    );

  return (
    <div className="flex justify-center items-center h-full">
      <SetupForm onSubmit={handleInitialSetup} error={error} />
    </div>
  );
}
