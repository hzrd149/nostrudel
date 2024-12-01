canvas-color-tracker
====================

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A utility to track objects on a canvas by unique px color.

When using HTML5 canvas to render elements, we don't have the convenience of readily available *mouseover* events per object, which makes interaction difficult.
`canvas-color-tracker` provides a system for keeping track of objects in your canvas by indexing them by a unique color, which can be retrieved by determining the *1px* color that is directly under the mouse pointer.

This is generally done using a spare/shadow canvas which is not attached to the DOM, but is synchronyzed in terms of object positions with the main canvas. On this shadow canvas we render the objects filled with artificial unique colors that are keys to the object's data, so that by attaching *mousemove* events to the whole canvas we can determine which objects are being hovered on.

`canvas-color-tracker` is just the registry part of this process, which generates unique color keys per object and supports addition and retrieval of objects. It also includes a mechanism for validating the color keys using checksum encoding. This is necessary because of pixel antialiasing/smoothing on the boundary of canvas objects, leading into new color mutations which invalidate the object color key lookup.

Check out the canvas examples:
* [100 objects](https://vasturiano.github.io/canvas-color-tracker/example/canvas-small.html) [[source](https://github.com/vasturiano/canvas-color-tracker/blob/master/example/canvas-small.html)]
* [10k objects](https://vasturiano.github.io/canvas-color-tracker/example/canvas-medium.html) [[source](https://github.com/vasturiano/canvas-color-tracker/blob/master/example/canvas-medium.html)]
* [1M objects](https://vasturiano.github.io/canvas-color-tracker/example/canvas-huge-1M.html)!! [[source](https://github.com/vasturiano/canvas-color-tracker/blob/master/example/canvas-huge-1M.html)] (please wait until render finishes)

## Quick start

```js
import ColorTracker from 'canvas-color-tracker';
```
or using a *script* tag
```html
<script src="//unpkg.com/canvas-color-tracker"></script>
```
then
```js
const myTracker = new ColorTracker();

const myObject = { ... };
const myObjectColor = myTracker.register(myObject);

// ...

const hoverColor = context.getImageData(x, y, 1, 1).data;
const hoverObject = myTracker.lookup(hoverColor);
```

## API reference

### Instantiation

new <b>ColorTracker</b>([<i>checksum_bits</i>])

Creates a new object registry. 

The parameter `checkum_bits` defines how many bits should be used for storing the checksum of the colors. Higher values produce less chance of collisions introduced by anti-aliasing of pixels on object boundaries, which yield artificial erroneous colors. Each bit used for checksum eats away from the maximum size of the registry, as less bits are available for indexing objects. The maximum number of objects that can be stored in the registry is equal to `2^(24-checksum_bits) - 1` (one position is reserved for background). If not provided, `checksum_bits` takes the default of **6** bits, generating a registry of max size *~262k* objects. Normally, you'll only need to override `checksum_bits` if you wish to store more than this amount of objects.

### Methods

<b>register</b>(<i>object</i>)

Adds an object to the registry, and returns a unique color (hex string) that can be used to retrieve the object in the future. Object can be of any type, even primitive values. The color returned encodes the checksum, and will be checked for validity at retrieval time. In case the registry is full and has reached its limit of objects, a value of `null` is returned, indicating that the object was not stored.

<b>lookup</b>(<i>string</i> or <i>[r, g, b]</i>)

Retrieve an object from the registry by its unique color key. The color should be passed either as a plain string such as `#23a69c`, or an array of 3 octet numbers indicating the color's _r_, _g_, _b_ encoding. This array is the same format as returned by the canvas context `getImageData` method. If the color passes the checksum verification and has a registered object in the registry, it is returned. Otherwise the method returns `null`.

<b>reset</b>()

Clears the registry.


## Giving Back

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=L398E7PKP47E8&currency_code=USD&source=url) If this project has helped you and you'd like to contribute back, you can always [buy me a ☕](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=L398E7PKP47E8&currency_code=USD&source=url)!

[npm-img]: https://img.shields.io/npm/v/canvas-color-tracker
[npm-url]: https://npmjs.org/package/canvas-color-tracker
[build-size-img]: https://img.shields.io/bundlephobia/minzip/canvas-color-tracker
[build-size-url]: https://bundlephobia.com/result?p=canvas-color-tracker
[npm-downloads-img]: https://img.shields.io/npm/dt/canvas-color-tracker
[npm-downloads-url]: https://www.npmtrends.com/canvas-color-tracker
