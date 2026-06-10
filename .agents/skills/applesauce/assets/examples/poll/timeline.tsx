/**
 * Display polls with voting functionality and results
 * @tags nip-69, poll, timeline, voting
 * @related feed/relay-timeline
 */
import { PollResponseFactory } from "applesauce-common/factories";
import {
  getPollEndsAt,
  getPollOptions,
  getPollQuestion,
  getPollRelays,
  getPollResponseOptions,
  getPollResponsePollId,
  getPollType,
  POLL_KIND,
  POLL_RESPONSE_KIND,
} from "applesauce-common/helpers";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { getDisplayName, mergeRelaySets, NostrEvent, ProfileContent } from "applesauce-core/helpers";
import { createEventLoaderForStore, createTagValueLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { npubEncode, ProfilePointer } from "nostr-tools/nip19";
import { useEffect, useMemo, useState } from "react";

import RelayPicker from "../../components/relay-picker";

// Global instances
const eventStore = new EventStore();
const pool = new RelayPool();
const signer = new ExtensionSigner();

// Create loaders
const pollResponseLoader = createTagValueLoader(pool, "e", {
  kinds: [POLL_RESPONSE_KIND],
  eventStore,
});

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

/** Create a hook for loading a users profile */
function useProfile(user: ProfilePointer): ProfileContent | undefined {
  return use$(() => eventStore.profile(user), [user.pubkey, user.relays?.join("|")]);
}

interface ResponseItemProps {
  response: NostrEvent;
  options: Array<{ id: string; label: string }>;
}

function ResponseItem({ response, options }: ResponseItemProps) {
  const responseOptions = getPollResponseOptions(response);
  const selectedOptions = options.filter((option) => responseOptions.includes(option.id));

  // Load user profile
  const profile = useProfile({ pubkey: response.pubkey });

  // Get display name using helper function
  const displayName = getDisplayName(profile) || npubEncode(response.pubkey).slice(0, 12) + "...";

  return (
    <li className="border-b last:border-b-0">
      <div className="flex items-start gap-3 p-2">
        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-sm truncate">{displayName}</div>
            <time className="text-xs text-base-content/50 font-mono flex-shrink-0 ml-2">
              {new Date(response.created_at * 1000).toLocaleString()}
            </time>
          </div>
          <div className="text-sm text-base-content/80">
            Voted for:{" "}
            <span className="font-semibold">
              {selectedOptions.map((opt) => opt.label).join(", ") || "Unknown option"}
            </span>
          </div>
          {response.content && <div className="text-xs text-base-content/60 mt-2 italic">"{response.content}"</div>}
        </div>
      </div>
    </li>
  );
}

interface VotingFormProps {
  poll: NostrEvent;
  onVoteSubmitted: (response: NostrEvent) => void;
  selectedRelay: string;
}

function VotingForm({ poll, onVoteSubmitted, selectedRelay }: VotingFormProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const options = getPollOptions(poll);
  const pollType = getPollType(poll);
  const endsAt = getPollEndsAt(poll);
  const isExpired = endsAt && endsAt < Math.floor(Date.now() / 1000);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (pollType === "singlechoice") {
      setSelectedOptions(checked ? [optionId] : []);
    } else {
      setSelectedOptions((prev) => (checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)));
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      setVoteError("Please select at least one option");
      return;
    }

    try {
      setIsVoting(true);
      setVoteError(null);

      // Create and sign the poll response event
      const response = PollResponseFactory.create(poll, selectedOptions);
      const signedResponse = await (comment.trim() ? response.comment(comment.trim()) : response).sign(signer);

      // Publish to the selected relay
      await pool.publish(mergeRelaySets(selectedRelay, getPollRelays(poll)), signedResponse);

      // Notify parent component
      onVoteSubmitted(signedResponse);

      // Reset form
      setSelectedOptions([]);
      setComment("");
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setVoteError(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  if (isExpired) {
    return (
      <div className="card bg-base-200 border-l-4 border-warning">
        <div className="card-body">
          <div className="text-warning font-semibold">Poll Expired</div>
          <div className="text-sm text-base-content/70">
            This poll ended on {new Date(endsAt! * 1000).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">Cast Your Vote</h3>

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <label key={option.id} className="cursor-pointer label justify-start gap-3">
              <input
                type={pollType === "singlechoice" ? "radio" : "checkbox"}
                name={pollType === "singlechoice" ? "poll-option" : undefined}
                className={pollType === "singlechoice" ? "radio radio-primary" : "checkbox checkbox-primary"}
                checked={selectedOptions.includes(option.id)}
                onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              />
              <span className="label-text font-medium truncate" title={option.label}>
                {option.label}
              </span>
            </label>
          ))}
        </div>

        <div className="form-control flex flex-col gap-2 mt-4">
          <label className="label">Comment (optional)</label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Add a comment about your vote..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </div>

        {voteError && (
          <div className="alert alert-error mt-4">
            <span>{voteError}</span>
          </div>
        )}

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-primary"
            onClick={handleSubmitVote}
            disabled={selectedOptions.length === 0 || isVoting}
          >
            {isVoting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              `Submit Vote${selectedOptions.length > 1 ? "s" : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PollDetailsProps {
  poll: NostrEvent;
  onBack: () => void;
  selectedRelay: string;
}

function PollDetails({ poll, onBack, selectedRelay }: PollDetailsProps) {
  const [responses, setResponses] = useState<NostrEvent[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const question = getPollQuestion(poll);
  const options = getPollOptions(poll);
  const endsAt = getPollEndsAt(poll);
  const pollType = getPollType(poll);

  // Load poll responses
  useEffect(() => {
    if (!selectedRelay) return;

    setLoadingResponses(true);
    const subscription = pollResponseLoader({
      value: poll.id,
      relays: [selectedRelay],
    }).subscribe({
      next: (response) => {
        if (getPollResponsePollId(response) === poll.id) {
          setResponses((prev) => {
            // Avoid duplicates and maintain chronological order
            if (prev.some((r) => r.id === response.id)) return prev;
            return [...prev, response].sort((a, b) => a.created_at - b.created_at);
          });
        }
      },
      complete: () => setLoadingResponses(false),
      error: (error) => {
        console.error("Failed to load responses:", error);
        setLoadingResponses(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [poll.id, selectedRelay]);

  const handleVoteSubmitted = (newResponse: NostrEvent) => {
    setResponses((prev) => [...prev, newResponse].sort((a, b) => a.created_at - b.created_at));
  };

  // Calculate vote statistics
  const voteStats = useMemo(() => {
    const counts: Record<string, number> = {};
    options.forEach((option) => (counts[option.id] = 0));

    responses.forEach((response) => {
      const responseOptions = getPollResponseOptions(response);
      responseOptions.forEach((optionId) => {
        if (counts[optionId] !== undefined) {
          counts[optionId]++;
        }
      });
    });

    const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return { counts, totalVotes };
  }, [responses, options]);

  const isExpired = endsAt && endsAt < Math.floor(Date.now() / 1000);

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button className="btn btn-ghost mb-4" onClick={onBack}>
          ← Back to polls
        </button>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold mb-4">{question}</h1>

            {/* Poll metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-base-content/70 mb-4">
              <span className="badge badge-outline">
                {pollType === "multiplechoice" ? "Multiple Choice" : "Single Choice"}
              </span>
              <span>
                {voteStats.totalVotes} {voteStats.totalVotes === 1 ? "response" : "responses"}
              </span>
              {endsAt && (
                <span className={`badge ${isExpired ? "badge-error" : "badge-warning"}`}>
                  {isExpired ? "Expired" : "Ends"} {new Date(endsAt * 1000).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Vote results */}
            <div className="space-y-3">
              {options.map((option) => {
                const votes = voteStats.counts[option.id] || 0;
                const percentage = voteStats.totalVotes > 0 ? (votes / voteStats.totalVotes) * 100 : 0;

                return (
                  <div key={option.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <span className="font-medium truncate flex-1 mr-3" title={option.label}>
                      {option.label}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 bg-base-300 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-mono min-w-[4rem] text-right">
                        {votes} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Voting Form */}
      <div className="mb-8">
        <VotingForm poll={poll} onVoteSubmitted={handleVoteSubmitted} selectedRelay={selectedRelay} />
      </div>

      {/* Responses List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            Responses ({responses.length})
            {loadingResponses && <span className="loading loading-dots loading-sm"></span>}
          </h2>

          {responses.length === 0 && !loadingResponses ? (
            <div className="text-center py-8 text-base-content/60">No responses yet. Be the first to vote!</div>
          ) : (
            <div className="bg-base-50 rounded-lg">
              {/* Poll creation header */}
              <div className="flex items-start gap-3 p-2 border-b border-base-200 bg-base-100/50">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-sm">Poll Created</div>
                    <time className="text-xs text-base-content/50 font-mono flex-shrink-0 ml-2">
                      {new Date(poll.created_at * 1000).toLocaleString()}
                    </time>
                  </div>
                  <div className="text-sm text-base-content/80">Poll opened for voting</div>
                </div>
              </div>

              {/* Response list */}
              <ul className="divide-y divide-base-200">
                {responses.map((response) => (
                  <ResponseItem key={response.id} response={response} options={options} />
                ))}
              </ul>

              {/* Poll end marker (if expired) */}
              {isExpired && (
                <div className="flex items-start gap-3 p-2 border-t border-base-200 bg-base-100/50">
                  <div className="w-2 h-2 bg-error rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-sm">Poll Ended</div>
                      <time className="text-xs text-base-content/50 font-mono flex-shrink-0 ml-2">
                        {new Date(endsAt! * 1000).toLocaleString()}
                      </time>
                    </div>
                    <div className="text-sm text-base-content/80">Voting is now closed</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PollCardProps {
  poll: NostrEvent;
  onSelect: (poll: NostrEvent) => void;
  selectedRelay: string;
}

function PollCard({ poll, onSelect, selectedRelay }: PollCardProps) {
  const [responses, setResponses] = useState<NostrEvent[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const question = getPollQuestion(poll);
  const options = getPollOptions(poll);
  const endsAt = getPollEndsAt(poll);
  const pollType = getPollType(poll);

  // Load poll responses using tagValueLoader
  useEffect(() => {
    if (!selectedRelay) return;

    setLoadingResponses(true);
    const subscription = pollResponseLoader({
      value: poll.id,
      relays: [selectedRelay],
    }).subscribe({
      next: (response) => {
        // Verify this response is for this poll
        if (getPollResponsePollId(response) === poll.id) {
          setResponses((prev) => {
            // Avoid duplicates
            if (prev.some((r) => r.id === response.id)) return prev;
            return [...prev, response];
          });
        }
      },
      complete: () => setLoadingResponses(false),
      error: () => setLoadingResponses(false),
    });

    return () => subscription.unsubscribe();
  }, [poll.id, selectedRelay]);

  const isExpired = endsAt && endsAt < Math.floor(Date.now() / 1000);

  // Calculate vote counts for each option
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    options.forEach((option) => (counts[option.id] = 0));

    responses.forEach((response) => {
      const responsePollId = getPollResponsePollId(response);
      if (responsePollId === poll.id) {
        response.tags
          .filter((tag) => tag[0] === "response" && tag.length >= 2)
          .forEach((tag) => {
            const optionId = tag[1];
            if (counts[optionId] !== undefined) {
              counts[optionId]++;
            }
          });
      }
    });

    return counts;
  }, [responses, options, poll.id]);

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div
      className="card bg-base-100 shadow-md border hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(poll)}
    >
      <div className="card-body">
        <h3 className="card-title text-lg font-semibold mb-3">{question}</h3>

        <div className="space-y-2">
          {options.map((option) => {
            const votes = voteCounts[option.id] || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

            return (
              <div key={option.id} className="flex items-center justify-between p-2 bg-base-200 rounded">
                <span className="text-sm font-medium truncate flex-1 mr-2" title={option.label}>
                  {option.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 bg-base-300 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-base-content/70 min-w-[3rem] text-right">
                    {votes} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-4 text-xs text-base-content/60">
          <div className="flex items-center gap-4">
            <span>{pollType === "multiplechoice" ? "Multiple Choice" : "Single Choice"}</span>
            <span>
              {totalVotes} {totalVotes === 1 ? "response" : "responses"}
            </span>
            {loadingResponses && <span className="loading loading-dots loading-xs"></span>}
          </div>
          {isExpired && <span className="badge badge-error badge-sm">Expired</span>}
          {endsAt && !isExpired && (
            <span className="badge badge-warning badge-sm">Ends {new Date(endsAt * 1000).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface PollGridProps {
  polls: NostrEvent[];
  onPollSelect: (poll: NostrEvent) => void;
  selectedRelay: string;
}

function PollGrid({ polls, onPollSelect, selectedRelay }: PollGridProps) {
  if (!polls || polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-base-content/60 mb-4">No polls found</div>
        <div className="text-sm text-base-content/40">
          {selectedRelay ? "Try selecting a different relay" : "Select a relay to start browsing polls"}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onSelect={onPollSelect} selectedRelay={selectedRelay} />
      ))}
    </div>
  );
}

export default function PollGridApp() {
  const [selectedRelay, setSelectedRelay] = useState("wss://relay.damus.io");
  const [selectedPoll, setSelectedPoll] = useState<NostrEvent | null>(null);

  // Subscribe to poll events from the selected relay
  use$(
    () =>
      selectedRelay
        ? pool
            .relay(selectedRelay)
            .subscription({
              kinds: [POLL_KIND],
              since: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
              limit: 50,
            })
            .pipe(mapEventsToStore(eventStore))
        : undefined,
    [selectedRelay],
  );

  // Get polls from the event store
  const polls = use$(() => eventStore.timeline({ kinds: [POLL_KIND] }), []);

  if (selectedPoll) {
    return <PollDetails poll={selectedPoll} onBack={() => setSelectedPoll(null)} selectedRelay={selectedRelay} />;
  }

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Nostr Polls</h1>
        <p className="text-base-content/70 mb-6">
          Browse and vote on NIP-88 polls from Nostr relays. Click on a poll to view details and cast your vote.
        </p>
        <RelayPicker value={selectedRelay} onChange={setSelectedRelay} />
      </div>

      <PollGrid polls={polls || []} onPollSelect={setSelectedPoll} selectedRelay={selectedRelay} />
    </div>
  );
}
