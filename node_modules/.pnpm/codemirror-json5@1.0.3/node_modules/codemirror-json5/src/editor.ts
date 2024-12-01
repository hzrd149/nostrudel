import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode, Tree } from '@lezer/common';

// This is the same as CodeMirror's LintSource type but it's not currently exported.
export type LintSource = (
  view: EditorView
) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>;

function stripQuotes(s: string) {
  let first = s[0];
  let last = s[s.length - 1];
  if ((first === `'` && last === `'`) || (first === `"` && last === `"`)) {
    s = s.slice(1, -1);
  }
  return s;
}

function propertyKey(state: EditorState, node: SyntaxNode) {
  if (node.name !== 'Property') {
    return null;
  }

  let key = node.getChild('PropertyName');
  if (!key) {
    return null;
  }

  return stripQuotes(state.sliceDoc(key.from, key.to));
}

function propertyValueNode(node: SyntaxNode | null) {
  if (!node || node.name !== 'Property') {
    return null;
  }

  return validNodeLookLeft(node.lastChild);
}

function getParentProperty(node: SyntaxNode) {
  let cursor = node.parent?.cursor();
  if (!cursor) {
    return null;
  }

  while (cursor.node.name !== 'Property' && cursor.node.name !== 'Array') {
    if (!cursor.parent()) {
      return null;
    }
  }

  return cursor.node;
}

export function getPathAtNode(state: EditorState, node: SyntaxNode) {
  let keys: (string | number)[] = [];

  while (true) {
    let parent = getParentProperty(node);
    if (!parent) {
      break;
    }

    if (parent.name === 'Array') {
      let thisPos = node.from;
      let findNode = parent.firstChild;
      let index = 0;
      while (findNode && findNode.to < thisPos) {
        findNode = validNodeLookRight(findNode.nextSibling);
        index += 1;
      }

      keys.unshift(index);
    } else {
      let key = propertyKey(state, parent);
      if (key) {
        keys.unshift(key);
      }
    }
    node = parent;
  }

  return keys;
}

/** If the passed node is a comment, go left until a non-comment node is found */
function validNodeLookLeft(node: SyntaxNode | null) {
  while (node && /Comment/.test(node.name)) {
    node = node.prevSibling;
  }
  return node;
}

/** If the passed node is a comment, go right until a non-comment node is found */
function validNodeLookRight(node: SyntaxNode | null) {
  while (node && /Comment/.test(node.name)) {
    node = node.nextSibling;
  }
  return node;
}

function findObjectProperty(state: EditorState, node: SyntaxNode | null, name: string) {
  if (node?.name === 'Property') {
    node = propertyValueNode(node);
  }

  if (node?.name !== 'Object') {
    return null;
  }

  let cursor = node.firstChild?.cursor();
  if (!cursor) {
    return null;
  }

  while (propertyKey(state, cursor.node) !== name) {
    if (!cursor.nextSibling()) {
      return null;
    }
  }

  return cursor.node;
}

function findArrayIndex(node: SyntaxNode | null, index: number) {
  if (node?.name === 'Property') {
    node = propertyValueNode(node);
  }

  if (node?.name !== 'Array') {
    return null;
  }

  let cursor = node.firstChild?.cursor();
  if (!cursor) {
    return null;
  }

  for (let i = 1; i < index; ++i) {
    if (!cursor.nextSibling()) {
      return null;
    }
  }

  return cursor.node;
}

// TODO Cache partial tree lookups for multiple calls on a tree.
export function nodeFromPath(state: EditorState, tree: Tree, path: (string | number)[]) {
  let node: SyntaxNode | null = tree.topNode.firstChild;

  let i: number;
  for (i = 0; i < path.length; ++i) {
    let desired = path[i];

    if (typeof desired === 'number') {
      node = findArrayIndex(node, desired);
    } else {
      node = findObjectProperty(state, node, desired);
    }

    if (!node) {
      break;
    }
  }

  let key = node?.getChild('PropertyName');
  let value = propertyValueNode(node);

  let found = i === path.length;
  return {
    found,
    path: found ? path : path.slice(0, i),
    property: node,
    key: key
      ? {
          from: key.from,
          to: key.to,
          text: state.sliceDoc(key.from, key.to),
        }
      : null,
    value: value
      ? {
          from: value.from,
          to: value.to,
          text: state.sliceDoc(value.from, value.to),
        }
      : null,
  };
}

export function nodeAtCursor(state: EditorState, cursorPos: number): SyntaxNode {
  let tree = syntaxTree(state);
  let node = tree.resolveInner(cursorPos, -1);

  // If we're in whitespace between nodes, `resolveInner` will match on the parent node of the children
  // the cursor is between, so find the actual closest node.
  while (node) {
    let child = node.childBefore(cursorPos);
    if (!child) {
      break;
    }

    node = child;
  }

  return node;
}
