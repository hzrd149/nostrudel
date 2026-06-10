/**
 * Create and display long-form articles with comments using NIP-23
 * @tags nip-22, nip-23, content, articles, comments
 * @related content/simple-text, comment/feed
 */
import { ActionRunner } from "applesauce-actions";
import { CreateComment } from "applesauce-actions/actions";
import { Article, Comment } from "applesauce-common/casts";
import { CommentsModel } from "applesauce-common/models";
import { castTimelineStream } from "applesauce-common/observable";
import { remarkNostrMentions } from "applesauce-content/markdown";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RelayPicker from "../../components/relay-picker";

const remarkPlugins = [remarkGfm, remarkNostrMentions];
const markdownComponents = {
  a: ({ ...props }: any) => <a target="_blank" rel="noopener noreferrer" {...props} />,
};

const eventStore = new EventStore();
const pool = new RelayPool();
const signer = new ExtensionSigner();
const actions = new ActionRunner(eventStore, signer, async (event, relays) => {
  if (relays && relays.length > 0) {
    await pool.publish(relays, event);
  } else {
    // Fallback to a default relay if none provided
    await pool.publish(["wss://relay.primal.net/"], event);
  }
});

// Create loaders so the event store can load profiles
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Component for a single article card in the list
function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const author = article.author;
  const profile = use$(author.profile$);

  return (
    <div
      className="flex border border-base-300 rounded-lg h-48 overflow-hidden cursor-pointer hover:bg-base-200 transition-colors"
      onClick={onClick}
    >
      <div className="w-48 min-w-48 h-full shrink-0 overflow-hidden bg-base-200">
        {article.image ? (
          <img src={article.image} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-xs text-base-content/40">No image</div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4 overflow-hidden">
        <h2 className="text-lg font-semibold truncate">{article.title}</h2>
        <p className="text-sm opacity-70">
          By {profile?.displayName || author.npub.slice(0, 8)} • {article.publishedDate.toLocaleDateString()}
        </p>
        <p className="line-clamp-2 text-sm opacity-80">{article.summary}</p>
      </div>
    </div>
  );
}

// Component for the article list view
function ArticleList({
  articles,
  onArticleSelect,
}: {
  articles: Article[];
  onArticleSelect: (article: Article) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onClick={() => onArticleSelect(article)} />
      ))}
    </div>
  );
}

// Component for a single comment
function CommentItem({ comment }: { comment: Comment }) {
  const author = comment.author;
  const profile = use$(author.profile$);

  return (
    <div className="border-b pb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">{profile?.displayName || author.npub.slice(0, 8)}</span>
        <span className="text-sm text-base-content/60">{comment.createdAt.toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-wrap">{comment.event.content}</p>
    </div>
  );
}

// Simple comments section component
function CommentsSection({ article }: { article: Article }) {
  const comments = use$(
    () => eventStore.model(CommentsModel, article.event).pipe(castTimelineStream(Comment, eventStore)),
    [article.id],
  );
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await actions.run(CreateComment, article.event, commentText.trim());
      setCommentText("");
    } catch (err) {
      console.error("Failed to create comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="textarea textarea-bordered w-full mb-2"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          disabled={isSubmitting}
        />
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !commentText.trim()}>
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </form>
      <div className="space-y-4">
        {comments === undefined ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-base-content/60">No comments yet.</div>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  );
}

// Component for the full article view
function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  const author = article.author;
  const profile = use$(author.profile$);

  return (
    <div className="container mx-auto my-8 max-w-3xl px-4">
      <button className="btn btn-ghost gap-2 mb-6" onClick={onBack}>
        ← Back to Articles
      </button>

      {article.image && (
        <img src={article.image} alt={article.title} className="w-full h-64 object-cover rounded-lg mb-8" />
      )}

      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1>{article.title}</h1>
        <p className="lead">By {profile?.displayName || author.npub.slice(0, 8)}</p>

        <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
          {article.event.content}
        </ReactMarkdown>
      </article>

      <CommentsSection article={article} />
    </div>
  );
}

// Main component that orchestrates the entire view
export default function ArticleViewer() {
  const [relay, setRelay] = useState<string>("wss://relay.primal.net/");
  const [selected, setSelected] = useState<Article | null>(null);

  // Subscribe to comments for the selected article
  use$(() => {
    if (!selected) return;
    return pool
      .relay(relay)
      .subscription({
        kinds: [1111],
        "#a": [`30023:${selected.event.pubkey}:${selected.event.tags.find((t) => t[0] === "d")?.[1] || ""}`],
      })
      .pipe(mapEventsToStore(eventStore));
  }, [selected?.id, relay]);

  // Create a timeline observable for articles
  const articles = use$(
    () =>
      pool
        .relay(relay)
        .subscription({
          kinds: [30023],
          since: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
        })
        .pipe(
          // deduplicate events using the event store
          mapEventsToStore(eventStore),
          // collect all events into a timeline
          mapEventsToTimeline(),
          // Cast to Article objects
          castTimelineStream(Article, eventStore),
        ),
    [relay],
  );

  if (selected) {
    return <ArticleView article={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8">Articles</h1>
        <RelayPicker value={relay} onChange={setRelay} />

        {relay && articles && <ArticleList articles={articles} onArticleSelect={setSelected} />}
      </div>
    </div>
  );
}
