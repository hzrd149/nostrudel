Kapsule
=======

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A closure based Web Component library, inspired by the [reusable charts pattern](https://bost.ocks.org/mike/chart/) commonly found in [D3](https://d3js.org/) components.

See also [react-kapsule](https://github.com/vasturiano/react-kapsule) for direct integration with React.

## Quick start

```js
import Kapsule from 'kapsule';
```
or using a *script* tag
```html
<script src="//unpkg.com/kapsule"></script>
```

## Usage example

### Define the component
```js
const ColoredText = Kapsule({
    
  props: {
    color: { default: 'red' },
    text: {}
  },

  init(domElement, state) {
    state.elem = document.createElement('span');
    domElement.appendChild(state.elem);
  },

  update(state) {
    state.elem.style.color = state.color;
    state.elem.textContent = state.text;
  }

});
```

### Instantiate the component

```js
const myText = ColoredText();
```

### Render

```js
myText(<myDOMElement>)
  .color('blue')
  .text('foo');
```

## API Reference

### Generation

<b>Kapsule</b>([<i>config</i>])

This returns a new closure component that can be instantiated by calling as a regular function, with an optional `options` object as argument. The `options` object gets passed verbatim to the `init` object for interpretation.
The component's instance is an object of methods (defined by its config `props` and `methods`) that can be called for interacting with the component.
Besides these methods, the instance also acts as an initialization function which should be called to attach the component to a DOM node, with the DOM element as sole argument. This triggers the internal `init` method as specified in the config.

Example:

```js
const Comp = Kapsule(compConfig);

const myInstance = Comp({ /* options */ })
  (<myDOMElement>)
  .prop1('someVal')
  .prop2('anotherVal');
```

### Component configuration

The config object passed to Kapsule supports 5 properties: `props`, `methods`, `stateInit`, `init` and `update`. 
All of these are optional and not required for the component to work, however calling `Kapsule({})` generates a dumb component that has no functionality nor interaction.

Extended example:
```js
const Comp = Kapsule({
  props: {
    propName: propConfig,
    ...
  },
  methods: {
    methodName: function(state, ...args) { ... },
    ...
  },
  stateInit() {
    return {
      stateItem: initVal,
      ...
    }
  },
  init(domNode, state, componentOptions) {
    ...
  },
  update(state) {
    ...
  }
});
```

#### <b>props</b>: { propName: propConfig, ... }

Each registered prop inside `props` will declare its own getter/setter method in the component's instance state. This method will have the signature: `myInstance.propName(`[<i>propVal</i>]`)`.

If called without an argument, the method will function as a getter, returning the current value of the prop. If called with a value it will act as a setter, setting the value in the component's internal state, and returning the component's instance for convenience of method chaining. If the value passed in the setter is `undefined`, the default value will be applied.

The <b>propConfig</b> object supports 3 properties: `default`, `triggerUpdate` and `onChange`.

Extended prop example:
```js
{
  props: {
    propName: {
      default: 6,
      triggerUpdate: false,
      onChange: function(newVal, state) { ... }
    }
  }
}
```
 
##### <b>default</b>
(default: `null`)

This defines the default value of the prop if it's not set by the instance consumer.

##### <b>triggerUpdate</b>
(default: `true`)

This defines whether changes to this prop should trigger the component's `update` method. Generally, if the `update` method does not take this prop into account, you can save some performance by setting this to `false`.

##### <b>onChange(newVal, state, prevVal)</b>
(default: `null`)

Here you can specify an event handler that gets triggered whenever this property is modified by the instance consumer. In some circumstances it's useful to keep update changes here instead of in the `update` method to isolate prop-specific functionality.
The previous value is also included for convenience.

The `this` context of this method is set to the component's instance.

#### <b>methods</b>: { methodName: function(state, ...args) { ... }, ... }

Each registered method inside `methods` will expose an additional method in the component's instance. These methods can be seen as a more generic version of the getter/setters in `props`, and allows the specification of more custom component interactions.
The exposed method will have the signature: 
`myInstance.methodName(...args)`

The `this` context of each of this methods is set to the component's instance. If the method does not naturally return a value, it's advised to end the method with `return this;` so that it can be used in method chaining.

#### <b>stateInit(componentOptions)</b>
 
Use this method's return object to initialize the values of any internal state. This should only be used for state that is not exposed externally via `props`.
This state initialization gets ran as soon as the component is instantiated, and before the `init` method is called.

Example:
```js
function stateInit() {
  return {
   stateItem: initVal,
    ...
  }
}
```

#### <b>init(domNode, state, componentOptions)</b>

This method initializes the web component by attaching it to a DOM element. This method gets triggered only when the instance is called by the consumer as `myInstance(<domElement>)`. This is generally only called once for the whole lifecycle of the component's instance.

This is where DOM operations should be performed for the <b>static</b> parts of the document that do not change throughout its lifecycle.

Example:
```js
function init(domNode, state, { label: '' }) {
  state.elem = document.createElement('div'); // static scaffolding div
  domElement.appendChild(state.elem);

  const labelElem = document.createElement('span');
  labelElem.textContent = label; // static label from component options
  state.elem.appendChild(labelElem);
}
```
 
An internal state variable `initialised` indicates whether the instance has been through its `init` method or not. `state.initialised` is set to `true` right after the first `init` method call.
 
The `this` context of this method is set to the component's instance.
Returning a value from this method has no effect.

#### <b>update(state, changedProps)</b>

This method is triggered once right after the `init` method finishes, and afterwards whenever a `prop` changes. 
This method should contain the DOM operations for the <b>dynamic</b> parts of the document that change according to the component `props`.

Example:
```js
function update(state) {
  state.elem.style.width = state.pxWidth + 'px';
}
```

Note that multiple calls to `update()` due to prop changes are internally debounced for performance optimization. This is so that the consumer can request multiple chained prop changes without each one triggering an update, but it instead being batched as one update.

The props that were updated since the last update cycle (or all if it's the first update) are included in the second argument `changedProps`. This is an object that lists all the updated props and their previous value. For example:
```js
{
  pxWidth: 10, // previous value of pxWidth
  color: 'blue'
}
```

When applying the initial default values, the previous prop value is referenced as `undefined`.

The `this` context of this method is set to the component's instance.
Returning a value from this method has no effect.

### Other methods

#### <b>resetProps</b>()

Each instance will get automatically exposed a convenience function `resetProps`, which when called will reset the internal state of all the `props` to their defined default values.
This will trigger an update call immediately after the props have been reset.

Example:
```js
myInstance
  .propA('someVal')
  .resetProps(); // propA gets reset to its default value
```

[npm-img]: https://img.shields.io/npm/v/kapsule
[npm-url]: https://npmjs.org/package/kapsule
[build-size-img]: https://img.shields.io/bundlephobia/minzip/kapsule
[build-size-url]: https://bundlephobia.com/result?p=kapsule
[npm-downloads-img]: https://img.shields.io/npm/dt/kapsule
[npm-downloads-url]: https://www.npmtrends.com/kapsule
