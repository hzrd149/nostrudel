import unified from 'unified'
import markdown from 'remark-parse'
import visit from 'unist-util-visit'
import remark2markdown from 'remark-stringify'
import { Node, Data } from 'unist'

import wikiLinkPlugin, { wikiLinkPlugin as namedWikiLinkPlugin } from '../src'
import select from 'unist-util-select'

interface WikiLinkHProperties {
  className: string;
  href: string;
  [key: string]: unknown;
}

interface WikiLinkData extends Data {
  exists: boolean;
  permalink: string;
  hProperties: WikiLinkHProperties;
  hChildren: Array<{value: string}>
}

interface WikiLinkNode extends Node {
  data: WikiLinkData;
}

function assertWikiLink (obj: Node): asserts obj is WikiLinkNode {
  if (!obj.data || obj.data.exists === undefined || obj.data.permalink === undefined) {
    throw new Error('Not a wiki link')
  }
}

describe('remark-wiki-link', () => {
  test('parses a wiki link that has a matching permalink', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, {
        permalinks: ['wiki_link']
      })

    let ast = processor.parse('[[Wiki Link]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', (node) => {
      assertWikiLink(node)

      expect(node.data.exists).toEqual(true)
      expect(node.data.permalink).toEqual('wiki_link')
      expect(node.data.hName).toEqual('a')
      expect(node.data.hProperties.className).toEqual('internal')
      expect(node.data.hProperties.href).toEqual('#/page/wiki_link')
      expect(node.data.hChildren[0].value).toEqual('Wiki Link')
    })
  })

  test('parses a wiki link that has no matching permalink', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, {
        permalinks: []
      })

    let ast = processor.parse('[[New Page]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', (node) => {
      assertWikiLink(node)

      expect(node.data.exists).toEqual(false)
      expect(node.data.permalink).toEqual('new_page')
      expect(node.data.hName).toEqual('a')
      expect(node.data.hProperties.className).toEqual('internal new')
      expect(node.data.hProperties.href).toEqual('#/page/new_page')
      expect(node.data.hChildren[0].value).toEqual('New Page')
    })
  })

  test('handles wiki links with aliases', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, {
        permalinks: []
      })

    let ast = processor.parse('[[Real Page:Page Alias]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', (node) => {
      assertWikiLink(node)

      expect(node.data.exists).toEqual(false)
      expect(node.data.permalink).toEqual('real_page')
      expect(node.data.hName).toEqual('a')
      expect(node.data.alias).toEqual('Page Alias')
      expect(node.value).toEqual('Real Page')
      expect(node.data.hProperties.className).toEqual('internal new')
      expect(node.data.hProperties.href).toEqual('#/page/real_page')
      expect(node.data.hChildren[0].value).toEqual('Page Alias')
    })
  })

  test('handles wiki alias links with custom divider', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, {
        permalinks: [],
        aliasDivider: '|'
      })

    let ast = processor.parse('[[Real Page|Page Alias]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', node => {
      assertWikiLink(node)

      expect(node.data.exists).toEqual(false)
      expect(node.data.permalink).toEqual('real_page')
      expect(node.data.hName).toEqual('a')
      expect(node.data.alias).toEqual('Page Alias')
      expect(node.value).toEqual('Real Page')
      expect(node.data.hProperties.className).toEqual('internal new')
      expect(node.data.hProperties.href).toEqual('#/page/real_page')
      expect(node.data.hChildren[0].value).toEqual('Page Alias')
    })
  })

  test('stringifies wiki links', () => {
    const processor = unified()
      .use(markdown)
      .use(remark2markdown)
      .use(wikiLinkPlugin, { permalinks: ['wiki_link'] })

    const stringified = processor.processSync('[[Wiki Link]]').contents.toString().trim()
    expect(stringified).toEqual('[[Wiki Link]]')
  })

  test('stringifies aliased wiki links', () => {
    const processor = unified()
      .use(markdown)
      .use(remark2markdown)
      .use(wikiLinkPlugin)

    const stringified = processor.processSync('[[Real Page:Page Alias]]').contents.toString().trim()
    expect(stringified).toEqual('[[Real Page:Page Alias]]')
  })

  describe('configuration options', () => {
    test('uses pageResolver', () => {
      const identity = (name: string) => [name]

      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          pageResolver: identity,
          permalinks: ['A Page']
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.exists).toEqual(true)
        expect(node.data.permalink).toEqual('A Page')
        expect(node.data.hProperties.href).toEqual('#/page/A Page')
      })
    })

    test('uses newClassName', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          newClassName: 'new_page'
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.hProperties.className).toEqual('internal new_page')
      })
    })

    test('uses hrefTemplate', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          hrefTemplate: (permalink: string) => permalink
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.hProperties.href).toEqual('a_page')
      })
    })

    test('uses wikiLinkClassName', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          wikiLinkClassName: 'wiki_link',
          permalinks: ['a_page']
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.hProperties.className).toEqual('wiki_link')
      })
    })
  })

  describe('open wiki links', () => {
    test('handles open wiki links', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        })

      let ast = processor.parse('t[[\nt')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links at end of file', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        })

      let ast = processor.parse('t [[')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial data', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        })

      let ast = processor.parse('t [[tt\nt')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial alias divider', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          aliasDivider: '::',
          permalinks: []
        })

      let ast = processor.parse('[[t::\n')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial alias', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        })

      let ast = processor.parse('[[t:\n')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })
  })

  test('exports the plugin with named exports', () => {
    expect(wikiLinkPlugin).toEqual(namedWikiLinkPlugin)
  })
})
