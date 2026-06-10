/**
 * Create and publish highlights on articles by selecting text, with markdown rendering and mention support
 * @tags nip-23, nip-84, highlight, article, markdown
 * @related highlight/timeline, content/articles
 */
import { HighlightFactory } from "applesauce-common/factories";
import { getArticleImage, getArticlePublished, getArticleSummary, getArticleTitle } from "applesauce-common/helpers";
import { remarkNostrMentions } from "applesauce-content/markdown";
import { defined, EventStore } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { kinds, nip19, NostrEvent } from "nostr-tools";
import { AddressPointer, npubEncode } from "nostr-tools/nip19";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { filter, of, take } from "rxjs";

// Memoize plugins and components at module level
const remarkPlugins = [remarkGfm, remarkNostrMentions];
const markdownComponents = {
  h1: ({ ...props }: any) => <h1 className="text-3xl font-bold my-4" {...props} />,
  h2: ({ ...props }: any) => <h2 className="text-2xl font-bold my-3" {...props} />,
  p: ({ ...props }: any) => <p className="my-2" {...props} />,
  a: ({ ...props }: any) => <a className="link link-primary" target="_blank" {...props} />,
  ul: ({ ...props }: any) => <ul className="list-disc ml-4 my-2" {...props} />,
  ol: ({ ...props }: any) => <ol className="list-decimal ml-4 my-2" {...props} />,
  blockquote: ({ ...props }: any) => <blockquote className="border-l-4 border-primary pl-4 my-2" {...props} />,
  code: ({ ...props }: any) => <code className="bg-base-300 rounded px-1" {...props} />,
  pre: ({ ...props }: any) => <pre className="bg-base-300 rounded p-4 my-2 overflow-x-auto" {...props} />,
  table: ({ ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="table table-zebra w-full" {...props} />
    </div>
  ),
  thead: ({ ...props }: any) => <thead className="bg-base-200" {...props} />,
  tbody: ({ ...props }: any) => <tbody {...props} />,
  tr: ({ ...props }: any) => <tr {...props} />,
  th: ({ ...props }: any) => <th {...props} />,
  td: ({ ...props }: any) => <td {...props} />,
};

const eventStore = new EventStore();
const pool = new RelayPool();

// Create an address loader to fetch articles
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

const signer = new ExtensionSigner();

interface HighlightButtonProps {
  onHighlight: (text: string) => void;
}

interface HighlightButtonRef {
  updateSelection: (text: string, range: Range) => void;
  hide: () => void;
}

const HighlightButton = React.forwardRef<HighlightButtonRef, HighlightButtonProps>(({ onHighlight }, ref) => {
  const currentSelectionRef = useRef<string>("");

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentSelectionRef.current) {
        onHighlight(currentSelectionRef.current);
      }
    },
    [onHighlight],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent the button from taking focus away from the text selection
    e.preventDefault();
  }, []);

  const buttonRef = useRef<HTMLButtonElement>(null);

  // Expose method to update selection
  useImperativeHandle(ref, () => ({
    updateSelection: (text: string, range: Range) => {
      currentSelectionRef.current = text;
      if (buttonRef.current) {
        const rect = range.getBoundingClientRect();
        buttonRef.current.style.display = "flex";
        buttonRef.current.style.top = `${rect.bottom}px`;
        buttonRef.current.style.left = `${rect.left + rect.width / 2 - 20}px`;
      }
    },
    hide: () => {
      currentSelectionRef.current = "";
      if (buttonRef.current) {
        buttonRef.current.style.display = "none";
      }
    },
  }));

  return (
    <button
      ref={buttonRef}
      className="fixed z-50 bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-focus transition-colors border-2 border-primary-content"
      style={{
        display: "none",
        userSelect: "none",
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      tabIndex={-1}
      aria-label="Create highlight"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-1 16h12L17 4M9 9v6m6-6v6"
        />
      </svg>
    </button>
  );
});

HighlightButton.displayName = "HighlightButton";

interface HighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  article: NostrEvent | null;
  onPublish: (comment: string, relays: string[]) => void;
}

function HighlightModal({ isOpen, onClose, selectedText, article, onPublish }: HighlightModalProps) {
  const [comment, setComment] = useState("");
  const [selectedRelays, setSelectedRelays] = useState<string[]>(["wss://relay.damus.io/"]);
  const [customRelay, setCustomRelay] = useState("");

  const defaultRelays = ["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/", "wss://nostr.wine/"];

  const handleAddCustomRelay = () => {
    if (customRelay && !selectedRelays.includes(customRelay)) {
      setSelectedRelays([...selectedRelays, customRelay]);
      setCustomRelay("");
    }
  };

  const toggleRelay = (relay: string) => {
    setSelectedRelays((prev) => (prev.includes(relay) ? prev.filter((r) => r !== relay) : [...prev, relay]));
  };

  const handlePublish = () => {
    if (selectedText && selectedRelays.length > 0) {
      onPublish(comment, selectedRelays);
      setComment("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Create Highlight</h3>

        {/* Selected text preview */}
        <div className="bg-base-300 p-4 rounded mb-4">
          <p className="text-sm opacity-70 mb-2">Selected text:</p>
          <blockquote className="border-l-4 border-primary pl-4 italic">"{selectedText}"</blockquote>
        </div>

        {/* Comment input */}
        <div className="form-control mb-4 flex flex-col gap-2">
          <label className="label">Comment (optional)</label>
          <textarea
            className="textarea textarea-bordered h-24 w-full"
            placeholder="Add your thoughts about this highlight..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Relay selection */}
        <div className="form-control mb-4">
          <label className="label">Select relays to publish to:</label>

          {/* Default relays */}
          <div className="mb-3 flex flex-col gap-2">
            {defaultRelays.map((relay) => (
              <label key={relay} className="cursor-pointer label justify-start">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mr-3"
                  checked={selectedRelays.includes(relay)}
                  onChange={() => toggleRelay(relay)}
                />
                <span className="label-text">{relay}</span>
              </label>
            ))}
          </div>

          {/* Custom relay input */}
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="wss://custom.relay.com/"
              value={customRelay}
              onChange={(e) => setCustomRelay(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCustomRelay()}
            />
            <button type="button" className="btn btn-outline" onClick={handleAddCustomRelay} disabled={!customRelay}>
              Add
            </button>
          </div>

          {/* Show custom relays */}
          {selectedRelays
            .filter((relay) => !defaultRelays.includes(relay))
            .map((relay) => (
              <label key={relay} className="cursor-pointer label justify-start mt-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mr-3"
                  checked={true}
                  onChange={() => toggleRelay(relay)}
                />
                <span className="label-text">{relay}</span>
              </label>
            ))}
        </div>

        {/* Article info */}
        {article && (
          <div className="bg-base-200 p-3 rounded mb-4">
            <p className="text-sm opacity-70">Highlighting from:</p>
            <p className="font-semibold">{getArticleTitle(article)}</p>
            <p className="text-sm">by {npubEncode(article.pubkey).slice(0, 12)}...</p>
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={!selectedText || selectedRelays.length === 0}
          >
            Publish Highlight
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleRenderer({ article }: { article: NostrEvent }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const highlightButtonRef = useRef<HighlightButtonRef>(null);

  const handleMouseUp = useCallback(() => {
    // Small delay to ensure any button interactions don't interfere
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        highlightButtonRef.current?.hide();
        return;
      }

      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();

      if (text.length > 0 && contentRef.current?.contains(range.commonAncestorContainer)) {
        highlightButtonRef.current?.updateSelection(text, range.cloneRange());
      } else {
        highlightButtonRef.current?.hide();
      }
    }, 10);
  }, []);

  const handleHighlight = useCallback((text: string) => {
    setSelectedText(text);
    setShowModal(true);
    highlightButtonRef.current?.hide();
    window.getSelection()?.removeAllRanges();
  }, []);

  const handlePublishHighlight = useCallback(
    async (comment: string, relays: string[]) => {
      try {
        // Get address pointer for the article
        const addressPointer: AddressPointer = {
          kind: article.kind,
          pubkey: article.pubkey,
          identifier: article.tags.find((tag) => tag[0] === "d")?.[1] || "",
        };

        // Create and sign the highlight event
        let highlightFactory = HighlightFactory.create(selectedText, addressPointer);
        if (comment) highlightFactory = highlightFactory.comment(comment);
        const highlightEvent = await highlightFactory.sign(signer);

        // Publish to selected relays (in a real app)
        console.log("Publishing highlight to relays:", relays);
        console.log("Highlight event:", highlightEvent);

        // Show success message
        alert("Highlight published successfully! (This is a demo - check console for event)");
      } catch (error) {
        console.error("Failed to publish highlight:", error);
        alert("Failed to publish highlight. Check console for details.");
      }
    },
    [selectedText, article],
  );

  return (
    <div className="container mx-auto my-8 max-w-4xl px-4">
      <div className="py-4">
        {getArticleImage(article) && (
          <div className="w-full h-[300px] mb-6 rounded-lg overflow-hidden">
            <img src={getArticleImage(article)} alt={getArticleTitle(article)} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">{getArticleTitle(article)}</h1>
        <p className="text-lg opacity-70 mb-2">By {npubEncode(article.pubkey).slice(0, 8)}</p>
        <p className="text-sm opacity-60 mb-8">
          Published: {new Date(getArticlePublished(article) * 1000).toLocaleDateString()}
        </p>

        {getArticleSummary(article) && (
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <p className="text-lg italic">{getArticleSummary(article)}</p>
          </div>
        )}

        <div ref={contentRef} className="prose prose-lg max-w-none select-text" onMouseUp={handleMouseUp}>
          <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
            {article.content}
          </ReactMarkdown>
        </div>

        <HighlightButton ref={highlightButtonRef} onHighlight={handleHighlight} />

        <HighlightModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          selectedText={selectedText}
          article={article}
          onPublish={handlePublishHighlight}
        />
      </div>
    </div>
  );
}

export default function ArticleHighlighter() {
  const [naddr, setNaddr] = useState("");
  const [addressPointer, setAddressPointer] = useState<AddressPointer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse naddr input
  useEffect(() => {
    if (!naddr.trim()) {
      setAddressPointer(null);
      setError(null);
      return;
    }

    try {
      const decoded = nip19.decode(naddr.trim().replace(/^nostr:/, ""));
      if (decoded.type === "naddr") {
        setAddressPointer(decoded.data);
        setError(null);
      } else {
        throw new Error("Please enter a valid naddr address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid naddr format");
      setAddressPointer(null);
    }
  }, [naddr]);

  // Load article using address pointer
  const article = use$(() => {
    if (!addressPointer) return of(null);

    return eventStore
      .addressable({
        kind: addressPointer.kind,
        pubkey: addressPointer.pubkey,
        identifier: addressPointer.identifier,
        relays: addressPointer.relays,
      })
      .pipe(
        defined(),
        filter((event) => event.kind === kinds.LongFormArticle),
        take(1),
      );
  }, [addressPointer?.kind, addressPointer?.pubkey, addressPointer?.identifier, addressPointer?.relays?.join("|")]);

  return (
    <div className="container mx-auto my-8 max-w-6xl px-4">
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8">Article Highlighter</h1>

        {/* naddr input */}
        <div className="card bg-base-200 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title mb-4">Enter Article Address</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">NIP-23 Article Address (naddr)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`input input-bordered flex-1 ${error ? "input-error" : ""}`}
                  placeholder="naddr1qqs..."
                  value={naddr}
                  onChange={(e) => setNaddr(e.target.value)}
                />
              </div>
              {error && (
                <label className="label">
                  <span className="label-text-alt text-error">{error}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">
                  Enter a nostr naddr address pointing to a NIP-23 long-form article
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {addressPointer && !article && !error && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Article not found */}
        {addressPointer && article === null && (
          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Article not found</h3>
              <div className="text-xs">
                The article could not be loaded. This might be because:
                <ul className="list-disc list-inside mt-1">
                  <li>The naddr address is invalid or malformed</li>
                  <li>The article is not available on the specified relays</li>
                  <li>The article has been deleted or is no longer accessible</li>
                  <li>There may be network connectivity issues</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Render article */}
        {article && <ArticleRenderer article={article} />}

        {/* Instructions */}
        {!addressPointer && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">How to use:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Enter a nostr naddr address pointing to a NIP-23 long-form article</li>
                <li>The article will load and display with full markdown rendering</li>
                <li>Select any text in the article to show the highlight button</li>
                <li>Click the highlight button to open the modal</li>
                <li>Add an optional comment and select relays to publish to</li>
                <li>Publish your highlight as a NIP-84 event</li>
              </ol>
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  This is a demo app. Actual signing and publishing would require a connected signer (like a browser
                  extension or NIP-07 implementation).
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
