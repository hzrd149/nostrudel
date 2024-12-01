interface FromMarkdownOptions {
  permalinks?: string[];
  pageResolver?: (name: string) => string[];
  newClassName?: string;
  wikiLinkClassName?: string;
  hrefTemplate?: (permalink: string) => string;
}

function fromMarkdown (opts: FromMarkdownOptions = {}) {
  const permalinks = opts.permalinks || []
  const defaultPageResolver = (name: string) => [name.replace(/ /g, '_').toLowerCase()]
  const pageResolver = opts.pageResolver || defaultPageResolver
  const newClassName = opts.newClassName || 'new'
  const wikiLinkClassName = opts.wikiLinkClassName || 'internal'
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`
  const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate
  let node: any

  function enterWikiLink (this: any, token: any) {
    node = {
      type: 'wikiLink',
      value: null,
      data: {
        alias: null,
        permalink: null,
        exists: null
      }
    }
    this.enter(node, token)
  }

  function top (stack: any) {
    return stack[stack.length - 1]
  }

  function exitWikiLinkAlias (this: any, token: any) {
    const alias = this.sliceSerialize(token)
    const current = top(this.stack)
    current.data.alias = alias
  }

  function exitWikiLinkTarget (this: any, token: any) {
    const target = this.sliceSerialize(token)
    const current = top(this.stack)
    current.value = target
  }

  function exitWikiLink (this: any, token: any) {
    this.exit(token)
    const wikiLink = node

    const pagePermalinks = pageResolver(wikiLink.value)
    const target = pagePermalinks.find(p => permalinks.indexOf(p) !== -1)
    const exists = target !== undefined

    let permalink: string
    if (exists) {
      permalink = target
    } else {
      permalink = pagePermalinks[0] || ''
    }

    let displayName = wikiLink.value
    if (wikiLink.data.alias) {
      displayName = wikiLink.data.alias
    }

    let classNames = wikiLinkClassName
    if (!exists) {
      classNames += ' ' + newClassName
    }

    wikiLink.data.alias = displayName
    wikiLink.data.permalink = permalink
    wikiLink.data.exists = exists

    wikiLink.data.hName = 'a'
    wikiLink.data.hProperties = {
      className: classNames,
      href: hrefTemplate(permalink)
    }
    wikiLink.data.hChildren = [{
      type: 'text',
      value: displayName
    }]
  }

  return {
    enter: {
      wikiLink: enterWikiLink
    },
    exit: {
      wikiLinkTarget: exitWikiLinkTarget,
      wikiLinkAlias: exitWikiLinkAlias,
      wikiLink: exitWikiLink
    }
  }
}

export { fromMarkdown }
