import {createScene, createGuide} from 'w-gl';
import LineCollection from './LineCollection';
import PointCollection from './PointCollection';
import bus from './bus';
import createHighLayout from 'ngraph.hde'
import createForceLayout from './createForceLayout';
import findLargestComponent from './findLargestComponent';
import createGraph from 'ngraph.graph';

export default function createGraphScene(canvas, layoutSettings = {}) {
  let drawLinks = true;

  // Since graph can be loaded dynamically, we have these uninitialized
  // and captured into closure. loadGraph will do the initialization
  let graph, layout;
  let scene, nodes, lines, guide;

  let fixedViewBox = false;
  let isRunning = false;
  let rafHandle;

  bus.on('load-graph', loadGraph);

  return {
    dispose,
    runLayout,
    updateLayoutSettings,
    setFixedViewBox,
  };

  function loadGraph(newGraph, desiredLayout) {
    if (scene) {
      scene.dispose();
      layout.dispose();
      scene = null
      isRunning = false;
      cancelAnimationFrame(rafHandle);
    }
    // newGraph = createGraph(); newGraph.addLink(1, 2)
    scene = initScene();

    graph = newGraph; //findLargestComponent(newGraph, 1)[0];

    // Let them play on console with it!
    window.graph = graph;

    guide = createGuide(scene, {showGrid: true, lineColor: 0xffffff10, maxAlpha: 0x10, showCursor: false});
    // this is a standard force layout
    layout = createForceLayout(graph, layoutSettings);

    //standardizePositions(layout)
    let minX = -42, minY = -42;
    let maxX = 42, maxY =42 

    setSceneSize(Math.max(maxX - minX, maxY - minY) * 1.2);
    initUIElements();

    rafHandle = requestAnimationFrame(frame);
  }

  function setSceneSize(sceneSize) {
    scene.setViewBox({
      left:  -sceneSize,
      top:   -sceneSize,
      right:  sceneSize,
      bottom: sceneSize,
    });
  }

  function runLayout(newIsRunning) {
    isRunning = newIsRunning;
  }

  function updateLayoutSettings(newLayoutSettings) {
    let props = ['timeStep', 'springLength', 'springCoefficient', 'dimensions', 'dragCoefficient', 'gravity', 'theta']
    let previousDimensions = (layoutSettings && layoutSettings.dimensions) || 2;
    layoutSettings = props.reduce((settings, name) => (settings[name] = newLayoutSettings[name], settings), {});
    if (!layout) return;

    if (layoutSettings.dimensions !== previousDimensions) {
      let prevLayout = layout;
      layout = createForceLayout(graph, layoutSettings)
      graph.forEachNode(node => {
        let prevPos = prevLayout.getNodePosition(node.id);
        let positions = Object.keys(prevPos).map(name => prevPos[name]);
        for (let i = previousDimensions; i < layoutSettings.dimensions; ++i) {
          // If new layout has more dimensions than the previous layout, fill those with random values:
          positions.push(Math.random());
        }
        positions.unshift(node.id);
        layout.setNodePosition.apply(layout, positions);
      });

      prevLayout.dispose();
    } else {
      props.forEach(name => {
        layout.simulator[name](layoutSettings[name]);
      });
    }
  }

  function setFixedViewBox(isFixed) {
    fixedViewBox = isFixed;
  }

  function initScene() {
    let scene = createScene(canvas);
    scene.setClearColor(12/255, 41/255, 82/255, 1)
    return scene;
  }
  
  function initUIElements() {
    nodes = new PointCollection(scene.getGL(), {
      capacity: graph.getNodesCount()
    });

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 1;
      if (node.data && node.data.size) {
        size = node.data.size;
      } else {
        if (!node.data) node.data = {};
        node.data.size = size;
      }
      node.ui = {size, position: [point.x, point.y, point.z || 0], color: 0x90f8fcff};
      node.uiId = nodes.add(node.ui);
    });

    lines = new LineCollection(scene.getGL(), { capacity: graph.getLinksCount() });

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from: [from.x, from.y, from.z || 0], to: [to.x, to.y, to.z || 0], color: 0xFFFFFF10 };
      link.ui = line;
      link.uiId = lines.add(link.ui);
    });
    // lines.add({from: [0, 0, 0], to: [0, 10, 0], color: 0xFF0000FF})

    scene.appendChild(lines);
    scene.appendChild(nodes);
  }

  function frame() {
    rafHandle = requestAnimationFrame(frame);

    if (isRunning) {
      layout.step();
      if (fixedViewBox) {
        let rect = layout.getGraphRect();
        scene.setViewBox({
          left:  rect.min_x,
          top:   rect.min_y,
          right:  rect.max_x,
          bottom: rect.max_y,
        });
      }
    }
    drawGraph();
    scene.renderFrame();
  }

  function drawGraph() {
    let names = ['x', 'y', 'z']
    // let minR = Infinity; let maxR = -minR;
    // let minG = Infinity; let maxG = -minG;
    // let minB = Infinity; let maxB = -minB;
    // graph.forEachNode(node => {
    //   let pos = layout.getNodePosition(node.id);
    //   if (pos.c4 < minR) minR = pos.c4;
    //   if (pos.c4 > maxR) maxR = pos.c4;

    //   if (pos.c5 < minG) minG = pos.c5;
    //   if (pos.c5 > maxG) maxG = pos.c5;

    //   if (pos.c6 < minB) minB = pos.c6;
    //   if (pos.c6 > maxB) maxB = pos.c6;
    // });

    graph.forEachNode(node => {
      let pos = layout.getNodePosition(node.id);
      let uiPosition = node.ui.position;
      for (let i = 0; i < 3; ++i) {
        uiPosition[i] = pos[names[i]] || 0;
      }
      // let r = Math.floor(255 * (pos.c4 - minR) / (maxR - minR)) << 24;
      // let g = Math.floor(255 * (pos.c5 - minG) / (maxG - minG)) << 16;
      // let b = Math.floor(255 * (pos.c6 - minB) / (maxB - minB)) << 8;
      // [r, g, b] = lab2rgb(
      //   (pos.c4 -  minR) / (maxR - minR),
      //   (pos.c5 - minG) / (maxG - minG),
      //   (pos.c6 - minB) / (maxB - minB)
      // );
      // node.ui.color = (0x000000FF | r | g | b);
      nodes.update(node.uiId, node.ui)
    });

    if (drawLinks) {
      graph.forEachLink(link => {
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        let {from, to} = link.ui;

        for (let i = 0; i < 3; ++i) {
          from[i] = fromPos[names[i]] || 0;
          to[i] = toPos[names[i]] || 0;
        }
        // from[0] = fromPos.x || 0; from[1] = fromPos.y || 0; from[2] = fromPos.z || 0;
        // to[0] = toPos.x || 0; to[1] = toPos.y || 0; to[2] = toPos.z || 0;
        // link.ui.color = lerp(graph.getNode(link.fromId).ui.color, graph.getNode(link.toId).ui.color);
        lines.update(link.uiId, link.ui);
      })
    }
  }

  function lerp(aColor, bColor) {
    let ar = (aColor >> 24) & 0xFF;
    let ag = (aColor >> 16) & 0xFF;
    let ab = (aColor >> 8)  & 0xFF;
    let br = (bColor >> 24) & 0xFF;
    let bg = (bColor >> 16) & 0xFF;
    let bb = (bColor >> 8)  & 0xFF;
    let r = Math.floor((ar + br) / 2);
    let g = Math.floor((ag + bg) / 2);
    let b = Math.floor((ab + bb) / 2);
    return (r << 24) | (g << 16) | (b << 8) | 0xF0;
  }

  function dispose() {
    cancelAnimationFrame(rafHandle);

    scene.dispose();
    bus.off('load-graph', loadGraph);
  }
}

function standardizePositions(layout) {
  let arr = [];
  let avgX = 0, avgY = 0;
  layout.forEachBody(body => {
    arr.push(body.pos);
    avgX += body.pos.x;
    avgY += body.pos.y;
  });
  let meanX = avgX / arr.length;
  let meanY = avgY / arr.length;
  let varX = 0, varY = 0;
  arr.forEach(pos => {
    varX += Math.pow(pos.x - meanX, 2);
    varY += Math.pow(pos.y - meanY, 2);
  });
  varX = Math.sqrt(varX / arr.length);
  varY = Math.sqrt(varY / arr.length);
  arr.forEach(pos => {
    pos.x = 10 * (pos.x - meanX) / varX;
    pos.y = 10 * (pos.y - meanY) / varY;
  });
}