<h1 align="left"><img src="./docs/sagold-json-query.png" width="100%" alt="@sagold/json-query"></h1>

<p align="left"><b><code>json-query</code> lets you quickly select values, patterns or types from json-data. Its input requires a simple string, describing a concise query into your data.</b></p>

<p align="center">
    <a href="#features">Features</a> | <a href="#quick-introduction">Introduction</a> | <a href="#api">Api</a> | <a href="#about-patterns">About patterns</a> | <a href="#further-examples">Further examples</a> | <a href="#breaking-changes">Breaking changes</a>
</p>

**install**

`yarn add @sagold/json-query`


## Features

- [json-pointer](https://github.com/sagold/json-pointer) syntax `#/list/0/id`
- glob-patterns for properties (`*`, `**`)
- regex-support for properties `{any.*}`
- pattern-support for inifinite recursion `/tree(/nodes/*)+/value`
- or-patterns `/node((/left), (/right))`
- finite search in circular-data `**`
- lookahead-rules to test selected property `?property:value` and regex values `?property:{\d+}`
- and typechecks `/value?:array`


## Quick introduction

Basically, a **query** is a json-pointer, which describes a path of properties into the json-data

```js
import { get } from "@sagold/json-query";
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/a/id"); // ["id-a"]
```


But each property may also be a glob-pattern or a regular expression:

`*` selects all direct children

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*/id"); // ["id-a", "id-b"]
```


`**` selects all values

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/**");
// [ { a: { id: "id-a" }, b: { id: "id-b" } }, { id: "id-a" }, "id-a", { id: "id-b" }, "id-b" ]
```


`{}` calls a regular expression

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/{obj.*}/{.*}/id"); // ["id-a", "id-b"]
```

> Note. Regular expressions within strings, have to escape any backslashes, e.g. instead of `{\d}` you need to pass `{\\d}`


**lookahead** rules are used to validate the current value based on its properties

`?child` tests if a childProperty is defined

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*?id"); // [{ id: "id-a" }, { id: "id-b" }]
```


`?child:value` tests if a childProperty matches a value

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*?id:id-b"); // [{ id: "id-b" }]
```

lookahead rules can also be negated `?child:!value`, tested by regex `?child:{^re+}`, combined `?child&&other` or joined `?child||other`. Undefined may be tested with `?property:undefined`, per default `undefined` is excluded from matches.


**typechecks** can be used to query certain data-types

`?:<type>`, where `<type>` may be any of `["boolean", "string", "number", "object", "array", "value"]`

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/**?:string"); // ["id-b"]
```

`?:value` will match all types except *objects* and *arrays*

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/**?:value"); // [33, "id-b"]
```


**patterns** can be used to combine queries into a single result (*OR*) and to build up results from recursive queries (*+*)

Queries can be grouped by parenthesis, where `/a/b/c = /a(/b)(/c) = /a(/b/c)`.

`((/a), (/b))` resolves both queries on the previous result

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/object((/a), (/b))"); // [{ id: 33 }, { id: "id-b" }]
```

and the result may be queried further

```js
get(input, "/object((/a), (/b))/id"); // [33, "id-b"]
get(input, "/object((/a), (/b))/id?:number"); // [33]
```

`(/a)+` will repeat the grouped query for all possible results

```js
const input = {
    id: 1,
    a: { // first iteration
        id: 2,
        a: { // second iteration
            id: 3
            a: 4 // last iteration
        }
    }
};

const values = get(input, "/(/a)+"); // [{ id: 2, a: { id: 3, a: 4 } }, { id: 3, a: 4 }, 4]
```


**escaping properties** In case you have special characters in property-names or values, you can escape any value using doubled-quotes `"<value>"`:

- escape property-name: `'/root/*/"strange/property"'` is split to `["root", "*", "strange/property"]`
- escape query-property `'/root/*?"strange/property":42'`
- escape query-value `'/root/*?id:"#/pointer/value"'`


## API

*json-query* exposes `get`, `set`, `remove` and a `split`-helper

method  | signature                                                         | description
--------|-------------------------------------------------------------------|------------------------------
get     | (input:any, query:string, returnType?:string\|function)           | query data, returns results
set     | (input:any, query:string, value:string\|function, replace?:string)| set value, returns modified input
split   | (query: string)                                                   | returns a list properties and queries
remove  | (input:any, query: string, returnRemoved?:boolean)                | delete query targets, returns input


### get

per default, *get* returns a list of all values

```js
import { get } from "@sagold/json-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };
const values = get(input, "/**?:value"); // [33, "id-b"]
```

Using the optional value `returnType` you can change the result type to the following options
`["all", "value", "pointer", "map"]`. The string values can also be accessed as property on `get`: `get.ALL, get.VALUE, get.POINTER, get.MAP`:


returnType  | description
------------|------------------------------------------------------------------
"value"     | returns all matched values of the query `[33, "id-b"]`
"pointer"   | returns json-pointer to results `["#/object/a", "#/object/b"]`
"map"       | returns an pairs of `jsonPointer: resultValue` as an object
"all"       | returns a list, where each result is an array of `[value, keyToValue, parentObject, jsonPointer]`
function    | callback with `(value, keyToValue, parentObject, jsonPointer) => {}`. If a value is returned, the result will be replaced by the return-value


```js
import { get } from "@sagold/json-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

get(input, "/**?:value", get.VALUE); // [33, "id-b"]
get(input, "/**?:value", get.POINTER); // ["#/object/a/id", "#/object/b/id"]
get(input, "/**?:value", get.MAP); // { "#/object/a/id": 33, "#/object/b/id": "id-b" }

get(input, "/**?:value", get.ALL);
// [
//    [33, "id", { id: 33 }, "#/object/a/id"],
//    ["id-b", "id", { id: "id-b" }, "#/object/b/id"]
// ]

get(input, "/**?:value", (value, key, parent, pointer) => `custom-${pointer}`);
// ["custom-#/object/a/id", "custom-#/object/b/id"]
```


### remove

**remove** deletes any match from the input data.
Note: the input will be modified. If this is unwanted behaviour, copy your data up front.

```js
import { remove } from "@sagold/json-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

remove(input, "/object/*/id"); // { object: { a: {}, b: {} } };
```

Per default, the input object is returned. Setting the optional argument `returnRemoved = true`, will return a list of the removed items

```js
import { remove } from "@sagold/json-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

remove(input, "/object/*/id", true); // [ 33, "id-b" ]
```


### set

**set** inserts given input-value on result and creates missing properties and arrays.
Note: Any expanding queries like `*` or patterns will not create any intermediate values

`set` has the following signature

```ts
set(input:any, query:string, value:string\|function, force?:string): any
```

instead of value, you can also pass a function to generate the values to set:

```ts
value(pointerOfParent:string, lastPropertyName:string, parentObject:string, pointerAtValue:string): any
```


Create data from simple properties

```js
import { set } from "@sagold/json-query";

const result = set({}, "/object/id", 42); // { object: { id: 42 }}
```

Add properties to multiple existing objects

```js
import { set } from "@sagold/json-query";

const result = set({ list: [ { id: 1 }, { id: 2 } ] }, "/list/*/index", 42);
// { list: [ { id: 1, index: 42 }, { id: 2, index: 42 } ] }
```

Or using a value-function

```js
import { set } from "@sagold/json-query";

const result = set({ list: [ { id: 1 }, { id: 2 } ] }, "/list/*/index",
    ( _, _, parent) => `id-${parent.id}`
);
// { list: [ { id: 1, index: "id-1" }, { id: 2, index: "id-2" } ] }
```

Currently, `set` will not override simple values

```js
import { set } from "@sagold/json-query";

const result = set({ value: 2 }, "/value/id", 3);
// { value: 2 }
```

And queries will not add values to the data
```js
import { set } from "@sagold/json-query";

const result = set({ a: { id: 2 } }, "((/a), (/b))/id", true);
// { a: { id: true } }
```

When working with arrays, you have to choose between the following actions

- insert item at index *1*: `/list/[1]/id`
- replace item at index *1*: `/list/1/id`
- append item `/list/[]/id`

Using the `force` option, you can enforce insertion or replacement, independent of the syntax (same for the whole query)

```js
set(data, "/list/[1]/id", 42, set.REPLACE_ITEMS); // will always replace index
// and
set(data, "/list/1/id", 42, set.INSERT_ITEMS); // will always insert at index
```

Numbers will always be interpreted as arrays

```js
set({}, "/list/0/id", 42); // { list: [{ id: 42 }]}
set({}, "/list/[]/id", 42); // { list: [{ id: 42 }]}
set({}, "/list/[0]/id", 42); // { list: [{ id: 42 }]}

// but setting an index is respected
set({}, "/list/2/id", 42); // { list: [undefined, undefined, { id: 42 }]}
```

In order to treat numbers as objects, escape them using double-quotes

```js
set({}, '/list/"2"/id', 42); // { list: { 2: { id: 42 } } }
// or "/list/\"2\"/id"
```


## About patterns

Pattern-queries enable selection of recursive patterns and offer a way to build up a collection of data for further filterung. A pattern uses brackets `()` to identify repeatable structures and offers multiple selections for the same data-entry.

Using a pattern-query like `#/tree((/left),(/right))*` will recursively select all *left* and *right*-nodes. e.g.

```js
const data = {
  tree: {
    left: {
      id: "1",
      left: { id: "2" },
      right: { id: "3" }
    },
    right: {
      id: "4"
    }
  }
};

const result = get(data, "#/tree((/left),(/right))*/id");
// ["1", "2", "3", "4"]
```

**Note** that each pattern-queries is resovled using `query.get` and thus supports all mentioned features.

One use-case for pattern-queries can be found in json-schema specification. Any definition in `#/defs` may reference itself or be referenced circular. A linear query cannot describe the corresponding data, but pattern-queries might be sufficient.


#### details

A pattern is a simple group defined by brackets: `#/a(/b)/c`, which is identical to `#/a/b/c`. But a group may also have a quantifier `+`: `#/a(/b)+/c`. Using a quantifier, the query within the pattern will be applied as long as it matches any data. Its combined result will then be passed to `/c`.

e.g. applying the pattern `#/a(/b)+/c` on the following input data:

```js
const input = {
  a: {
    b: {
      c: "1",
      b: {
        c: "2",
        b: {}
      }
    }
  }
};
```

will first select property `a` and then repeatedly select property `b`: `[a/b, a/b/b, a/b/b/b]`. This result is filtered by `c`, which will return `["1", "2"]` (the last `b`-object has no property `c`).

Patterns can also be used for **OR**-operations. An *OR* is identified by a semicolon `,` and must be within and between patterns, like `((/a/b),(/c))`. **Not valid** patterns are *(/a/b, /c)* and *r/(/a/b),(/c)/f*.

Currently, using **OR** is *commutative* in a sense that `((/a),(/b)) = ((/b),(/a))`, (with a different ordering of the resulting set), *distributive* so that `/a((/b), (/c)) = ((/a/b), (/a/c))`. **Parenthesis** without a quantifier are *associative*, e.g. `#/a/b/c = #/a(/b)/c = #/a(/b/c) = #/a(/b)(/c)`. Thus, a pattern `((/b)(/c))+` can also be written like `(/b/c)+`.


## further examples

for further examples refer to the unit tests

- [query.delete](https://github.com/sagold/json-query/blob/master/test/unit/delete.test.js)
- [query.get](https://github.com/sagold/json-query/blob/master/test/unit/get.test.js)
- [query.set](https://github.com/sagold/json-query/blob/master/test/unit/set.test.js)
- [query.split](https://github.com/sagold/json-query/blob/master/test/unit/split.test.js)


## Breaking Changes

- with version `v5.0.0` package has been rename to `@sagold/json-query`
- with version `v4.0.0` (2019/10/01)
    - the api has been simplified to methods `query.get` and `query.delete` (removed `run` and `pattern`)
- with version `v3.0.0`
    - the syntax has changed to es6, which might require code transpilation
    - queries for root-pointer (`#`, `#/`, `/`) now callback root object with `(rootObject, null, null, "#")`
- with `v2.0.0` a negated filter (lookahead), e.g. `*?valid:!true` will not return objects where `valid === undefined`. To match objects with missing properties you can still query them explicitly with `*?valid:!true||valid:undefined`
