jerrypick
==============

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

Pluck and omit properties from a JS object.

`pluck(obj, [prop1, prop2, ...]);`
`omit(obj, [prop1, prop2, ...]);`

## Quick start

```js
import { pluck, omit } from 'jerrypick';
```
or using a *script* tag
```html
<script src="//unpkg.com/jerrypick"></script>
```

## Usage example

```js
const myObj = {
  a: 3,
  b: 6,
  c: 9
};

pluck(myObj, ['a', 'c']);

// Result:
{ a: 3, c: 9 }

omit(myObj, ['a', 'b']);

// Result:
{ a: 3 }
```


[npm-img]: https://img.shields.io/npm/v/jerrypick
[npm-url]: https://npmjs.org/package/jerrypick
[build-size-img]: https://img.shields.io/bundlephobia/minzip/jerrypick
[build-size-url]: https://bundlephobia.com/result?p=jerrypick
[npm-downloads-img]: https://img.shields.io/npm/dt/jerrypick
[npm-downloads-url]: https://www.npmtrends.com/jerrypick
