import { describe, expect, it, vi } from "vitest";
import { blossomURIs, getParsedContent, links } from "applesauce-content/text";
import { remarkBlossomURIs } from "applesauce-content/markdown";
import { remark } from "remark";

import { getContentBlobUrls } from "./blossom";

const hash = "a".repeat(64);
const author = "b".repeat(64);
const owner = "c".repeat(64);

describe("BUD-10 content", () => {
  it.each(["png", "mp4", "mp3", "m3u8", "pdf"])("preserves %s URIs as dedicated nodes", (ext) => {
    const uri = `blossom:${hash}.${ext}?xs=cdn.example.com&as=${author}&sz=123`;
    const tree = getParsedContent(`Before ${uri} after`);
    expect(tree.children).toEqual([
      expect.objectContaining({ type: "text", value: "Before " }),
      expect.objectContaining({ type: "blossom", raw: uri, sha256: hash, ext, authors: [author], size: 123 }),
      expect.objectContaining({ type: "text", value: " after" }),
    ]);
  });

  it("parses blossom before HTTP links in compact/custom pipelines", () => {
    const uri = `blossom:${hash}.png?xs=https://cdn.example.com`;
    const tree = getParsedContent(uri, undefined, [blossomURIs, links]);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toMatchObject({ type: "blossom", raw: uri });
  });

  it("keeps malformed URIs visible as text", () => {
    const raw = "blossom:not-a-hash.png";
    expect(getParsedContent(raw).children).toEqual([expect.objectContaining({ type: "text", value: raw })]);
  });

  it("turns bare Markdown URIs into links without touching code", () => {
    const uri = `blossom:${hash}.pdf?xs=cdn.example.com`;
    const processor = remark().use(() => (tree, file) => {
      remarkBlossomURIs()(tree as Parameters<ReturnType<typeof remarkBlossomURIs>>[0], file, () => {});
    });
    const result = processor.runSync(processor.parse(`${uri}\n\n\`${uri}\``));
    expect(result).toMatchObject({
      type: "root",
      children: [
        { type: "paragraph", children: [expect.objectContaining({ type: "link", url: uri })] },
        { type: "paragraph", children: [{ type: "inlineCode", value: uri }] },
      ],
    });
  });

  it("orders and deduplicates server hints, author hints, and event author fallbacks", async () => {
    const getServers = vi.fn(async (pubkey: string) =>
      pubkey === author
        ? ["https://hint.example.com", "https://cdn.example.com/"]
        : [new URL("https://owner.example.com")],
    );
    const urls = await getContentBlobUrls(
      `blossom:${hash}.png?xs=cdn.example.com&xs=backup.example.com&as=${author}`,
      getServers,
      owner,
    );
    expect(urls).toEqual([
      `https://cdn.example.com/${hash}.png`,
      `https://backup.example.com/${hash}.png`,
      `https://hint.example.com/${hash}.png`,
      `https://owner.example.com/${hash}.png`,
    ]);
    expect(getServers).toHaveBeenCalledWith(author);
    expect(getServers).toHaveBeenCalledWith(owner);
  });

  it("ignores non-HTTP server hints", async () => {
    const urls = await getContentBlobUrls(
      `blossom:${hash}.pdf?xs=javascript:alert(1)&xs=cdn.example.com`,
      async () => undefined,
    );
    expect(urls).toEqual([`https://cdn.example.com/${hash}.pdf`]);
  });

  it("resolves explicit server hints without an event author", async () => {
    expect(await getContentBlobUrls(`blossom:${hash}.pdf?xs=cdn.example.com`, async () => undefined)).toEqual([
      `https://cdn.example.com/${hash}.pdf`,
    ]);
  });
});
