# React DnD: HTML5 to Touch Pipeline [![NPM Version][npm-image]][npm-url] [![dependencies Status][deps-image]][deps-url] [![devDependencies Status][deps-dev-image]][deps-dev-url]

[Try it here!](https://louisbrunner.github.io/dnd-multi-backend/examples/react-dnd-multi-backend.html)

This project is a Drag'n'Drop backend pipeline compatible with [React DnD Multi Backend](../react-dnd-multi-backend/). **It cannot be used standalone.**

This pipeline starts by using the [React DnD HTML5 Backend](https://react-dnd.github.io/react-dnd/docs/backends/html5), but switches to the [React DnD Touch Backend](https://react-dnd.github.io/react-dnd/docs/backends/touch) if a touch event is triggered.
You application can smoothly use the nice HTML5 compatible backend and fallback on the Touch one on mobile devices!

See the [migration section](#migrating) for instructions when switching from `6.x.x`.

## Installation

```sh
npm install -S rdndmb-html5-to-touch
```

You can then import the pipeline using `import { HTML5toTouch } from 'rdndmb-html5-to-touch'`.

## Usage

This package should be used with [`react-dnd-multi-backend`](../react-dnd-multi-backend).

```js
import { DndProvider } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch'

const App = () => {
  return (
    <DndProvider options={HTML5toTouch}>
      <Example />
    </DndProvider>
  )
}
```

## Examples

You can see an example [here](examples/).

## Migrating

### Migrating from 6.x.x and earlier

`HTML5toTouch` used to be provided as part of `react-dnd-multi-backend` which made importing different builds (commonjs vs esm) more difficult. It also used to be a default export.

Previously:
```js
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch'
// or
import HTML5toTouch from 'react-dnd-multi-backend/dist/cjs/HTML5toTouch'
```

Now:
```js
import { HTML5toTouch } from 'rdndmb-html5-to-touch'
```

## License

MIT, Copyright (c) 2021-2022 Louis Brunner


[npm-image]: https://img.shields.io/npm/v/rdndmb-html5-to-touch.svg
[npm-url]: https://npmjs.org/package/rdndmb-html5-to-touch
[deps-image]: https://david-dm.org/louisbrunner/rdndmb-html5-to-touch/status.svg
[deps-url]: https://david-dm.org/louisbrunner/rdndmb-html5-to-touch
[deps-dev-image]: https://david-dm.org/louisbrunner/rdndmb-html5-to-touch/dev-status.svg
[deps-dev-url]: https://david-dm.org/louisbrunner/rdndmb-html5-to-touch?type=dev
