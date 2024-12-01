# mdast-util-wiki-link

[![npm version](https://badge.fury.io/js/mdast-util-wiki-link.svg)](https://badge.fury.io/js/mdast-util-wiki-link) [![Build Status](https://travis-ci.org/landakram/mdast-util-wiki-link.svg?branch=master)](https://travis-ci.org/landakram/mdast-util-wiki-link)

Extension for [`mdast-util-from-markdown`](https://github.com/syntax-tree/mdast-util-from-markdown) and
[`mdast-util-to-markdown`](https://github.com/syntax-tree/mdast-util-to-markdown) to support `[[Wiki Links]]`.

* Parse wiki-style links and render them as anchors
* Differentiate between "new" and "existing" wiki links by giving the parser a list of existing permalinks
* Parse aliased wiki links i.e `[[Real Page:Page Alias]]`

Using [remark](https://github.com/remarkjs/remark)? You might want to use 
[`remark-wiki-link`](https://github.com/landakram/remark-wiki-link) instead of using this package directly.

## Usage

### Markdown to AST

```javascript
import fromMarkdown from 'mdast-util-from-markdown'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'

let ast = fromMarkdown('[[Test Page]]', {
  extensions: [syntax()],
  mdastExtensions: [wikiLink.fromMarkdown()]
})
```

The AST node will look like this:

```javascript
{
    value: 'Test Page',
    data: {
        alias: 'Test Page',
        permalink: 'test_page',
        exists: false,
        hName: 'a',
        hProperties: {
            className: 'internal new',
            href: '#/page/test_page'
        },
        hChildren: [{
            type: 'text',
            value: 'Test Page'
        }]
    }
}
```

* `data.alias`: The display name for this link
* `data.permalink`: The permalink for this page. This permalink is computed from `node.value` using `options.pageResolver`, which can be passed in when initializing the plugin. 
* `data.exists`: Whether the page exists. A page exists if its permalink is found in `options.permalinks`, passed when initializing the plugin.
* `data.hProperties.className`: Classes that are automatically attached to the `a` when it is rendered as HTML. These are configurable with `options.wikiLinkClassName` and `options.newClassName`. `options.newClassName` is attached when `data.exists` is false.
* `data.hProperties.href`: `href` value for the rendered `a`. This `href` is computed using `options.hrefTemplate`.

The `hName` and other `h` fields provide compatibility with [`rehype`](https://github.com/rehypejs/rehype).

### AST to Markdown

Taking the `ast` from the prior example, let's go back to markdown:

```javascript
import { fromMarkdown } from 'mdast-util-from-markdown'
import * as wikiLink from 'mdast-util-wiki-link'

let markdownString = toMarkdown(ast, { extensions: [wikiLink.toMarkdown()] }).trim()
console.log(markdownString)
// [[Wiki Link]]
```

### Configuration options

Both `fromMarkdown` and `toMarkdown` accept configuration as an object.

For example, one may configure `fromMarkdown` like so:

```javascript
let ast = fromMarkdown('[[Test Page]]', {
  extensions: [syntax()],
  mdastExtensions: [wikiLink.fromMarkdown({ permalinks: ['wiki_page'] })] // <--
})
```

#### `fromMarkdown`

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

#### `toMarkdown`

* `options.aliasDivider [String]`: a string to be used as the divider for aliases. See the section below on [Aliasing pages](#aliasing-pages). Defaults to `":"`.

### Aliasing pages

Aliased pages are supported with the following markdown syntax: 

```
[[Real Page:Page Alias]]
```

And will produce this HTML when rendered:

```
<a class="internal new" href="#/page/real_page">Page Alias</a>
```





