# micromark-extension-wiki-link

[![npm version](https://badge.fury.io/js/micromark-extension-wiki-link.svg)](https://badge.fury.io/js/micromark-extension-wiki-link) [![Build Status](https://travis-ci.org/landakram/micromark-extension-wiki-link.svg?branch=master)](https://travis-ci.org/landakram/micromark-extension-wiki-link)

This [micromark](https://github.com/micromark/micromark) extension parses and renders `[[Wiki Links]]`.

* Parse wiki-style links and render them as anchors
* Differentiate between "new" and "existing" wiki links by giving the parser a list of existing permalinks
* Parse aliased wiki links i.e `[[Real Page:Page Alias]]`

Using [remark](https://github.com/remarkjs/remark)? You might want to use 
[`remark-wiki-link`](https://github.com/landakram/remark-wiki-link) instead of using this package directly.

## Usage

```javascript
import { syntax, html } from 'micromark-extension-wiki-link';

let serialized = micromark('[[Wiki Link]]', {
  extensions: [syntax()],
  htmlExtensions: [html()]
});

console.log(serialized);
// <p><a href="#/page/wiki_link" class="internal">Wiki Link</a></p>
```

### Configuration options

Both the syntax extension and html extension can be configured by passing an object.

For example, one may configure the syntax extension like so:

```javascript
let serialized = micromark('[[Wiki Link]]', {
  extensions: [syntax({ aliasDivider: "|" })],
  htmlExtensions: [html()]
});
```

#### `syntax`

* `options.aliasDivider [String]`: a string to be used as the divider for aliases. See the section below on [Aliasing pages](#aliasing-pages). Defaults to `":"`.

#### `html`

* `options.permalinks [String]`: An array of permalinks that should be considered existing pages. If a wiki link is parsed and its permalink matches one of these permalinks, `node.data.exists` will be true.
* `options.pageResolver (pageName: String) -> [String]`: A function that maps a page name to an array of possible permalinks. These possible permalinks are cross-referenced with `options.permalinks` to determine whether a page exists. If a page doesn't exist, the first element of the array is considered the permalink.

  The default `pageResolver` is:

```javascript
(name) => [name.replace(/ /g, '_').toLowerCase()]
```

* `options.hrefTemplate (permalink: String) -> String`: A function that maps a permalink to some path. This path is used as the `href` for the rendered `a`.

  The default `hrefTemplate` is:
  
```javascript
(permalink) => `#/page/${permalink}`
```

* `options.wikiLinkClassName [String]`: a class name that is attached to any rendered wiki links. Defaults to `"internal"`.
* `options.newClassName [String]`: a class name that is attached to any rendered wiki links that do not exist. Defaults to `"new"`.

### Aliasing pages

Aliased pages are supported with the following markdown syntax: 

```
[[Real Page:Page Alias]]
```

And will produce this HTML when rendered:

```
<a class="internal new" href="#/page/real_page">Page Alias</a>
```





