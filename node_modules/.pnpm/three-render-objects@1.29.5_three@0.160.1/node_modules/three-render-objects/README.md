three-render-objects
====================

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

This module offers a convenient way to render [ThreeJS](https://threejs.org/) objects onto a WebGL canvas, with built-in interaction capabilities:
* hover/click events
* tooltips
* camera movement with animated transitions
* trackball, orbit or fly controls

All the renderer/scene/camera scaffolding is already included and any instance of [Object3D](https://threejs.org/docs/#api/core/Object3D) can be rendered with minimal setup. 

## Quick start

```js
import ThreeRenderObjects from 'three-render-objects';
```
or using a *script* tag
```html
<script src="//unpkg.com/three-render-objects"></script>
```
then
```js
const myCanvas = ThreeRenderObjects();
myCanvas(<myDOMElement>)
  .objects(<myData>);
```

## API reference

### Initialisation
```js
ThreeRenderObjects({ configOptions })(<domElement>)
```

| Config options | Description | Default |
| --- | --- | :--: |
| <b>controlType</b>: <i>str</i> | Which type of control to use to control the camera. Choice between [trackball](https://threejs.org/examples/misc_controls_trackball.html), [orbit](https://threejs.org/examples/#misc_controls_orbit) or [fly](https://threejs.org/examples/misc_controls_fly.html). | `trackball` |
| <b>rendererConfig</b>: <i>object</i> | Configuration parameters to pass to the [ThreeJS WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer) constructor. | `{ antialias: true, alpha: true }` |
| <b>extraRenderers</b>: <i>array</i> | If you wish to include objects that require a dedicated renderer besides `WebGL`, such as [CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer), include in this array those extra renderer instances. | `[]` |
| <b>waitForLoadComplete</b>: <i>boolean</i> | Whether to wait until all the asynchronous loading operations are finished (such as the background image) before rendering the objects in the scene for the first time. | `true` |

### Data input

| Method | Description | Default |
| --- | --- | :--: |
| <b>objects</b>([<i>array</i>]) | Getter/setter for the list of objects to render. Each object should be an instance of [Object3D](https://threejs.org/docs/#api/core/Object3D). | `[]` |
| <b>lights</b>([<i>array</i>]) | Getter/setter for the list of lights to use in the scene. Each item should be an instance of [Light](https://threejs.org/docs/#api/en/lights/Light). | `[]` |

### Container layout

| Method | Description | Default |
| --- | --- | :--: |
| <b>width</b>([<i>px</i>]) | Getter/setter for the canvas width. | *&lt;window width&gt;* |
| <b>height</b>([<i>px</i>]) | Getter/setter for the canvas height. | *&lt;window height&gt;* |
| <b>skyRadius</b>([<i>number</i>]) | Radius of the sphere that bounds the scene, in GL units. | 50000 |
| <b>backgroundColor</b>([<i>str</i>]) | Getter/setter for the canvas background color. | `#000011` |
| <b>backgroundImageUrl</b>([<i>url</i>]) | Getter/setter for the URL of the image to be used as scene background. If no image is provided, the background color is shown instead. | `null` |
| <b>onBackgroundImageLoaded</b>([<i>fn</i>]) | Callback function triggered when the background image has finished loading asynchronously and is rendered on the scene. ||
| <b>showNavInfo</b>([<i>boolean</i>]) | Getter/setter for whether to show the navigation controls footer info. | `true` |

### Render control

| Method | Description | Default |
| --- | --- | :--: |
| <b>tick() | Re-render all the objects on the canvas. Essentially this method should be called at every frame, and can be used to control the animation ticks. ||
| <b>cameraPosition</b>([<i>{x,y,z}</i>], [<i>lookAt</i>], [<i>ms</i>]) | Getter/setter for the camera position, in terms of `x`, `y`, `z` coordinates. Each of the coordinates is optional, allowing for motion in just some dimensions. The optional second argument can be used to define the direction that the camera should aim at, in terms of an `{x,y,z}` point in the 3D space at the distance of `1000` away from the camera. The 3rd optional argument defines the duration of the transition (in <i>ms</i>) to animate the camera motion. A value of `0` (default) moves the camera immediately to the final position. | By default the camera will face the center of the graph at a `z` distance of `1000`. |
| <b>zoomToFit</b>([<i>ms</i>], [<i>px</i>], [<i>objFilterFn</i>]) | Automatically moves the camera so that all of the objects in the scene become visible within its field of view, while aiming at the scene center (0,0,0). If no objects are found no action is taken. It accepts three optional arguments: the first defines the duration of the transition (in ms) to animate the camera motion (default: 0ms). The second argument is the amount of padding (in px) between the edge of the canvas and the outermost object position (default: 10px). The third argument specifies a custom object filter: `obj => <boolean>`, which should return a truthy value if the object is to be included. This can be useful for focusing on a portion of the scene. | `(0, 10, obj => true)` |
| <b>fitToBbox</b>(<i>bbox</i>, [<i>ms</i>], [<i>px</i>], [<i>objFilterFn</i>]) | Automatically moves the camera to fit the specified bounding box within its field of view, while aiming at the scene center (0,0,0). The bounding box should follow the syntax `{ x: [<num>, <num>], y: [<num>, <num>], z: [<num>, <num>] }`. If no bounding box is specified no action is taken. It accepts two optional arguments: the first defines the duration of the transition (in ms) to animate the camera motion (default: 0ms). The second argument is the amount of padding (in px) between the edge of the canvas and the outermost object position (default: 10px). | `(0, 10)` |
| <b>postProcessingComposer</b>() | Access the [post-processing composer](https://threejs.org/docs/#examples/en/postprocessing/EffectComposer). Use this to add post-processing [rendering effects](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing) to the scene. By default the composer has a single pass ([RenderPass](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/RenderPass.js)) that directly renders the scene without any effects. || 
| <b>renderer</b>() | Access the [WebGL renderer](https://threejs.org/docs/#api/renderers/WebGLRenderer) object. || 
| <b>camera</b>() | Access the [perspective camera](https://threejs.org/docs/#api/cameras/PerspectiveCamera) object. || 
| <b>scene</b>() | Access the [Scene](https://threejs.org/docs/#api/scenes/Scene) object. ||
| <b>controls</b>() | Access the camera controls object. ||

### Interaction

| Method | Description | Default |
| --- | --- | :--: |
| <b>onClick</b>(<i>fn</i>) | Callback function for object clicks with left mouse button. The object (or `null` if there's no object under the mouse line of sight), the event object and the coordinates of the intersecting point in the object's surface are included as arguments `onClick(object, event, { x, y, z })`. | - |
| <b>onRightClick</b>(<i>fn</i>) | Callback function for object right-clicks. The object (or `null` if there's no object under the mouse line of sight), the event object and the coordinates of the intersecting point in the object's surface are included as arguments `onRightClick(object, event, { x, y, z })`. | - |
| <b>onHover</b>(<i>fn</i>) | Callback function for object mouse over events. The object (or `null` if there's no object under the mouse line of sight) is included as the first argument, and the previous hovered object (or `null`) as second argument: `onHover(obj, prevObj)`. | - |
| <b>hoverOrderComparator</b>([<i>fn</i>]) | Getter/setter for the comparator function to use when hovering over multiple objects under the same line of sight. This function can be used to prioritize hovering some objects over others. | By default, hovering priority is based solely on camera proximity (closest object wins). |
| <b>hoverFilter</b>([<i>fn</i>]) | Getter/setter for the filter function that defines whether an object is eligible for hovering and other interactions. This function receives an object as sole argument and should return a `boolean` value | `() => true` |
| <b>lineHoverPrecision</b>([<i>int</i>]) | Getter/setter for the precision to use when detecting hover events over [Line](https://threejs.org/docs/#api/objects/Line) objects. | 1 |
| <b>tooltipContent</b>([<i>str</i> or <i>fn</i>]) | Object accessor function or attribute for label (shown in tooltip). Supports plain text or HTML content. ||
| <b>enablePointerInteraction([<i>boolean</i>]) | Getter/setter for whether to enable the mouse tracking events. This activates an internal tracker of the canvas mouse position and enables the functionality of object hover/click and tooltip labels, at the cost of performance. If you're looking for maximum gain in your render performance it's recommended to switch off this property. | `true` |
| <b>hoverDuringDrag([<i>boolean</i>]) | Getter/setter for whether to trigger hover events while using the controls via pointer dragging.| `false` |
| <b>clickAfterDrag([<i>boolean</i>]) | Getter/setter for whether to trigger a click event after dragging using the controls.| `false` |
| <b>getPointerPos() | Getter for the current position of the pointer relative to the viewport, in `{ x, y }` px coordinates. ||

###  Utility

| Method | Description |
| --- | --- |
| <b>getBbox</b>([<i>objFilterFn</i>]) | Returns the current bounding box of the objects in the scene, formatted as `{ x: [<num>, <num>], y: [<num>, <num>], z: [<num>, <num>] }`. If no objects are found, returns `null`. Accepts an optional argument to define a custom object filter: `object => <boolean>`, which should return a truthy value if the object is to be included. This can be useful to calculate the bounding box of a portion of the scene.  |
| <b>getScreenCoords</b>(<i>x</i>, <i>y</i>, <i>z</i>) | Utility method to translate 3D coordinates to the viewport domain. Given a set of `x`,`y`,`z` coordinates, returns the current equivalent `{x, y}` in viewport coordinates. |
| <b>getSceneCoords</b>(<i>x</i>, <i>y</i>, <i>distance</i>) | Utility method to translate viewport distance coordinates to the scene 3D domain. Given a set of `x`,`y` viewport coordinates and distance from the camera, returns the current equivalent `{x, y, z}` in 3D scene coordinates. If no distance is provided, defaults to `0`. |
| <b>intersectingObjects</b>(<i>x</i>, <i>y</i>) | Utility method to retrieve the list of objects under the line of sight of the given viewport coordinates. Returns an array of [intersectObject](https://threejs.org/docs/#api/en/core/Raycaster.intersectObject), sorted by distance (from closest to farthest). |

[npm-img]: https://img.shields.io/npm/v/three-render-objects
[npm-url]: https://npmjs.org/package/three-render-objects
[build-size-img]: https://img.shields.io/bundlephobia/minzip/three-render-objects
[build-size-url]: https://bundlephobia.com/result?p=three-render-objects
[npm-downloads-img]: https://img.shields.io/npm/dt/three-render-objects
[npm-downloads-url]: https://www.npmtrends.com/three-render-objects
