# DnD Multi Backend [![NPM Version][npm-image]][npm-url] [![dependencies Status][deps-image]][deps-url] [![devDependencies Status][deps-dev-image]][deps-dev-url]

[Try it here!](https://louisbrunner.github.io/dnd-multi-backend/examples/dnd-multi-backend.html)

This project is a Drag'n'Drop backend compatible with [DnD Core](https://github.com/react-dnd/react-dnd/tree/master/packages/dnd-core).
It enables your application to use different DnD backends depending on the situation. This package is completely frontend-agnostic, you can refer to [this page](https://github.com/LouisBrunner/dnd-multi-backend) for frontend-specific packages. This means if your front-end is not yet supported, you'll have to roll out your own.

See the [migration section](#migrating) for instructions when switching from `5.0.x` or `6.x.x`.

## Installation

```sh
npm install -S dnd-multi-backend
```

## Usage & Example

You should only use this package if your framework is not in the supported list:
 - [React](../react-dnd-multi-backend)
 - [Angular](https://github.com/cormacrelf/angular-skyhook)

In this case, you will need to write a [custom pipeline](../react-dnd-multi-backend#create-a-custom-pipeline) including as many `dnd-core` backends as you wish. See also the [examples](examples/) for more information.

```js
import { createDragDropManager } from 'dnd-core'
import { MultiBackend } from 'dnd-multi-backend'

// Define the backend and pipeline
class HTML5Backend {
  constructor(manager) {
    this.manager = manager
  }

  setup() {}
  teardown() {}

  connectDragSource(sourceId, node, options) {
    ...

    return () => {}
  }

  connectDragPreview(previewId, node, options) {
    ...

    return () => {}
  }

  connectDropTarget(targetId, node, options) {
    ...

    return () => {}
  }
}

...

const pipeline = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      preview: true,
      transition: TouchTransition,
    },
  ],
}

// Setup the manager
const manager = createDragDropManager(MultiBackend, {}, pipeline)
const registry = manager.getRegistry()

// Setup your DnD logic
class Source {
  ...

  canDrag() {}
  beginDrag() {}
  isDragging() {}
  endDrag() {}
}

class Target {
  ...

  canDrop() {}
  hover() {}
  drop() {}
}

// Define the DnD logic on the manager
const Item = 'item'
const src = new Source()
const dst = new Target()

const srcId = registry.addSource(Item, src)
const dstId = registry.addTarget(Item, dst)

// Link the DOM with the logic
const srcP = document.createElement('p')
const srcTxt = document.createTextNode('Source')
srcP.appendChild(srcTxt)
document.body.appendChild(srcP)
manager.getBackend().connectDragSource(srcId, srcP)

const dstP = document.createElement('p')
const dstTxt = document.createTextNode('Target')
dstP.appendChild(dstTxt)
document.body.appendChild(dstP)
manager.getBackend().connectDropTarget(dstId, dstP)
```

## Migrating

### Migrating from 6.x.x

Starting with `7.0.0`, `dnd-multi-backend` doesn't have a default export anymore.

Previously:
```js
import MultiBackend from 'dnd-multi-backend'
```

Now:
```js
import { MultiBackend } from 'dnd-multi-backend'
```

### Migrating from 5.0.x

Starting with `5.1.0`, every backend in a pipeline will now need a new property called `id` and the library will warn if it isn't specified. The `MultiBackend` will try to guess it if possible, but that might fail and you will need to define them explicitly.

## License

MIT, Copyright (c) 2016-2022 Louis Brunner



[npm-image]: https://img.shields.io/npm/v/dnd-multi-backend.svg
[npm-url]: https://npmjs.org/package/dnd-multi-backend
[deps-image]: https://david-dm.org/louisbrunner/dnd-multi-backend/status.svg
[deps-url]: https://david-dm.org/louisbrunner/dnd-multi-backend
[deps-dev-image]: https://david-dm.org/louisbrunner/dnd-multi-backend/dev-status.svg
[deps-dev-url]: https://david-dm.org/louisbrunner/dnd-multi-backend?type=dev
