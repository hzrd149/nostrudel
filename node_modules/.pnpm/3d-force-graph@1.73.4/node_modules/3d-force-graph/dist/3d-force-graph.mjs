import { AmbientLight, DirectionalLight, Vector3, REVISION } from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import ThreeForceGraph from 'three-forcegraph';
import ThreeRenderObjects from 'three-render-objects';
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

var css_248z = ".graph-info-msg {\n  top: 50%;\n  width: 100%;\n  text-align: center;\n  color: lavender;\n  opacity: 0.7;\n  font-size: 22px;\n  position: absolute;\n  font-family: Sans-serif;\n}\n\n.scene-container .clickable {\n  cursor: pointer;\n}\n\n.scene-container .grabbable {\n  cursor: move;\n  cursor: grab;\n  cursor: -moz-grab;\n  cursor: -webkit-grab;\n}\n\n.scene-container .grabbable:active {\n  cursor: grabbing;\n  cursor: -moz-grabbing;\n  cursor: -webkit-grabbing;\n}";
styleInject(css_248z);

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
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
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
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

function linkKapsule (kapsulePropName, kapsuleType) {
  var dummyK = new kapsuleType(); // To extract defaults
  dummyK._destructor && dummyK._destructor();
  return {
    linkProp: function linkProp(prop) {
      // link property config
      return {
        "default": dummyK[prop](),
        onChange: function onChange(v, state) {
          state[kapsulePropName][prop](v);
        },
        triggerUpdate: false
      };
    },
    linkMethod: function linkMethod(method) {
      // link method pass-through
      return function (state) {
        var kapsuleInstance = state[kapsulePropName];
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        var returnVal = kapsuleInstance[method].apply(kapsuleInstance, args);
        return returnVal === kapsuleInstance ? this // chain based on the parent object, not the inner kapsule
        : returnVal;
      };
    }
  };
}

var three = window.THREE ? window.THREE // Prefer consumption from global THREE, if exists
: {
  AmbientLight: AmbientLight,
  DirectionalLight: DirectionalLight,
  Vector3: Vector3,
  REVISION: REVISION
};

//

var CAMERA_DISTANCE2NODES_FACTOR = 170;

//

// Expose config from forceGraph
var bindFG = linkKapsule('forceGraph', ThreeForceGraph);
var linkedFGProps = Object.assign.apply(Object, _toConsumableArray(['jsonUrl', 'graphData', 'numDimensions', 'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError', 'nodeRelSize', 'nodeId', 'nodeVal', 'nodeResolution', 'nodeColor', 'nodeAutoColorBy', 'nodeOpacity', 'nodeVisibility', 'nodeThreeObject', 'nodeThreeObjectExtend', 'linkSource', 'linkTarget', 'linkVisibility', 'linkColor', 'linkAutoColorBy', 'linkOpacity', 'linkWidth', 'linkResolution', 'linkCurvature', 'linkCurveRotation', 'linkMaterial', 'linkThreeObject', 'linkThreeObjectExtend', 'linkPositionUpdate', 'linkDirectionalArrowLength', 'linkDirectionalArrowColor', 'linkDirectionalArrowRelPos', 'linkDirectionalArrowResolution', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'linkDirectionalParticleResolution', 'forceEngine', 'd3AlphaDecay', 'd3VelocityDecay', 'd3AlphaMin', 'ngraphPhysics', 'warmupTicks', 'cooldownTicks', 'cooldownTime', 'onEngineTick', 'onEngineStop'].map(function (p) {
  return _defineProperty({}, p, bindFG.linkProp(p));
})));
var linkedFGMethods = Object.assign.apply(Object, _toConsumableArray(['refresh', 'getGraphBbox', 'd3Force', 'd3ReheatSimulation', 'emitParticle'].map(function (p) {
  return _defineProperty({}, p, bindFG.linkMethod(p));
})));

// Expose config from renderObjs
var bindRenderObjs = linkKapsule('renderObjs', ThreeRenderObjects);
var linkedRenderObjsProps = Object.assign.apply(Object, _toConsumableArray(['width', 'height', 'backgroundColor', 'showNavInfo', 'enablePointerInteraction'].map(function (p) {
  return _defineProperty({}, p, bindRenderObjs.linkProp(p));
})));
var linkedRenderObjsMethods = Object.assign.apply(Object, _toConsumableArray(['lights', 'cameraPosition', 'postProcessingComposer'].map(function (p) {
  return _defineProperty({}, p, bindRenderObjs.linkMethod(p));
})).concat([{
  graph2ScreenCoords: bindRenderObjs.linkMethod('getScreenCoords'),
  screen2GraphCoords: bindRenderObjs.linkMethod('getSceneCoords')
}]));

//

var _3dForceGraph = Kapsule({
  props: _objectSpread2(_objectSpread2({
    nodeLabel: {
      "default": 'name',
      triggerUpdate: false
    },
    linkLabel: {
      "default": 'name',
      triggerUpdate: false
    },
    linkHoverPrecision: {
      "default": 1,
      onChange: function onChange(p, state) {
        return state.renderObjs.lineHoverPrecision(p);
      },
      triggerUpdate: false
    },
    enableNavigationControls: {
      "default": true,
      onChange: function onChange(enable, state) {
        var controls = state.renderObjs.controls();
        if (controls) {
          controls.enabled = enable;
          // trigger mouseup on re-enable to prevent sticky controls
          enable && controls.domElement && controls.domElement.dispatchEvent(new PointerEvent('pointerup'));
        }
      },
      triggerUpdate: false
    },
    enableNodeDrag: {
      "default": true,
      triggerUpdate: false
    },
    onNodeDrag: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onNodeDragEnd: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onNodeClick: {
      triggerUpdate: false
    },
    onNodeRightClick: {
      triggerUpdate: false
    },
    onNodeHover: {
      triggerUpdate: false
    },
    onLinkClick: {
      triggerUpdate: false
    },
    onLinkRightClick: {
      triggerUpdate: false
    },
    onLinkHover: {
      triggerUpdate: false
    },
    onBackgroundClick: {
      triggerUpdate: false
    },
    onBackgroundRightClick: {
      triggerUpdate: false
    }
  }, linkedFGProps), linkedRenderObjsProps),
  methods: _objectSpread2(_objectSpread2({
    zoomToFit: function zoomToFit(state, transitionDuration, padding) {
      var _state$forceGraph;
      for (var _len = arguments.length, bboxArgs = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        bboxArgs[_key - 3] = arguments[_key];
      }
      state.renderObjs.fitToBbox((_state$forceGraph = state.forceGraph).getGraphBbox.apply(_state$forceGraph, bboxArgs), transitionDuration, padding);
      return this;
    },
    pauseAnimation: function pauseAnimation(state) {
      if (state.animationFrameRequestId !== null) {
        cancelAnimationFrame(state.animationFrameRequestId);
        state.animationFrameRequestId = null;
      }
      return this;
    },
    resumeAnimation: function resumeAnimation(state) {
      if (state.animationFrameRequestId === null) {
        this._animationCycle();
      }
      return this;
    },
    _animationCycle: function _animationCycle(state) {
      if (state.enablePointerInteraction) {
        // reset canvas cursor (override dragControls cursor)
        this.renderer().domElement.style.cursor = null;
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      state.renderObjs.tick();
      state.animationFrameRequestId = requestAnimationFrame(this._animationCycle);
    },
    scene: function scene(state) {
      return state.renderObjs.scene();
    },
    // Expose scene
    camera: function camera(state) {
      return state.renderObjs.camera();
    },
    // Expose camera
    renderer: function renderer(state) {
      return state.renderObjs.renderer();
    },
    // Expose renderer
    controls: function controls(state) {
      return state.renderObjs.controls();
    },
    // Expose controls
    tbControls: function tbControls(state) {
      return state.renderObjs.tbControls();
    },
    // To be deprecated
    _destructor: function _destructor() {
      this.pauseAnimation();
      this.graphData({
        nodes: [],
        links: []
      });
    }
  }, linkedFGMethods), linkedRenderObjsMethods),
  stateInit: function stateInit(_ref5) {
    var controlType = _ref5.controlType,
      rendererConfig = _ref5.rendererConfig,
      extraRenderers = _ref5.extraRenderers;
    var forceGraph = new ThreeForceGraph();
    return {
      forceGraph: forceGraph,
      renderObjs: ThreeRenderObjects({
        controlType: controlType,
        rendererConfig: rendererConfig,
        extraRenderers: extraRenderers
      }).objects([forceGraph]) // Populate scene
      .lights([new three.AmbientLight(0xcccccc, Math.PI), new three.DirectionalLight(0xffffff, 0.6 * Math.PI)])
    };
  },
  init: function init(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = '';

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.style.position = 'relative';

    // Add renderObjs
    var roDomNode = document.createElement('div');
    state.container.appendChild(roDomNode);
    state.renderObjs(roDomNode);
    var camera = state.renderObjs.camera();
    var renderer = state.renderObjs.renderer();
    var controls = state.renderObjs.controls();
    controls.enabled = !!state.enableNavigationControls;
    state.lastSetCameraZ = camera.position.z;

    // Add info space
    var infoElem;
    state.container.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';

    // config forcegraph
    state.forceGraph.onLoading(function () {
      infoElem.textContent = 'Loading...';
    }).onFinishLoading(function () {
      infoElem.textContent = '';
    }).onUpdate(function () {
      // sync graph data structures
      state.graphData = state.forceGraph.graphData();

      // re-aim camera, if still in default position (not user modified)
      if (camera.position.x === 0 && camera.position.y === 0 && camera.position.z === state.lastSetCameraZ && state.graphData.nodes.length) {
        camera.lookAt(state.forceGraph.position);
        state.lastSetCameraZ = camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }
    }).onFinishUpdate(function () {
      // Setup node drag interaction
      if (state._dragControls) {
        var curNodeDrag = state.graphData.nodes.find(function (node) {
          return node.__initialFixedPos && !node.__disposeControlsAfterDrag;
        }); // detect if there's a node being dragged using the existing drag controls
        if (curNodeDrag) {
          curNodeDrag.__disposeControlsAfterDrag = true; // postpone previous controls disposal until drag ends
        } else {
          state._dragControls.dispose(); // cancel previous drag controls
        }
        state._dragControls = undefined;
      }
      if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') {
        // Can't access node positions programmatically in ngraph
        var dragControls = state._dragControls = new DragControls(state.graphData.nodes.map(function (node) {
          return node.__threeObj;
        }).filter(function (obj) {
          return obj;
        }), camera, renderer.domElement);
        dragControls.addEventListener('dragstart', function (event) {
          controls.enabled = false; // Disable controls while dragging

          // track drag object movement
          event.object.__initialPos = event.object.position.clone();
          event.object.__prevPos = event.object.position.clone();
          var node = getGraphObj(event.object).__data;
          !node.__initialFixedPos && (node.__initialFixedPos = {
            fx: node.fx,
            fy: node.fy,
            fz: node.fz
          });
          !node.__initialPos && (node.__initialPos = {
            x: node.x,
            y: node.y,
            z: node.z
          });

          // lock node
          ['x', 'y', 'z'].forEach(function (c) {
            return node["f".concat(c)] = node[c];
          });

          // drag cursor
          renderer.domElement.classList.add('grabbable');
        });
        dragControls.addEventListener('drag', function (event) {
          var nodeObj = getGraphObj(event.object);
          if (!event.object.hasOwnProperty('__graphObjType')) {
            // If dragging a child of the node, update the node object instead
            var initPos = event.object.__initialPos;
            var prevPos = event.object.__prevPos;
            var _newPos = event.object.position;
            nodeObj.position.add(_newPos.clone().sub(prevPos)); // translate node object by the motion delta
            prevPos.copy(_newPos);
            _newPos.copy(initPos); // reset child back to its initial position
          }
          var node = nodeObj.__data;
          var newPos = nodeObj.position;
          var translate = {
            x: newPos.x - node.x,
            y: newPos.y - node.y,
            z: newPos.z - node.z
          };
          // Move fx/fy/fz (and x/y/z) of nodes based on object new position
          ['x', 'y', 'z'].forEach(function (c) {
            return node["f".concat(c)] = node[c] = newPos[c];
          });
          state.forceGraph.d3AlphaTarget(0.3) // keep engine running at low intensity throughout drag
          .resetCountdown(); // prevent freeze while dragging

          node.__dragged = true;
          state.onNodeDrag(node, translate);
        });
        dragControls.addEventListener('dragend', function (event) {
          delete event.object.__initialPos; // remove tracking attributes
          delete event.object.__prevPos;
          var node = getGraphObj(event.object).__data;

          // dispose previous controls if needed
          if (node.__disposeControlsAfterDrag) {
            dragControls.dispose();
            delete node.__disposeControlsAfterDrag;
          }
          var initFixedPos = node.__initialFixedPos;
          var initPos = node.__initialPos;
          var translate = {
            x: initPos.x - node.x,
            y: initPos.y - node.y,
            z: initPos.z - node.z
          };
          if (initFixedPos) {
            ['x', 'y', 'z'].forEach(function (c) {
              var fc = "f".concat(c);
              if (initFixedPos[fc] === undefined) {
                delete node[fc];
              }
            });
            delete node.__initialFixedPos;
            delete node.__initialPos;
            if (node.__dragged) {
              delete node.__dragged;
              state.onNodeDragEnd(node, translate);
            }
          }
          state.forceGraph.d3AlphaTarget(0) // release engine low intensity
          .resetCountdown(); // let the engine readjust after releasing fixed nodes

          if (state.enableNavigationControls) {
            controls.enabled = true; // Re-enable controls
            controls.domElement && controls.domElement.ownerDocument && controls.domElement.ownerDocument.dispatchEvent(
            // simulate mouseup to ensure the controls don't take over after dragend
            new PointerEvent('pointerup', {
              pointerType: 'touch'
            }));
          }

          // clear cursor
          renderer.domElement.classList.remove('grabbable');
        });
      }
    });

    // config renderObjs
    three.REVISION < 155 && (state.renderObjs.renderer().useLegacyLights = false); // force behavior for three < 155
    state.renderObjs.hoverOrderComparator(function (a, b) {
      // Prioritize graph objects
      var aObj = getGraphObj(a);
      if (!aObj) return 1;
      var bObj = getGraphObj(b);
      if (!bObj) return -1;

      // Prioritize nodes over links
      var isNode = function isNode(o) {
        return o.__graphObjType === 'node';
      };
      return isNode(bObj) - isNode(aObj);
    }).tooltipContent(function (obj) {
      var graphObj = getGraphObj(obj);
      return graphObj ? accessorFn(state["".concat(graphObj.__graphObjType, "Label")])(graphObj.__data) || '' : '';
    }).hoverDuringDrag(false).onHover(function (obj) {
      // Update tooltip and trigger onHover events
      var hoverObj = getGraphObj(obj);
      if (hoverObj !== state.hoverObj) {
        var prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
        var prevObjData = state.hoverObj ? state.hoverObj.__data : null;
        var objType = hoverObj ? hoverObj.__graphObjType : null;
        var objData = hoverObj ? hoverObj.__data : null;
        if (prevObjType && prevObjType !== objType) {
          // Hover out
          var fn = state["on".concat(prevObjType === 'node' ? 'Node' : 'Link', "Hover")];
          fn && fn(null, prevObjData);
        }
        if (objType) {
          // Hover in
          var _fn = state["on".concat(objType === 'node' ? 'Node' : 'Link', "Hover")];
          _fn && _fn(objData, prevObjType === objType ? prevObjData : null);
        }

        // set pointer if hovered object is clickable
        renderer.domElement.classList[hoverObj && state["on".concat(objType === 'node' ? 'Node' : 'Link', "Click")] || !hoverObj && state.onBackgroundClick ? 'add' : 'remove']('clickable');
        state.hoverObj = hoverObj;
      }
    }).clickAfterDrag(false).onClick(function (obj, ev) {
      var graphObj = getGraphObj(obj);
      if (graphObj) {
        var fn = state["on".concat(graphObj.__graphObjType === 'node' ? 'Node' : 'Link', "Click")];
        fn && fn(graphObj.__data, ev);
      } else {
        state.onBackgroundClick && state.onBackgroundClick(ev);
      }
    }).onRightClick(function (obj, ev) {
      // Handle right-click events
      var graphObj = getGraphObj(obj);
      if (graphObj) {
        var fn = state["on".concat(graphObj.__graphObjType === 'node' ? 'Node' : 'Link', "RightClick")];
        fn && fn(graphObj.__data, ev);
      } else {
        state.onBackgroundRightClick && state.onBackgroundRightClick(ev);
      }
    });

    //

    // Kick-off renderer
    this._animationCycle();
  }
});

//

function getGraphObj(object) {
  var obj = object;
  // recurse up object chain until finding the graph object
  while (obj && !obj.hasOwnProperty('__graphObjType')) {
    obj = obj.parent;
  }
  return obj;
}

export { _3dForceGraph as default };
