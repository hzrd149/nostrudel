# remark-wiki-link
[![npm version](https://badge.fury.io/js/remark-wiki-link.svg)](https://badge.fury.io/js/remark-wiki-link) [![Build Status](https://travis-ci.org/landakram/remark-wiki-link.svg?branch=master)](https://travis-ci.org/landakram/remark-wiki-link)

⚠️ This plugin is affected by the new parser in remark ([`micromark`](https://github.com/micromark/micromark), see [`remarkjs/remark#536`](https://github.com/remarkjs/remark/pull/536)). **For remark 12, use v0.0.x of this package**. **For remark 13+, use v1.0.0 or above.**

This [remark](https://github.com/wooorm/remark) plugin parses and renders `[[Wiki Links]]`.

* Parse wiki-style links and render them as anchors
* Differentiate between "new" and "existing" wiki links by giving the parser a list of existing permalinks
* Parse aliased wiki links i.e `[[Real Page:Page Alias]]`

Looking for lower level packages? Check out [mdast-util-wiki-link](https://github.com/landakram/mdast-util-wiki-link/) for working with ASTs and [micromark-extension-wiki-link](https://github.com/landakram/micromark-extension-wiki-link) for working with tokens.

## Usage

```javascript
const unified = require('unified')
const markdown = require('remark-parse')
const wikiLinkPlugin = require('remark-wiki-link');

let processor = unified()
    .use(markdown, { gfm: true })
    .use(wikiLinkPlugin)
```

When the processor is run, wiki links will be parsed to a `wikiLink` node. 

If we have this markdown string: 

```
[[Test Page]]
```

A node will be created that looks like this:

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

When rendered to HTML, we get:

```
<a class="internal new" href="#/page/test_page">Test Page</a>
```

### Configuration options

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

* `options.wikiLinkClassName`: a class name that is attached to any rendered wiki links. Defaults to `"internal"`.
* `options.newClassName`: a class name that is attached to any rendered wiki links that do not exist. Defaults to `"new"`.
* `options.aliasDivider`: a string for `aliased pages`.

#### Aliasing pages

Aliased pages are supported with the following markdown syntax: 

```
[[Real Page:Page Alias]]
```

The AST node will look like: 

```javascript
{
    value: 'Real Page',
    data: {
        alias: 'Page Alias',
        permalink: 'real_page',
        exists: false,
        hName: 'a',
        hProperties: {
            className: 'internal new',
            href: '#/page/real_page'
        },
        hChildren: [{
            type: 'text',
            value: 'Page Alias'
        }]
    }
}
```

And will produce this HTML when rendered:

```
<a class="internal new" href="#/page/real_page">Page Alias</a>
```
