data-joint
==========

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

Library to perform data joins with any type of JavaScript objects.
Useful in digest cycles where it's important to minimize changes to a view for performance reasons, such as DOM manipulation.
The module binds data points to objects via hidden attributes, and performs diffing comparisons across multiple iterations to ensure objects are not created or removed unnecessarily, thus keeping view changes to a minimum.

## Quick start

```js
import dataJoint from 'data-joint';
```
or using a *script* tag
```html
<script src="//unpkg.com/data-joint"></script>
```
then
```js
const myData = [{ id: 0, val: 2 }, { id: 1, val: 4 }, { id: 2, val: 7 }];
const myView = new Set();

dataJoint(myData, [...myView], 
    obj => myView.add(obj), // append obj
    obj => myView.delete(obj), // remove obj
    {
        createObj: () => ({}),
        updateObj: (obj, d) => { obj.double = d.val * 2 },
        exitObj: obj => { obj.double = 0 },
        idAccessor: d => d.id
    }
);
```

## API reference

### Syntax

<b>dataJoint</b>(<i>data</i>, <i>existingObjs</i>, <i>appendObjFn</i>, <i>removeObjFn</i>, [{<i>options</i>}]);

### Arguments

<b>data</b>: An array of data points. Each point should be an object that supports attribute binding.

<b>existingObjs</b>: An array of view objects to join the data with.
 
<b>appendObjFn</b>: The method to add a new object to the view. The object is passed as single argument: `obj => { ... }`.

<b>removeObjFn</b>: The method to remove an existing object from the view. The object is passed as single argument: `obj => { ... }`.

### Options

An optional configuration object supporting the additional arguments:

| Option | Description | Default |
| --- | --- | --- |
| <b>createObj</b> | The method to create an entering view object for a new data point that does not have a corresponding object. The data point is passed as single argument: `d => { ... }`. The method should return a new object. | `d => ({})` |
| <b>updateObj</b> | The method to update an existing bound object with new data. The object and the data point are passed as arguments: `(obj, d) => { ... }`. This method is also called for entering objects after `createObj`. | `(obj, d) => {}` |
| <b>exitObj</b> | The method to handle exiting objects which no longer have a corresponding data point. The unbound object is passed as single argument: `obj => { ... }`. This method is called prior to removing it from the view via `removeObjectFn`. | `obj => {}` |
| <b>objBindAttr</b> | The attribute name used to bind data points to view objects. Each data point passed through the digest will be added this attribute, and it will be used for diffing across multiple iterations. | `__obj` |
| <b>dataBindAttr</b> | The attribute name used to bind view objects to data points. Each object maintained by the digest will be added this attribute, and it will be used for diffing across multiple iterations. | `__data` |
| <b>idAccessor</b> | A data point accessor function to extract the point unique identifier. This is used for comparing data points across multiple iterations. If no `idAccessor` is supplied, the data point object reference will be used instead for comparisons. The data point is passed as single argument: `d => {...}`. The method should return a unique identifier. | `undefined` |
| <b>purge</b> | A boolean value. If set to `true` it will bypass the data diffing, resulting in all the `existingObjs` being marked for removal and new objects created for the all the items in the input `data`. | `false` |


[npm-img]: https://img.shields.io/npm/v/data-joint
[npm-url]: https://npmjs.org/package/data-joint
[build-size-img]: https://img.shields.io/bundlephobia/minzip/data-joint
[build-size-url]: https://bundlephobia.com/result?p=data-joint
[npm-downloads-img]: https://img.shields.io/npm/dt/data-joint
[npm-downloads-url]: https://www.npmtrends.com/data-joint
