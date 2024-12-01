import { WebGLRenderer, Scene, PerspectiveCamera, Raycaster, SRGBColorSpace, TextureLoader, Vector2, Vector3, Box3, Color, Mesh, SphereGeometry, MeshBasicMaterial, BackSide, EventDispatcher, MOUSE, Quaternion, Spherical, Clock } from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { parseToRgb, opacify } from 'polished';
import { Tween, Easing, Group } from '@tweenjs/tween.js';
import accessorFn from 'accessor-fn';
import Kapsule from 'kapsule';

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;
  if (typeof document === 'undefined') {
    return;
  }
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".scene-nav-info {\n  bottom: 5px;\n  width: 100%;\n  text-align: center;\n  color: slategrey;\n  opacity: 0.7;\n  font-size: 10px;\n}\n\n.scene-tooltip {\n  top: 0;\n  color: lavender;\n  font-size: 15px;\n}\n\n.scene-nav-info, .scene-tooltip {\n  position: absolute;\n  font-family: sans-serif;\n  pointer-events: none;\n  user-select: none;\n}\n\n.scene-container canvas:focus {\n  outline: none;\n}";
styleInject(css_248z);

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var three = window.THREE ? window.THREE // Prefer consumption from global THREE, if exists
: {
  WebGLRenderer: WebGLRenderer,
  Scene: Scene,
  PerspectiveCamera: PerspectiveCamera,
  Raycaster: Raycaster,
  SRGBColorSpace: SRGBColorSpace,
  TextureLoader: TextureLoader,
  Vector2: Vector2,
  Vector3: Vector3,
  Box3: Box3,
  Color: Color,
  Mesh: Mesh,
  SphereGeometry: SphereGeometry,
  MeshBasicMaterial: MeshBasicMaterial,
  BackSide: BackSide,
  EventDispatcher: EventDispatcher,
  MOUSE: MOUSE,
  Quaternion: Quaternion,
  Spherical: Spherical,
  Clock: Clock
};
var threeRenderObjects = Kapsule({
  props: {
    width: {
      "default": window.innerWidth,
      onChange: function onChange(width, state, prevWidth) {
        isNaN(width) && (state.width = prevWidth);
      }
    },
    height: {
      "default": window.innerHeight,
      onChange: function onChange(height, state, prevHeight) {
        isNaN(height) && (state.height = prevHeight);
      }
    },
    backgroundColor: {
      "default": '#000011'
    },
    backgroundImageUrl: {},
    onBackgroundImageLoaded: {},
    showNavInfo: {
      "default": true
    },
    skyRadius: {
      "default": 50000
    },
    objects: {
      "default": []
    },
    lights: {
      "default": []
    },
    enablePointerInteraction: {
      "default": true,
      onChange: function onChange(_, state) {
        // Reset hover state
        state.hoverObj = null;
        if (state.toolTipElem) state.toolTipElem.innerHTML = '';
      },
      triggerUpdate: false
    },
    lineHoverPrecision: {
      "default": 1,
      triggerUpdate: false
    },
    hoverOrderComparator: {
      "default": function _default() {
        return -1;
      },
      triggerUpdate: false
    },
    // keep existing order by default
    hoverFilter: {
      "default": function _default() {
        return true;
      },
      triggerUpdate: false
    },
    // exclude objects from interaction
    tooltipContent: {
      triggerUpdate: false
    },
    hoverDuringDrag: {
      "default": false,
      triggerUpdate: false
    },
    clickAfterDrag: {
      "default": false,
      triggerUpdate: false
    },
    onHover: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onClick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onRightClick: {
      triggerUpdate: false
    }
  },
  methods: {
    tick: function tick(state) {
      if (state.initialised) {
        state.controls.update && state.controls.update(Math.min(1, state.clock.getDelta())); // timedelta is required for fly controls

        state.postProcessingComposer ? state.postProcessingComposer.render() // if using postprocessing, switch the output to it
        : state.renderer.render(state.scene, state.camera);
        state.extraRenderers.forEach(function (r) {
          return r.render(state.scene, state.camera);
        });
        if (state.enablePointerInteraction) {
          // Update tooltip and trigger onHover events
          var topObject = null;
          if (state.hoverDuringDrag || !state.isPointerDragging) {
            var intersects = this.intersectingObjects(state.pointerPos.x, state.pointerPos.y).filter(function (d) {
              return state.hoverFilter(d.object);
            }).sort(function (a, b) {
              return state.hoverOrderComparator(a.object, b.object);
            });
            var topIntersect = intersects.length ? intersects[0] : null;
            topObject = topIntersect ? topIntersect.object : null;
            state.intersectionPoint = topIntersect ? topIntersect.point : null;
          }
          if (topObject !== state.hoverObj) {
            state.onHover(topObject, state.hoverObj);
            state.toolTipElem.innerHTML = topObject ? accessorFn(state.tooltipContent)(topObject) || '' : '';
            state.hoverObj = topObject;
          }
        }
        state.tweenGroup.update(); // update camera animation tweens
      }
      return this;
    },
    getPointerPos: function getPointerPos(state) {
      var _state$pointerPos = state.pointerPos,
        x = _state$pointerPos.x,
        y = _state$pointerPos.y;
      return {
        x: x,
        y: y
      };
    },
    cameraPosition: function cameraPosition(state, position, lookAt, transitionDuration) {
      var camera = state.camera;

      // Setter
      if (position && state.initialised) {
        var finalPos = position;
        var finalLookAt = lookAt || {
          x: 0,
          y: 0,
          z: 0
        };
        if (!transitionDuration) {
          // no animation
          setCameraPos(finalPos);
          setLookAt(finalLookAt);
        } else {
          var camPos = Object.assign({}, camera.position);
          var camLookAt = getLookAt();
          state.tweenGroup.add(new Tween(camPos).to(finalPos, transitionDuration).easing(Easing.Quadratic.Out).onUpdate(setCameraPos).start());

          // Face direction in 1/3rd of time
          state.tweenGroup.add(new Tween(camLookAt).to(finalLookAt, transitionDuration / 3).easing(Easing.Quadratic.Out).onUpdate(setLookAt).start());
        }
        return this;
      }

      // Getter
      return Object.assign({}, camera.position, {
        lookAt: getLookAt()
      });

      //

      function setCameraPos(pos) {
        var x = pos.x,
          y = pos.y,
          z = pos.z;
        if (x !== undefined) camera.position.x = x;
        if (y !== undefined) camera.position.y = y;
        if (z !== undefined) camera.position.z = z;
      }
      function setLookAt(lookAt) {
        var lookAtVect = new three.Vector3(lookAt.x, lookAt.y, lookAt.z);
        if (state.controls.target) {
          state.controls.target = lookAtVect;
        } else {
          // Fly controls doesn't have target attribute
          camera.lookAt(lookAtVect); // note: lookAt may be overridden by other controls in some cases
        }
      }
      function getLookAt() {
        return Object.assign(new three.Vector3(0, 0, -1000).applyQuaternion(camera.quaternion).add(camera.position));
      }
    },
    zoomToFit: function zoomToFit(state) {
      var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var padding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
      for (var _len = arguments.length, bboxArgs = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        bboxArgs[_key - 3] = arguments[_key];
      }
      return this.fitToBbox(this.getBbox.apply(this, bboxArgs), transitionDuration, padding);
    },
    fitToBbox: function fitToBbox(state, bbox) {
      var transitionDuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var padding = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;
      // based on https://discourse.threejs.org/t/camera-zoom-to-fit-object/936/24
      var camera = state.camera;
      if (bbox) {
        var center = new three.Vector3(0, 0, 0); // reset camera aim to center
        var maxBoxSide = Math.max.apply(Math, _toConsumableArray(Object.entries(bbox).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            coordType = _ref2[0],
            coords = _ref2[1];
          return Math.max.apply(Math, _toConsumableArray(coords.map(function (c) {
            return Math.abs(center[coordType] - c);
          })));
        }))) * 2;

        // find distance that fits whole bbox within padded fov
        var paddedFov = (1 - padding * 2 / state.height) * camera.fov;
        var fitHeightDistance = maxBoxSide / Math.atan(paddedFov * Math.PI / 180);
        var fitWidthDistance = fitHeightDistance / camera.aspect;
        var distance = Math.max(fitHeightDistance, fitWidthDistance);
        if (distance > 0) {
          var newCameraPosition = center.clone().sub(camera.position).normalize().multiplyScalar(-distance);
          this.cameraPosition(newCameraPosition, center, transitionDuration);
        }
      }
      return this;
    },
    getBbox: function getBbox(state) {
      var objFilter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
        return true;
      };
      var box = new three.Box3(new three.Vector3(0, 0, 0), new three.Vector3(0, 0, 0));
      var objs = state.objects.filter(objFilter);
      if (!objs.length) return null;
      objs.forEach(function (obj) {
        return box.expandByObject(obj);
      });

      // extract global x,y,z min/max
      return Object.assign.apply(Object, _toConsumableArray(['x', 'y', 'z'].map(function (c) {
        return _defineProperty({}, c, [box.min[c], box.max[c]]);
      })));
    },
    getScreenCoords: function getScreenCoords(state, x, y, z) {
      var vec = new three.Vector3(x, y, z);
      vec.project(this.camera()); // project to the camera plane
      return {
        // align relative pos to canvas dimensions
        x: (vec.x + 1) * state.width / 2,
        y: -(vec.y - 1) * state.height / 2
      };
    },
    getSceneCoords: function getSceneCoords(state, screenX, screenY) {
      var distance = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var relCoords = new three.Vector2(screenX / state.width * 2 - 1, -(screenY / state.height) * 2 + 1);
      var raycaster = new three.Raycaster();
      raycaster.setFromCamera(relCoords, state.camera);
      return Object.assign({}, raycaster.ray.at(distance, new three.Vector3()));
    },
    intersectingObjects: function intersectingObjects(state, x, y) {
      var relCoords = new three.Vector2(x / state.width * 2 - 1, -(y / state.height) * 2 + 1);
      var raycaster = new three.Raycaster();
      raycaster.params.Line.threshold = state.lineHoverPrecision; // set linePrecision
      raycaster.setFromCamera(relCoords, state.camera);
      return raycaster.intersectObjects(state.objects, true);
    },
    renderer: function renderer(state) {
      return state.renderer;
    },
    scene: function scene(state) {
      return state.scene;
    },
    camera: function camera(state) {
      return state.camera;
    },
    postProcessingComposer: function postProcessingComposer(state) {
      return state.postProcessingComposer;
    },
    controls: function controls(state) {
      return state.controls;
    },
    tbControls: function tbControls(state) {
      return state.controls;
    } // to be deprecated
  },
  stateInit: function stateInit() {
    return {
      scene: new three.Scene(),
      camera: new three.PerspectiveCamera(),
      clock: new three.Clock(),
      tweenGroup: new Group()
    };
  },
  init: function init(domNode, state) {
    var _ref4 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref4$controlType = _ref4.controlType,
      controlType = _ref4$controlType === void 0 ? 'trackball' : _ref4$controlType,
      _ref4$rendererConfig = _ref4.rendererConfig,
      rendererConfig = _ref4$rendererConfig === void 0 ? {} : _ref4$rendererConfig,
      _ref4$extraRenderers = _ref4.extraRenderers,
      extraRenderers = _ref4$extraRenderers === void 0 ? [] : _ref4$extraRenderers,
      _ref4$waitForLoadComp = _ref4.waitForLoadComplete,
      waitForLoadComplete = _ref4$waitForLoadComp === void 0 ? true : _ref4$waitForLoadComp;
    // Wipe DOM
    domNode.innerHTML = '';

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.className = 'scene-container';
    state.container.style.position = 'relative';

    // Add nav info section
    state.container.appendChild(state.navInfo = document.createElement('div'));
    state.navInfo.className = 'scene-nav-info';
    state.navInfo.textContent = {
      orbit: 'Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan',
      trackball: 'Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan',
      fly: 'WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw'
    }[controlType] || '';
    state.navInfo.style.display = state.showNavInfo ? null : 'none';

    // Setup tooltip
    state.toolTipElem = document.createElement('div');
    state.toolTipElem.classList.add('scene-tooltip');
    state.container.appendChild(state.toolTipElem);

    // Capture pointer coords on move or touchstart
    state.pointerPos = new three.Vector2();
    state.pointerPos.x = -2; // Initialize off canvas
    state.pointerPos.y = -2;
    ['pointermove', 'pointerdown'].forEach(function (evType) {
      return state.container.addEventListener(evType, function (ev) {
        // track click state
        evType === 'pointerdown' && (state.isPointerPressed = true);

        // detect point drag
        !state.isPointerDragging && ev.type === 'pointermove' && (ev.pressure > 0 || state.isPointerPressed) // ev.pressure always 0 on Safari, so we used the isPointerPressed tracker
        && (ev.pointerType !== 'touch' || ev.movementX === undefined || [ev.movementX, ev.movementY].some(function (m) {
          return Math.abs(m) > 1;
        })) // relax drag trigger sensitivity on touch events
        && (state.isPointerDragging = true);
        if (state.enablePointerInteraction) {
          // update the pointer pos
          var offset = getOffset(state.container);
          state.pointerPos.x = ev.pageX - offset.left;
          state.pointerPos.y = ev.pageY - offset.top;

          // Move tooltip
          state.toolTipElem.style.top = "".concat(state.pointerPos.y, "px");
          state.toolTipElem.style.left = "".concat(state.pointerPos.x, "px");
          // adjust horizontal position to not exceed canvas boundaries
          state.toolTipElem.style.transform = "translate(-".concat(state.pointerPos.x / state.width * 100, "%, ").concat(
          // flip to above if near bottom
          state.height - state.pointerPos.y < 100 ? 'calc(-100% - 8px)' : '21px', ")");
        }
        function getOffset(el) {
          var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft
          };
        }
      }, {
        passive: true
      });
    });

    // Handle click events on objs
    state.container.addEventListener('pointerup', function (ev) {
      state.isPointerPressed = false;
      if (state.isPointerDragging) {
        state.isPointerDragging = false;
        if (!state.clickAfterDrag) return; // don't trigger onClick after pointer drag (camera motion via controls)
      }
      requestAnimationFrame(function () {
        // trigger click events asynchronously, to allow hoverObj to be set (on frame)
        if (ev.button === 0) {
          // left-click
          state.onClick(state.hoverObj || null, ev, state.intersectionPoint); // trigger background clicks with null
        }
        if (ev.button === 2 && state.onRightClick) {
          // right-click
          state.onRightClick(state.hoverObj || null, ev, state.intersectionPoint);
        }
      });
    }, {
      passive: true,
      capture: true
    }); // use capture phase to prevent propagation blocking from controls (specifically for fly)

    state.container.addEventListener('contextmenu', function (ev) {
      if (state.onRightClick) ev.preventDefault(); // prevent default contextmenu behavior and allow pointerup to fire instead
    });

    // Setup renderer, camera and controls
    state.renderer = new three.WebGLRenderer(Object.assign({
      antialias: true,
      alpha: true
    }, rendererConfig));
    state.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)); // clamp device pixel ratio
    state.container.appendChild(state.renderer.domElement);

    // Setup extra renderers
    state.extraRenderers = extraRenderers;
    state.extraRenderers.forEach(function (r) {
      // overlay them on top of main renderer
      r.domElement.style.position = 'absolute';
      r.domElement.style.top = '0px';
      r.domElement.style.pointerEvents = 'none';
      state.container.appendChild(r.domElement);
    });

    // configure post-processing composer
    state.postProcessingComposer = new EffectComposer(state.renderer);
    state.postProcessingComposer.addPass(new RenderPass(state.scene, state.camera)); // render scene as first pass

    // configure controls
    state.controls = new {
      trackball: TrackballControls,
      orbit: OrbitControls,
      fly: FlyControls
    }[controlType](state.camera, state.renderer.domElement);
    if (controlType === 'fly') {
      state.controls.movementSpeed = 300;
      state.controls.rollSpeed = Math.PI / 6;
      state.controls.dragToLook = true;
    }
    if (controlType === 'trackball' || controlType === 'orbit') {
      state.controls.minDistance = 0.1;
      state.controls.maxDistance = state.skyRadius;
      state.controls.addEventListener('start', function () {
        state.controlsEngaged = true;
      });
      state.controls.addEventListener('change', function () {
        if (state.controlsEngaged) {
          state.controlsDragging = true;
        }
      });
      state.controls.addEventListener('end', function () {
        state.controlsEngaged = false;
        state.controlsDragging = false;
      });
    }
    [state.renderer, state.postProcessingComposer].concat(_toConsumableArray(state.extraRenderers)).forEach(function (r) {
      return r.setSize(state.width, state.height);
    });
    state.camera.aspect = state.width / state.height;
    state.camera.updateProjectionMatrix();
    state.camera.position.z = 1000;

    // add sky
    state.scene.add(state.skysphere = new three.Mesh());
    state.skysphere.visible = false;
    state.loadComplete = state.scene.visible = !waitForLoadComplete;
    window.scene = state.scene;
  },
  update: function update(state, changedProps) {
    // resize canvas
    if (state.width && state.height && (changedProps.hasOwnProperty('width') || changedProps.hasOwnProperty('height'))) {
      state.container.style.width = "".concat(state.width, "px");
      state.container.style.height = "".concat(state.height, "px");
      [state.renderer, state.postProcessingComposer].concat(_toConsumableArray(state.extraRenderers)).forEach(function (r) {
        return r.setSize(state.width, state.height);
      });
      state.camera.aspect = state.width / state.height;
      state.camera.updateProjectionMatrix();
    }
    if (changedProps.hasOwnProperty('skyRadius') && state.skyRadius) {
      state.controls.hasOwnProperty('maxDistance') && changedProps.skyRadius && (state.controls.maxDistance = Math.min(state.controls.maxDistance, state.skyRadius));
      state.camera.far = state.skyRadius * 2.5;
      state.camera.updateProjectionMatrix();
      state.skysphere.geometry = new three.SphereGeometry(state.skyRadius);
    }
    if (changedProps.hasOwnProperty('backgroundColor')) {
      var alpha = parseToRgb(state.backgroundColor).alpha;
      if (alpha === undefined) alpha = 1;
      state.renderer.setClearColor(new three.Color(opacify(1, state.backgroundColor)), alpha);
    }
    if (changedProps.hasOwnProperty('backgroundImageUrl')) {
      if (!state.backgroundImageUrl) {
        state.skysphere.visible = false;
        state.skysphere.material.map = null;
        !state.loadComplete && finishLoad();
      } else {
        new three.TextureLoader().load(state.backgroundImageUrl, function (texture) {
          texture.colorSpace = three.SRGBColorSpace;
          state.skysphere.material = new three.MeshBasicMaterial({
            map: texture,
            side: three.BackSide
          });
          state.skysphere.visible = true;

          // triggered when background image finishes loading (asynchronously to allow 1 frame to load texture)
          state.onBackgroundImageLoaded && setTimeout(state.onBackgroundImageLoaded);
          !state.loadComplete && finishLoad();
        });
      }
    }
    changedProps.hasOwnProperty('showNavInfo') && (state.navInfo.style.display = state.showNavInfo ? null : 'none');
    if (changedProps.hasOwnProperty('lights')) {
      (changedProps.lights || []).forEach(function (light) {
        return state.scene.remove(light);
      }); // Clear the place
      state.lights.forEach(function (light) {
        return state.scene.add(light);
      }); // Add to scene
    }
    if (changedProps.hasOwnProperty('objects')) {
      (changedProps.objects || []).forEach(function (obj) {
        return state.scene.remove(obj);
      }); // Clear the place
      state.objects.forEach(function (obj) {
        return state.scene.add(obj);
      }); // Add to scene
    }

    //

    function finishLoad() {
      state.loadComplete = state.scene.visible = true;
    }
  }
});

export { threeRenderObjects as default };
