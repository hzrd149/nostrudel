Accessor function
==============

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A wrapper for property accessors supporting functions, property strings or constant values.

## Quick start

```js
import accessorFn from 'accessor-fn';
```
or using a *script* tag
```html
<script src="//unpkg.com/accessor-fn"></script>
```

## Usage example

Given an object
```js
const obj = {
    a: 1,
    b: 2
}
```

Use `accessorFn` to access object values via property strings or transformation functions:
```js
const aFn = accessorFn('a');
aFn(obj); // 1

const sumFn = accessorFn(d => d.a + d.b);
sumFn(obj); // 3

const constantFn = accessorFn(7);
constantFn(obj); // 7
```


[npm-img]: https://img.shields.io/npm/v/accessor-fn
[npm-url]: https://npmjs.org/package/accessor-fn
[build-size-img]: https://img.shields.io/bundlephobia/minzip/accessor-fn
[build-size-url]: https://bundlephobia.com/result?p=accessor-fn
[npm-downloads-img]: https://img.shields.io/npm/dt/accessor-fn
[npm-downloads-url]: https://www.npmtrends.com/accessor-fn
