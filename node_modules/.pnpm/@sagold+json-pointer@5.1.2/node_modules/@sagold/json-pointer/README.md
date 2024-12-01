<h1 align="left"><img src="./docs/sagold-json-pointer.png" width="100%" alt="@sagold/json-pointer"></h1>

<p align="left"><b>json-pointer implementation following <a href="https://tools.ietf.org/html/rfc6901">RFC 6901</a> to work with serializable paths into javascript data structures.</b></p>

<p align="center">
    <a href="#api">api</a> | <a href="#usage-examples">usage examples</a> | <a href="#fragment-identifier">fragment identifier</a> | <a href="#breaking-changes">breaking changes</a>
</p> 

**install**

`yarn add @sagold/json-pointer`

**usage**

```js
import { get, set, remove } from '@sagold/json-pointer';
const data = {};

get(data, '/path/to/nested/item'); // undefined
set(data, '/path/to/nested/item', 123); // { path: { to: { nested: { item: 123 }}}
remove(data, '/path/to/nested/item'); // { path: { to: { nested: { }}}
```


## API

As the _error handling_ is not further specified, this implementation will return `undefined` for any invalid
pointer/missing data, making it very convenient to work with uncertain data.

| method                                    | description
| ----------------------------------------- | -------------------------------------------------------------
| get(data, pointer) -> value               | returns the value at given pointer
| set(data, pointer, value) -> data         | sets the value at the given path
| remove(data, pointer) -> data             | removes a property from data
| join(...pointers) -> pointer              | joins multiple pointers to a single one
| split(pointer) -> [array]                 | returns a json-pointer as an array
| splitLast(pointer) -> [pointer, property] | returns parent-pointer and last property


> The methods `get`, `set`, `remove` and `join` also accept a list of properties as pointer. Using join with a list
> of properties, its signature changes to `join(properties:string[], isURI=false) -> string`


## Usage Examples

### get

> get(data:object|array, pointer:string|array, defaultValue:any) -> value:any

returns nested values

```js
import pointer from '@sagold/json-pointer';
const data = {
    parent: {
        child: {
            title: 'title of child'
        }
    }
}

const titleOfChild = pointer.get(data, '/parent/child/title'); // output: 'title of child'
console.log(pointer.get(data, '/parent/missing/path')); // output: undefined
```

and may optionally return a default value with

```js
import pointer from '@sagold/json-pointer';
const value = pointer.get({}, "/invalid/value", 42);
console.log(value); // output: 42
```

`get` also accepts a list of properties as pointer (e.g. split-result)

```js
const titleOfChild = pointer.get(data, ['parent', 'child', 'title']); // output: 'title of child'
console.log(pointer.get(data, ['parent', 'missing', 'path'])); // output: undefined
```

### set

> set(data:object|array, pointer:string|array, value:any) -> data:object|array

changes a nested value

```js
import pointer from '@sagold/json-pointer';

var data = {
    parent: {
        children: [
            {
                title: 'title of child'
            }
        ]
    }
};

pointer.set(data, '/parent/children/1', { title: 'second child' });
console.log(data.parent.children.length); // output: 2
```

and may be used to build data

```js
import pointer from '@sagold/json-pointer';
const data = pointer.set({}, '/list/[]/value', 42);
console.log(data); // output: { list: [ { value: 42 } ] }
```

`set` also accepts a list of properties as pointer (e.g. split-result)

```js
import pointer from '@sagold/json-pointer';
const data = pointer.set({}, ['list', '[]', 'value'], 42);
console.log(data); // output: { list: [ { value: 42 } ] }
```


### remove

> remove(data:object|array, pointer:string|array) -> data:object|array

deletes a nested property or item

```js
import pointer from '@sagold/json-pointer';
const data = pointer.remove({ parent: { arrayOrObject: [ 0, 1 ] }}, '/parent/arrayOrObject/1');
console.log(data.parent.arrayOrObject); // output: [0]
```

`remove` also accepts a list of properties as pointer (e.g. split-result)

```js
import pointer from '@sagold/json-pointer';
const data = pointer.remove({ parent: { arrayOrObject: [ 0, 1 ] }}, ['parent', 'arrayOrObject', '1']);
console.log(data.parent.arrayOrObject); // output: [0]
```


### split

> split(pointer:string) -> properties:array

returns a json-pointer as a list of (escaped) properties

```js
import pointer from '@sagold/json-pointer';
const list = pointer.split('/parent/arrayOrObject/1');
console.log(list); // output: ['parent', 'arrayOrObject', '1']
```

In order to resolve a list of properties, you can directly pass the list to `get`, `set` or `remove`

```js
import pointer from '@sagold/json-pointer';
const data = { a: { b: true } };
const list = pointer.split('/a/b');
console.log(pointer.get(data, list)); // output: true
```


### splitLast

> splitLast(pointer:string) -> [pointer, property]

separates json-pointers last property and returns both values as [parent-pointer, property]

```js
import pointer from '@sagold/json-pointer';
const [parent, property] = pointer.splitLast('/parent/arrayOrObject/1');
console.log(parent); // output: '/parent/arrayOrObject'
console.log(property); // output: '1'
```


### join

> join(...pointers:string[]) -> pointer:string

joins all arguments to a valid json pointer

```js
import pointer from '@sagold/json-pointer';
const key = 'my key';
console.log(pointer.join('root', key, '/to/target')); // output: '/root/my key/to/target'
```

and joins relative pointers as expected

```js
import pointer from '@sagold/json-pointer';
console.log(pointer.join('/path/to/value', '../object')); // output: '/path/to/object'
```

in order to join an array received from split, you can use `join(properties:string[], isURI=false) -> string` to
retrieve a valid pointer

```js
import pointer from '@sagold/json-pointer';
const list = pointer.split('/my/path/to/child');
list.pop();
console.log(pointer.join(list)); // output: '/my/path/to'
```

To join an array of pointers, you must use it with `join(...pointers)` or all pointers will be treated as properties:

```js
import pointer from '@sagold/json-pointer';
const path = pointer.join(...['/path/to/value', '../object']);
console.log(path); // output: '/path/to/object'

// passing the array directly, will treat each entry as a property, which will be escaped and resolves to:
pointer.join(['/path/to/value', '../object']); // output: '/~1path~1to~1value/..~1object'
```


## Fragment identifier

All methods support a leading uri fragment identifier (#), which will ensure that property-values are uri decoded
when resolving the path within data. This also ensures that any pointer is returned uri encoded with a leading `#`. e.g.

```js
import pointer from '@sagold/json-pointer';

// get
const value = pointer.get({ 'my value': true }, '#/my%20value');
console.log(value); // output: true

// join
const pointer = pointer.join('#/my value/to%20parent', '../to~1child');
console.log(pointer); // output: '#/my%20value/to~1child'

// join an array of properties
const uriPointer = pointer.join(['my value', 'to~1child'], isURI = true);
console.log(uriPointer); // output: '#/my%20value/to~1child'
```

Additionally `join(...pointers, isURI)` may be used to enforce the pointer type, which is helpful in sanitizing inputs

```js
const uriPointer = pointer.join('my pointer', 'to', 'property', isURI = true);
console.log(uriPointer); // output: '#/my%20pointer/to/property'

const uriSimple = pointer.join('/my pointer/to/property', isURI = true);
console.log(uriSimple); // output: '#/my%20pointer/to/property'

const pointer = pointer.join('#/my pointer', 'to', 'property', isURI = false);
console.log(pointer); // output: '/my pointer/to/property'
```


## Breaking Changes

- 2022/12/02 with `v5`, package has been renamed to `json-pointer` and published under `@sagold/json-pointer`
- 2020/11/09 with `v4`, `pointer.delete` has been renamed to `remove`