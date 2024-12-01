index-array-by
==============

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A utility function to index arrays by any criteria.

`indexBy(list, keyAccessors, multiItem = true)`

## Quick start

```js
import indexBy from 'index-array-by';
```
or using a *script* tag
```html
<script src="//unpkg.com/index-array-by"></script>
```

## Usage example

Given an array
```js
const people = [
    { name: 'Mary', surname: 'Jane', age: 28 },
    { name: 'John', surname: 'Smith', age: 24 },
    { name: 'John', surname: 'Doe', age: 32 }
];
```

Use `indexBy` to index it by a given attribute (string type `keyAccessor`) or any other custom criteria (function type `keyAccessor`). You can also pass an array of `keyAccessors` to retrieve a nested object recursively indexed by the multiple keys.

Use the third parameter (`multiItem`) to indicate whether each key should point to a single item (unadvised if the keys are not unique) or an array of multiple items (default behavior). 

```js
indexBy(people, 'surname', false);

// Result: 
{
 Doe: { name: 'John', age: 32 },
 Jane: { name: 'Mary', age: 28 },
 Smith: { name: 'John', age: 24 }
}
```

```js
indexBy(people, 'name', true);

// Result: 
{
  Mary: [ { surname: 'Jane', age: 28 } ],
  John: [
    { surname: 'Smith', age: 24 },
    { surname: 'Doe', age: 32 }
  ]
}
```

```js
indexBy(people, ({ name, surname }) => `${surname}, ${name}`, false);

// Result: 
{
 'Jane, Mary': { name: 'Mary', surname: 'Jane', age: 28 },
 'Smith, John': { name: 'John', surname: 'Smith', age: 24 },
 'Doe, John': { name: 'John', surname: 'Doe', age: 32 }
}
```

```js
indexBy(people, ['name', 'surname'], false));

// Result: 
{
 Mary: { Jane: { age: 28 }},
 John: { Smith: { age: 24 }, Doe: { age: 32 }}
}
```

```js
indexBy(people, ({ age }) => `${Math.floor(age / 10) * 10}s`, true);

// Result: 
{
  '20s': [
    { name: 'Mary', surname: 'Jane', age: 28 },
    { name: 'John', surname: 'Smith', age: 24 },
  ],
  '30s': [{ name: 'John', surname: 'Doe', age: 32 }]
}
```


The `multiItem` parameter also accepts a transformation function with the method to reduce multiple items into a single one. In this case, it's keeping only the max age.

```js
indexBy(people, 'name', items => Math.max(...items.map(item => item.age)));

// Result:

{
  John: 32,
  Mary: 28
}
```


A fourth optional parameter (`flattenKeys`) (default: `false`) allows you to receive a flat array structure instead of the default nested format, with each item formatted as `{ keys: [<ordered unique keys for the item>], vals: <single or multiple item> }`.

```js
indexBy(people, ['name', 'surname'], true, true));

// Result: 
[
  { keys: ['Mary', 'Jane'], vals: [{ age: 28 }] },
  { keys: ['John', 'Smith'], vals: [{ age: 24 }] },
  { keys: ['John', 'Doe'], vals: [{ age: 32 }] }
]
```


[npm-img]: https://img.shields.io/npm/v/index-array-by
[npm-url]: https://npmjs.org/package/index-array-by
[build-size-img]: https://img.shields.io/bundlephobia/minzip/index-array-by
[build-size-url]: https://bundlephobia.com/result?p=index-array-by
[npm-downloads-img]: https://img.shields.io/npm/dt/index-array-by
[npm-downloads-url]: https://www.npmtrends.com/index-array-by
