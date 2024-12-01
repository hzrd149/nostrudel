react-kapsule
=============

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A React wrapper for [kapsule](https://github.com/vasturiano/kapsule)-style web components.

## Quick start

```js
import fromKapsule from 'react-kapsule';
```
or using a *script* tag
```html
<script src="//unpkg.com/react-kapsule"></script>
```

## Usage example

### Given a kapsule component:
```js
const myKapsule = Kapsule({ 
  props: {
    prop1: {},
    prop2: {}
  },
  ...
});
```

### Render it in React:
```jsx
const MyKapsuleComponent = fromKapsule(myKapsule);

ReactDOM.render(
  <MyKapsuleComponent
    prop1="a value"
    prop2="another value"
  />,
  myDOMElement
);
```

## API reference

```js
const MyComponent = fromKapsule(kapsuleComponent, options);
```

### Returns

A React component that includes the methods of the kapsule component available as props.

### Arguments

* kapsuleComponent

Any closure based functional component which accepts prop changes as functional methods. Following the spec in [reusable charts pattern](https://bost.ocks.org/mike/chart/). Can be conveniently defined using the [Kapsule](https://github.com/vasturiano/kapsule) framework. 

* options

 An object with configuration options that can be used to define the React component. For example:
 ```js
 {
   wrapperElementType: 'span'
 }
 ```
 
| Option | Type | Default | Description |
| --- | :--: | :--: | --- |
| <b>wrapperElementType</b> | <i>string</i> or <i>React component</i>| `'div'` | The type of DOM element used by the underlying [React createElement](https://reactjs.org/docs/react-api.html#createelement) to mount the component. Can be either a tag name string (such as `'div'` or `'span'`) or a [React component](https://reactjs.org/docs/components-and-props.html) type (a class or a function). |
| <b>nodeMapper</b> | <i>function</i> | `node => node` | A mapping function that allows to convert the DOM node into an object understood by the kapsule component. |
| <b>methodNames</b> | <i>array of strings</i> | `[]` | The list of kapsule [component methods](https://github.com/vasturiano/kapsule#methods--methodname-functionstate-args-----) that should be available as React component bound methods, instead of direct props. Generally these methods will be called via the component `ref`, i.e. `myComponentRef.current.myMethod(...)`. |
| <b>initPropNames</b> | <i>array of strings</i> | `[]` | The list of props that are intended to be passed as [configuration options](https://github.com/vasturiano/kapsule#generation) to the kapsule component's instantiation call. Modifying the values of these props after the initial mount of the React component will have no effect. |


[npm-img]: https://img.shields.io/npm/v/react-kapsule
[npm-url]: https://npmjs.org/package/react-kapsule
[build-size-img]: https://img.shields.io/bundlephobia/minzip/react-kapsule
[build-size-url]: https://bundlephobia.com/result?p=react-kapsule
[npm-downloads-img]: https://img.shields.io/npm/dt/react-kapsule
[npm-downloads-url]: https://www.npmtrends.com/react-kapsule
