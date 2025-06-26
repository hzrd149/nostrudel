import { findImageTypeFromUrl, isImageTypeValid, isUrlValid } from "./utils";
import type { ImageObject, OgObjectInteral } from "./types";

const doesElementExist = (selector: string, attribute: string, doc: Document) => {
  const element = doc.querySelector(selector);
  return element?.getAttribute(attribute) && (element.getAttribute(attribute)?.length || 0) > 0;
};

/**
 * ogs fallbacks
 *
 * @param {object} ogObject - the current ogObject
 * @param {Document} doc - Document from DOMParser of the current html
 * @return {object} object with ogs results with updated fallback values
 *
 */
export function fallback(ogObject: OgObjectInteral, doc: Document) {
  // title fallback
  if (!ogObject.ogTitle) {
    const titleElement = doc.querySelector("title");
    if (titleElement?.textContent && titleElement.textContent.length > 0) {
      ogObject.ogTitle = titleElement.textContent;
    } else if (doesElementExist('head > meta[name="title"]', "content", doc)) {
      ogObject.ogTitle = doc.querySelector('head > meta[name="title"]')?.getAttribute("content") || undefined;
    } else {
      const postTitle = doc.querySelector(".post-title");
      if (postTitle?.textContent && postTitle.textContent.length > 0) {
        ogObject.ogTitle = postTitle.textContent;
      } else {
        const entryTitle = doc.querySelector(".entry-title");
        if (entryTitle?.textContent && entryTitle.textContent.length > 0) {
          ogObject.ogTitle = entryTitle.textContent;
        } else {
          const h1TitleA = doc.querySelector('h1[class*="title" i] a');
          if (h1TitleA?.textContent && h1TitleA.textContent.length > 0) {
            ogObject.ogTitle = h1TitleA.textContent;
          } else {
            const h1Title = doc.querySelector('h1[class*="title" i]');
            if (h1Title?.textContent && h1Title.textContent.length > 0) {
              ogObject.ogTitle = h1Title.textContent;
            }
          }
        }
      }
    }
  }

  // Get meta description tag if og description was not provided
  if (!ogObject.ogDescription) {
    if (doesElementExist('head > meta[name="description"]', "content", doc)) {
      ogObject.ogDescription =
        doc.querySelector('head > meta[name="description"]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('head > meta[itemprop="description"]', "content", doc)) {
      ogObject.ogDescription =
        doc.querySelector('head > meta[itemprop="description"]')?.getAttribute("content") || undefined;
    } else {
      const descElement = doc.querySelector("#description");
      if (descElement?.textContent && descElement.textContent.length > 0) {
        ogObject.ogDescription = descElement.textContent;
      }
    }
  }

  // Get all of images if there is no og:image info
  if (!ogObject.ogImage) {
    ogObject.ogImage = [];
    const images = doc.querySelectorAll("img");
    images.forEach((imageElement) => {
      const source: string = imageElement.getAttribute("src") || "";
      if (!source) return;
      const type = findImageTypeFromUrl(source);
      if (!isUrlValid(source) || !isImageTypeValid(type)) return;
      const fallbackImage: ImageObject = {
        url: source,
        type,
      };
      const width = imageElement.getAttribute("width");
      const height = imageElement.getAttribute("height");
      if (width && Number(width)) fallbackImage.width = Number(width);
      if (height && Number(height)) fallbackImage.height = Number(height);
      ogObject.ogImage?.push(fallbackImage);
    });
    ogObject.ogImage = ogObject.ogImage
      .filter((value) => value.url !== undefined && value.url !== "")
      .filter((value, index) => index < 10);
    if (ogObject.ogImage.length === 0) delete ogObject.ogImage;
  } else if (ogObject.ogImage) {
    ogObject.ogImage.forEach((image) => {
      if (image.url && !image.type) {
        const type = findImageTypeFromUrl(image.url);
        if (isImageTypeValid(type)) image.type = type;
      }
    });
  }

  // audio fallback
  if (!ogObject.ogAudioURL && !ogObject.ogAudioSecureURL) {
    const audioElement = doc.querySelector("audio");
    const audioSourceElement = doc.querySelector("audio > source");
    const audioElementValue: string = audioElement?.getAttribute("src") || "";
    const audioSourceElementValue: string = audioSourceElement?.getAttribute("src") || "";

    if (doesElementExist("audio", "src", doc)) {
      if (audioElementValue.startsWith("https")) {
        ogObject.ogAudioSecureURL = audioElementValue;
      } else {
        ogObject.ogAudioURL = audioElementValue;
      }
      const audioElementTypeValue: string = audioElement?.getAttribute("type") || "";
      if (!ogObject.ogAudioType && doesElementExist("audio", "type", doc)) ogObject.ogAudioType = audioElementTypeValue;
    } else if (doesElementExist("audio > source", "src", doc)) {
      if (audioSourceElementValue.startsWith("https")) {
        ogObject.ogAudioSecureURL = audioSourceElementValue;
      } else {
        ogObject.ogAudioURL = audioSourceElementValue;
      }
      const audioSourceElementTypeValue: string = audioSourceElement?.getAttribute("type") || "";
      if (!ogObject.ogAudioType && doesElementExist("audio > source", "type", doc))
        ogObject.ogAudioType = audioSourceElementTypeValue;
    }
  }

  // locale fallback
  if (!ogObject.ogLocale) {
    if (doesElementExist("html", "lang", doc)) {
      ogObject.ogLocale = doc.querySelector("html")?.getAttribute("lang") || undefined;
    } else if (doesElementExist('head > meta[itemprop="inLanguage"]', "content", doc)) {
      ogObject.ogLocale = doc.querySelector('head > meta[itemprop="inLanguage"]')?.getAttribute("content") || undefined;
    }
  }

  // logo fallback
  if (!ogObject.ogLogo) {
    if (doesElementExist('meta[itemprop="logo"]', "content", doc)) {
      ogObject.ogLogo = doc.querySelector('meta[itemprop="logo"]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('img[itemprop="logo"]', "src", doc)) {
      ogObject.ogLogo = doc.querySelector('img[itemprop="logo"]')?.getAttribute("src") || undefined;
    }
  }

  // url fallback
  if (!ogObject.ogUrl) {
    if (doesElementExist('link[rel="canonical"]', "href", doc)) {
      ogObject.ogUrl = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[rel="alternate"][hreflang="x-default"]', "href", doc)) {
      ogObject.ogUrl =
        doc.querySelector('link[rel="alternate"][hreflang="x-default"]')?.getAttribute("href") || undefined;
    }
  }

  // date fallback
  if (!ogObject.ogDate) {
    if (doesElementExist('head > meta[name="date"]', "content", doc)) {
      ogObject.ogDate = doc.querySelector('head > meta[name="date"]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('[itemprop*="datemodified" i]', "content", doc)) {
      ogObject.ogDate = doc.querySelector('[itemprop*="datemodified" i]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('[itemprop="datepublished" i]', "content", doc)) {
      ogObject.ogDate = doc.querySelector('[itemprop="datepublished" i]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('[itemprop*="date" i]', "content", doc)) {
      ogObject.ogDate = doc.querySelector('[itemprop*="date" i]')?.getAttribute("content") || undefined;
    } else if (doesElementExist('time[itemprop*="date" i]', "datetime", doc)) {
      ogObject.ogDate = doc.querySelector('time[itemprop*="date" i]')?.getAttribute("datetime") || undefined;
    } else if (doesElementExist("time[datetime]", "datetime", doc)) {
      ogObject.ogDate = doc.querySelector("time[datetime]")?.getAttribute("datetime") || undefined;
    }
  }

  // favicon fallback
  if (!ogObject.favicon) {
    if (doesElementExist('link[rel="shortcut icon"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[rel="icon"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[rel="icon"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[rel="mask-icon"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[rel="mask-icon"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[rel="apple-touch-icon"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[type="image/png"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[type="image/png"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[type="image/ico"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[type="image/ico"]')?.getAttribute("href") || undefined;
    } else if (doesElementExist('link[type="image/x-icon"]', "href", doc)) {
      ogObject.favicon = doc.querySelector('link[type="image/x-icon"]')?.getAttribute("href") || undefined;
    }
  }

  return ogObject;
}

export default fallback;
