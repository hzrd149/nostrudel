# React DnD Multi Backend [![NPM Version][npm-image]][npm-url] [![dependencies Status][deps-image]][deps-url] [![devDependencies Status][deps-dev-image]][deps-dev-url]

[Try it here!](https://louisbrunner.github.io/dnd-multi-backend/examples/react-dnd-multi-backend.html)

This project is a Drag'n'Drop backend compatible with [React DnD](https://github.com/react-dnd/react-dnd).
It enables your application to use different DnD backends depending on the situation.
You can either generate your own backend pipeline or use the default one (see [`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch)).

[`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch) starts by using the [React DnD HTML5 Backend](https://react-dnd.github.io/react-dnd/docs/backends/html5), but switches to the [React DnD Touch Backend](https://react-dnd.github.io/react-dnd/docs/backends/touch) if a touch event is triggered.
You application can smoothly use the nice HTML5 compatible backend and fallback on the Touch one on mobile devices!

Moreover, because some backends don't support preview, a `Preview` component has been added to make it easier to mock the Drag'n'Drop "ghost".

See the [migration section](#migrating) for instructions when switching from `2.x.x`, `3.x.x`, `4.x.x`, `5.0.x` or `6.x.x`.

## Installation

```sh
npm install -S react-dnd-multi-backend
```

You can then import the backend using `import { MultiBackend } from 'react-dnd-multi-backend'`.

### Backends pipeline

In order to use [`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch), you will now need to install it separately:

```sh
npm install -S rdndmb-html5-to-touch
```

## Usage

### DndProvider (new API)

You can use the `DndProvider` component the same way you do the one from `react-dnd` ([docs](https://react-dnd.github.io/react-dnd/docs/api/dnd-provider) for more information), at the difference that you don't need to specify `backend` as a prop, it is implied to be `MultiBackend`.

You must pass a 'pipeline' to use as argument. [`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch) is provided as another package but you can also write your own.

```js
import { DndProvider } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch' // or any other pipeline

const App = () => {
  return (
    <DndProvider options={HTML5toTouch}>
      <Example />
    </DndProvider>
  )
}
```

### Backend (old API)

You can plug this backend in the `DragDropContext` the same way you do for any backend (e.g. `ReactDnDHTML5Backend`), you can see [the docs](https://react-dnd.github.io/react-dnd/docs/backends/html5) for more information.

You must pass a 'pipeline' to use as argument. [`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch) is provided as another package but you can also write your own.

```js
import { DndProvider } from 'react-dnd'
import { MultiBackend } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch' // or any other pipeline

const App = () => {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <Example />
    </DndProvider>
  )
}
```

### Create a custom pipeline

Creating a pipeline is fairly easy. A pipeline is composed of a list of backends, the first one will be the default one, loaded at the start of the **MultiBackend**, the order of the rest isn't important.

Each backend entry must specify one property: `backend`, containing the class of the Backend to instantiate.
But other options are available:

 - `id`: a string identifying that backend uniquely
 - `backend`: a function used to create the actual backend (usually provided by the corresponding package, e.g. `import { HTML5Backend } from 'react-dnd-html5-backend`)
 - `options`: optional, any type, this will be passed to the `backend` factory when creating that backend
 - `preview`: optional, a boolean indicating if `Preview` components should be shown
 - `transition`: optional, an object returned by the `createTransition` function
 - `skipDispatchOnTransition`: optional, a boolean indicating transition events should not be dispatched to new backend, defaults to `false`. See [note below](#note-on-skipdispatchontransition) for details and use cases.)

Here is the `rdndmb-html5-to-touch` pipeline's code as an example:
```js
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'

import { DndProvider, TouchTransition, MouseTransition } from 'react-dnd-multi-backend'

export const HTML5toTouch = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {enableMouseEvents: true},
      preview: true,
      transition: TouchTransition,
    },
  ],
}

const App = () => {
  return (
    <DndProvider options={HTML5toTouch}>
      <Example />
    </DndProvider>
  )
}
```

#### Transitions

Transitions are required to allow switching between backends. They really easy to write, here is an example:

```js
import { createTransition } from 'react-dnd-multi-backend'

const TouchTransition = createTransition('touchstart', (event) => {
  return event.touches != null
})
```

The following transitions are provided:

 - `TouchTransition`: triggered when a *touchstart* is received
 - `HTML5DragTransition`: triggered when a HTML5 DragEvent is received
 - `MouseTransition`: triggered when a MouseEvent is received

#### Note on `skipDispatchOnTransition`

By default, when an event triggers a transition, `dnd-multi-backend` dispatches a cloned version of the event after setting up the new backend. This allows the newly activated backend to handle the original event.

If your app code or another library has registered event listeners for the same events that are being used for transitions, this duplicate event may cause problems.

You can optionally disable this behavior per backend:

```js
const CustomHTML5toTouch = {
  backends: [
    {
      backend: HTML5Backend,
      transition: MouseTransition
      // by default, will dispatch a duplicate `mousedown` event when this backend is activated
    },
    {
      backend: TouchBackend,
      // Note that you can call your backends with options
      options: {enableMouseEvents: true},
      preview: true,
      transition: TouchTransition,
      // will not dispatch a duplicate `touchstart` event when this backend is activated
      skipDispatchOnTransition: true
    }
  ]
}
```

**WARNING:** if you enable `skipDispatchOnTransition`, the backend transition will happen as expected, but the new backend may not handle the first event!

In this example, the first `touchstart` event would trigger the `TouchBackend` to replace the `HTML5Backend`—but the user would have to start a new touch event for the `TouchBackend` to register a drag.

### Hooks

The library provides a set of hooks to expand `useDrag` and `useDrop`.

#### `useMultiDrag`

It expands `useDrag` and takes the same arguments but returns an array of:

 - `Index 0`: the original return of `useDrag`
 - `Index 1`: an object containing the same types as `useDrag` but specific to each backend (the key being the backend `id`)
   - `backend.id`:
     - `Index 0`: an object containing collected properties from the collect function. If no `collect` function is defined, an empty object is returned (`Index 0` in `useDrag`'s return)
     - `Index 1`: a connector function for the drag source. This must be attached to the draggable portion of the DOM (`Index 1` in `useDrag`'s return)
     - `Index 2`: a connector function for the drag preview. This may be attached to the preview portion of the DOM (`Index 2` in `useDrag`'s return)

Example:
```js
import { useMultiDrag } from 'react-dnd-multi-backend'

const MultiCard = (props) => {
  const [[dragProps], {html5: [html5Props, html5Drag], touch: [touchProps, touchDrag]}] = useMultiDrag({
    type: 'card',
    item: {color: props.color},
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })

  const containerStyle = {opacity: dragProps.isDragging ? 0.5 : 1}
  const html5DragStyle = {backgroundColor: props.color, opacity: html5Props.isDragging ? 0.5 : 1}
  const touchDragStyle = {backgroundColor: props.color, opacity: touchProps.isDragging ? 0.5 : 1}
  return (
    <div style={containerStyle}>
      <div style={html5DragStyle} ref={html5Drag}>HTML5</div>
      <div style={touchDragStyle} ref={touchDrag}>Touch</div>
    </div>
  )
}
```

#### `useMultiDrop`

It expands `useDrop` and takes the same arguments but returns an array of:

 - `Index 0`: the original return of `useDrop`
 - `Index 1`: an object containing the same types as `useDrop` but specific to each backend (the key being the backend `id`)
   - `backend.id`:
     - `Index 0`: an object containing collected properties from the collect function. If no `collect` function is defined, an empty object is returned (`Index 0` in `useDrop`'s return)
     - `Index 1`: A connector function for the drop target. This must be attached to the drop-target portion of the DOM (`Index 1` in `useDrop`'s return)

Example:
```js
import { useMultiDrop } from 'react-dnd-multi-backend'

const MultiBasket = (props) => {
  const [[dropProps], {html5: [html5DropStyle, html5Drop], touch: [touchDropStyle, touchDrop]}] = useMultiDrop({
    accept: 'card',
    drop: (item) => {
      const message = `Dropped: ${item.color}`
      logs.current.innerHTML += `${message}<br />`
    },
    collect: (monitor) => {
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }
    },
  })

  const containerStyle = {border: '1px dashed black'}
  const html5DropStyle = {backgroundColor: (html5Props.isOver && html5Props.canDrop) ? '#f3f3f3' : '#bbbbbb'}
  const touchDropStyle = {backgroundColor: (touchProps.isOver && touchProps.canDrop) ? '#f3f3f3' : '#bbbbbb'}
  return (
    <div style={containerStyle}>
      <div style={html5DropStyle} ref={html5Drop}>HTML5</div>
      <div style={touchDropStyle} ref={touchDrop}>Touch</div>
    </div>
  )
}
```

### Preview

The `Preview` class is usable in different ways: hook-based, function-based and context-based.
All of them receive the same data formatted the same way, an object containing the following properties:

 - `display`: only with `usePreview`, boolean indicating if you should render your preview
 - `itemType`: the type of the item (`monitor.getItemType()`)
 - `item`: the item (`monitor.getItem()`)
 - `style`: an object representing the style (used for positioning), it should be passed to the `style` property of your preview component
 - `ref`: a reference which can be passed to the final component that will use `style`, it will allow `Preview` to position the previewed component correctly (closer to what HTML5 DnD can do)
 - `monitor`: the actual [`DragLayerMonitor`](https://react-dnd.github.io/react-dnd/docs/api/drag-layer-monitor) from `react-dnd`

Note that this component will only be showed while using a backend flagged with `preview: true` (see [Create a custom pipeline](#create-a-custom-pipeline)) which is the case for the Touch backend in the `rdndmb-html5-to-touch` pipeline.

#### Hook-based

```js
import { DndProvider, usePreview } from 'react-dnd-multi-backend'

const MyPreview = () => {
  const preview = usePreview()
  if (!preview.display) {
    return null
  }
  const {itemType, item, style} = preview;
  // render your preview
}

const App = () => {
  return (
    <DndProvider options={MyPipeline}>
      <MyPreview />
    </DndProvider>
  )
}
```

#### Function-based

```js
import { DndProvider, Preview } from 'react-dnd-multi-backend'

const generatePreview = ({itemType, item, style}) => {
  // render your preview
}

const App = () => {
  return (
    <DndProvider options={MyPipeline}>
      <Preview generator={generatePreview} />
      {/* or */}
      <Preview>{generatePreview}</Preview>
    </DndProvider>
  )
}
```

#### Context-based

```js
import { DndProvider, Preview } from 'react-dnd-multi-backend'

const MyPreview = () => {
  const {itemType, item, style} = useContext(Preview.Context)
  // render your preview
}

const App = () => {
  return (
    <DndProvider options={MyPipeline}>
      <Preview>
        <MyPreview />
        // or
        <Preview.Context.Consumer>
          {({itemType, item, style}) => /* render your preview */}
        </Preview.Context.Consumer>
      </Preview>
    </DndProvider>
  )
}
```

### Examples

You can see an example [here](examples/).

## Migrating

### Migrating from 6.x.x

Starting with `7.0.0`, `HTML5toTouch` will not be provided through this package anymore but through its own: [`rdndmb-html5-to-touch`](../rdndmb-html5-to-touch/). It also doesn't have a default export anymore.

Previously:
```js
import MultiBackend from 'react-dnd-multi-backend'
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch'
// or
import HTML5toTouch from 'react-dnd-multi-backend/dist/cjs/HTML5toTouch'
```

Now:
```js
import { MultiBackend } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch'
```

### Migrating from 5.0.x

Starting with `5.1.0`, `react-dnd-multi-backend` will export a new `DndProvider` which you can use instead of the one from `react-dnd`. You don't need to pass the `backend` prop to that component as it's implied you are using `MultiBackend`, however the major benefits is under the hood:

 - No longer relying on global values, allowing better encapsulation of the backend and previews
 - `Preview` will be mounted with `DndProvider` using a `React.createPortal`, thus you don't need to worry about mounting your `Preview` at the top of the tree for the absolute positioning to work correctly

Moreover, every backend in a pipeline will now need a new property called `id` and the library will warn if it isn't specified. The `MultiBackend` will try to guess it if possible, but that might fail and you will need to define them explicitly.

Note that these aren't breaking changes, you can continue using the library as before.

### Migrating from 4.x.x

Starting with `5.0.0`, `react-dnd-preview` (which provides the `Preview` component) will start passing its arguments packed in one argument, an object `{itemType, item, style}`, instead of 3 different arguments (`itemType`, `item` and `style`). This means that will need to change your generator function to receive arguments correctly.

### Migrating from 3.x.x

Starting with `4.0.0`, `react-dnd-multi-backend` will start using `react-dnd` (and the corresponding backends) `9.0.0` and later.

This means you need to transition from `DragDropContext(MultiBackend(HTML5toTouch))(App)` to `<DndProvider backend={MultiBackend} options={HTML5toTouch}>`.
Accordingly, the pipeline syntax changes and you should specify backend options as a separate property, e.g. `{backend: TouchBackend({enableMouseEvents: true})}` becomes `{backend: TouchBackend, options: {enableMouseEvents: true}}`.
Note that if you use the `HTML5toTouch` pipeline, the same is true for `react-dnd-html5-backend` and `react-dnd-touch-backend`.

### Migrating from 3.1.2

Starting with `3.1.8`, the dependencies of `react-dnd-multi-backend` changed. `react`, `react-dom`, `react-dnd` become peer dependencies and you need to install them manually as `dependencies` in your project `package.json`.

Note that if you use the `HTML5toTouch` pipeline, the same is true for `react-dnd-html5-backend` and `react-dnd-touch-backend`.

### Migrating from 2.x.x

In 2.x.x, the pipeline was static but corresponded with the behavior of `HTML5toTouch`, so just [including and passing this pipeline as a parameter](#backend) would give you the same experience as before.

If you used the `start` option, it's a bit different.
With `start: 0` or `start: Backend.HTML5`, **MultiBackend** simply used the default pipeline, so you can also just pass `HTML5toTouch`.
With `start: 1` or `start: Backend.TOUCH`, **MultiBackend** would only use the TouchBackend, so you can replace **MultiBackend** with **TouchBackend** (however, you would lose the `Preview` component) or create a simple pipeline (see [Create a custom pipeline](#create-a-custom-pipeline)) and pass it as a parameter:
```js
var TouchOnly = { backends: [{ backend: TouchBackend, preview: true }] }
```

## License

MIT, Copyright (c) 2016-2022 Louis Brunner



[npm-image]: https://img.shields.io/npm/v/react-dnd-multi-backend.svg
[npm-url]: https://npmjs.org/package/react-dnd-multi-backend
[deps-image]: https://david-dm.org/louisbrunner/react-dnd-multi-backend/status.svg
[deps-url]: https://david-dm.org/louisbrunner/react-dnd-multi-backend
[deps-dev-image]: https://david-dm.org/louisbrunner/react-dnd-multi-backend/dev-status.svg
[deps-dev-url]: https://david-dm.org/louisbrunner/react-dnd-multi-backend?type=dev
