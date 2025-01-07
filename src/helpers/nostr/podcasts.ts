import { getHiddenTags, processTags } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { v5 as UUIDv5 } from "uuid";

export const PODCAST_GUID_NS = "ead4c236-bf58-58c6-a2c6-a6b28d128cb6";
export const PODCASTS_LIST_KIND = 10104;

export const NAMESPACES = {
  atom: "http://www.w3.org/2005/Atom",
  itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
  podcast: "https://podcastindex.org/namespace/1.0",
  spotify: "http://www.spotify.com/ns/rss",
  content: "http://purl.org/rss/1.0/modules/content/",
} as const;

const resolver: XPathNSResolver = (prefix: string | null): string | null => {
  return (prefix && NAMESPACES[prefix as keyof typeof NAMESPACES]) || null;
};

export type FeedPointer = {
  guid: string;
  url: URL;
};

export function getFeedPointerFromITag(tag: string[]): FeedPointer {
  if (tag.length < 3) throw new Error("Tag too short");

  const guid = tag[1];
  const url = new URL(tag[2]);

  return { guid, url };
}

export function getFeedPointers(list: NostrEvent) {
  const hidden = getHiddenTags(list);
  return processTags(hidden ? [...hidden, ...list.tags] : list.tags, getFeedPointerFromITag);
}

function getNodeDocument(xml: Document | Node | Element) {
  if (xml instanceof Document) return xml;
  else if (xml instanceof Element) return xml.ownerDocument;
  else if (!xml.parentElement) throw new Error("Disconnected node");
  else return xml.parentElement instanceof Document ? xml.parentElement : xml.parentElement.ownerDocument;
}

export function getXPathString(xml: Document | Element, selector: string): string;
export function getXPathString(xml: Document | Element, selector: string, safe: true): string | undefined;
export function getXPathString(xml: Document | Element, selector: string, safe: false): string;
export function getXPathString(xml: Document | Element, selector: string, safe = false) {
  try {
    return getNodeDocument(xml).evaluate(selector, xml, resolver, XPathResult.STRING_TYPE).stringValue;
  } catch (error) {
    if (!safe) throw error;
  }
}
export function getXPathElements(node: Document | Element, selector: string): Element[] {
  const iterator = getNodeDocument(node).evaluate(selector, node, resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
  const items: Element[] = [];

  let item: Node | null;
  while ((item = iterator.iterateNext())) {
    if (item instanceof Element) items.push(item);
  }

  return items;
}

export function getPodcastTitle(xml: Document): string {
  return getXPathString(xml, "//title");
}
export function getPodcastDescription(xml: Document): string {
  return getXPathString(xml, "//description");
}
export function getPodcastImageURL(xml: Document): string {
  return xml.evaluate("//image/url", xml, resolver, XPathResult.STRING_TYPE).stringValue;
}
export function getPodcastLink(xml: Document): string {
  return getXPathString(xml, "//link");
}
export function getPodcastFeedGUID(url: string) {
  return UUIDv5(url.replace(/http?s:\/\//i, ""), PODCAST_GUID_NS);
}
export function getPodcastGUID(xml: Document): string {
  let guid = xml.evaluate("//podcast:guid", xml, resolver, XPathResult.STRING_TYPE).stringValue;
  if (guid) return guid;

  const link = getXPathString(xml, "//atom:link/@href");
  return getPodcastFeedGUID(link);
}

export function getPodcastItems(xml: Document) {
  return getXPathElements(xml, "//item");
}

export type PodcastPerson = {
  href?: string;
  image?: string;
  name: string;
  group?: string;
  roll?: string;
};
export function getPodcastPeople(xml: Document | Element) {
  const items = getXPathElements(xml, "podcast:person");
  const people: PodcastPerson[] = [];
  for (const item of items) {
    if (!item.textContent) continue;

    people.push({
      name: item.textContent,
      image: item.getAttribute("img") ?? undefined,
      href: item.getAttribute("href") ?? undefined,
      group: item.getAttribute("group") ?? undefined,
      roll: item.getAttribute("roll") ?? undefined,
    });
  }

  return people;
}
