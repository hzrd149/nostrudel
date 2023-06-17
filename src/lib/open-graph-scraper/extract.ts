import { load } from "cheerio";

import fallback from "./fallback";
import fields from "./fields";
import mediaSetup from "./media";

import type { OgObjectInteral } from "./types";

/**
 * extract all of the meta tags needed for ogs
 *
 * @param {sting} body - the body of the fetch request
 * @param {object} options - options for ogs
 * @return {object} object with ogs results
 *
 */
export default function extractMetaTags(body: string, useFallbacks = true) {
  let ogObject: OgObjectInteral = {};
  const $ = load(body);
  const metaFields = fields;

  // find all of the open graph info in the meta tags
  $("meta").each((index, meta) => {
    if (!meta.attribs || (!meta.attribs.property && !meta.attribs.name)) return;
    const property = meta.attribs.property || meta.attribs.name;
    const content = meta.attribs.content || meta.attribs.value;
    metaFields.forEach((item) => {
      if (item && property.toLowerCase() === item.property.toLowerCase()) {
        if (!item.multiple) {
          // @ts-ignore
          ogObject[item.fieldName] = content;
          // @ts-ignore
        } else if (!ogObject[item.fieldName]) {
          // @ts-ignore
          ogObject[item.fieldName] = [content];
          // @ts-ignore
        } else if (Array.isArray(ogObject[item.fieldName])) {
          // @ts-ignore
          ogObject[item.fieldName].push(content);
        }
      }
    });
  });

  // formats the multiple media values
  ogObject = mediaSetup(ogObject);

  // if onlyGetOpenGraphInfo isn't set, run the open graph fallbacks
  if (useFallbacks) {
    ogObject = fallback(ogObject, $);
  }

  return ogObject;
}
