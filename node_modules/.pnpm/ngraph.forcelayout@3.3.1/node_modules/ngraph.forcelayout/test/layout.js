/* eslint-disable no-shadow */
var test = require('tap').test,
    createGraph = require('ngraph.graph'),
    createLayout = require('..');

test('it exposes simulator', function(t) {
  t.ok(typeof createLayout.simulator === 'function', 'Simulator is exposed');
  t.end();
});

test('it returns spring', function(t) {
  var g = createGraph();
  var layout = createLayout(g);

  var link = g.addLink(1, 2);

  var springForLink = layout.getSpring(link);
  var springForLinkId = layout.getSpring(link.id);
  var springForFromTo = layout.getSpring(1, 2);

  t.ok(springForLink, 'spring is here');
  t.ok(springForLinkId === springForLink, 'Spring is the same');
  t.ok(springForFromTo === springForLink, 'Spring is the same');
  t.end();
});

test('it returns same position', function(t) {
  var g = createGraph();
  var layout = createLayout(g);

  g.addLink(1, 2);

  var firstNodePos = layout.getNodePosition(1);
  layout.step();
  t.ok(firstNodePos === layout.getNodePosition(1), 'Position is the same object');
  layout.step();
  t.ok(firstNodePos === layout.getNodePosition(1), 'Position is the same object after multiple steps');
  t.end();
});

test('it returns body', function(t) {
  var g = createGraph();
  var layout = createLayout(g);

  g.addLink(1, 2);

  t.ok(layout.getBody(1), 'node 1 has body');
  t.ok(layout.getBody(2), 'node 2 has body');
  t.notOk(layout.getBody(4), 'there is no node 4');

  var body = layout.getBody(1);
  t.ok(body.pos.x && body.pos.y, 'Body has a position');
  t.ok(body.mass, 'Body has a mass');

  t.end();
});

test('it can set node mass', function(t) {
  var g = createGraph();
  g.addNode('anvaka');

  var layout = createLayout(g, {
    nodeMass: function (nodeId) {
      t.equal(nodeId, 'anvaka', 'correct node is called');
      return 84; // my mass in kilograms :P
    }
  });

  var body = layout.getBody('anvaka');
  t.equal(body.mass, 84, 'Mass is okay');

  t.end();
});

test('does not tolerate bad input', function (t) {
  t.throws(missingGraph);
  t.throws(invalidNodeId);
  t.end();

  function missingGraph() {
    // graph is missing:
    createLayout();
  }

  function invalidNodeId() {
    var graph = createGraph();
    var layout = createLayout(graph);

    // we don't have nodes in the graph. This should throw:
    layout.getNodePosition(1);
  }
});

test('it fires stable on empty graph', function(t) {
  var graph = createGraph();
  var layout = createLayout(graph);
  layout.on('stable', endTest);
  layout.step();

  function endTest() {
    t.end();
  }
});

test('can add bodies which are standard prototype names', function (t) {
  var graph = createGraph();
  graph.addLink('constructor', 'watch');

  var layout = createLayout(graph);
  layout.step();

  graph.forEachNode(function (node) {
    var pos = layout.getNodePosition(node.id);
    t.ok(pos && typeof pos.x === 'number' &&
         typeof pos.y === 'number', 'Position is defined');
  });

  t.end();
});

test('it can step when no links present', function (t) {
  var graph = createGraph();
  graph.addNode('constructor');
  graph.addNode('watch');

  var layout = createLayout(graph);
  layout.step();

  graph.forEachNode(function (node) {
    var pos = layout.getNodePosition(node.id);
    t.ok(pos && typeof pos.x === 'number' &&
         typeof pos.y === 'number', 'Position is defined');
  });

  t.end();
});

test('layout initializes nodes positions', function (t) {
  var graph = createGraph();
  graph.addLink(1, 2);

  var layout = createLayout(graph);

  // perform one iteration of layout:
  layout.step();

  graph.forEachNode(function (node) {
    var pos = layout.getNodePosition(node.id);
    t.ok(pos && typeof pos.x === 'number' &&
         typeof pos.y === 'number', 'Position is defined');
  });

  graph.forEachLink(function (link) {
    var linkPos = layout.getLinkPosition(link.id);
    t.ok(linkPos && linkPos.from && linkPos.to, 'Link position is defined');
    var fromPos = layout.getNodePosition(link.fromId);
    t.ok(linkPos.from === fromPos, '"From" should be identical to getNodePosition');
    var toPos = layout.getNodePosition(link.toId);
    t.ok(linkPos.to === toPos, '"To" should be identical to getNodePosition');
  });

  t.end();
});

test('Layout can set node position', function (t) {
  var graph = createGraph();
  graph.addLink(1, 2);

  var layout = createLayout(graph);

  layout.pinNode(graph.getNode(1), true);
  layout.setNodePosition(1, 42, 42);

  // perform one iteration of layout:
  layout.step();

  // and make sure node 1 was not moved:
  var actualPosition = layout.getNodePosition(1);
  t.equal(actualPosition.x, 42, 'X has not changed');
  t.equal(actualPosition.y, 42, 'Y has not changed');

  t.end();
});

test('Layout updates bounding box when it sets node position', function (t) {
  var graph = createGraph();
  graph.addLink(1, 2);

  var layout = createLayout(graph);
  layout.setNodePosition(1, 42, 42);
  layout.setNodePosition(2, 40, 40);
  var rect = layout.getGraphRect();
  t.ok(rect.max_x <= 42); t.ok(rect.max_y <= 42);
  t.ok(rect.min_x >= 40); t.ok(rect.min_y >= 40);

  t.end();
});

test('layout initializes links', function (t) {
  var graph = createGraph();
  var node1 = graph.addNode(1); node1.position = {x : -1000, y: 0};
  var node2 = graph.addNode(2); node2.position = {x : 1000, y: 0};

  graph.addLink(1, 2);

  var layout = createLayout(graph);

  // perform one iteration of layout:
  layout.step();

  // since both nodes are connected by spring and distance is too large between
  // them, they should start attracting each other
  var pos1 = layout.getNodePosition(1);
  var pos2 = layout.getNodePosition(2);

  t.ok(pos1.x > -1000, 'Node 1 moves towards node 2');
  t.ok(pos2.x < 1000, 'Node 1 moves towards node 2');

  t.end();
});

test('layout respects proposed original position', function (t) {
  var graph = createGraph();
  var node = graph.addNode(1);

  var initialPosition = {x: 100, y: 100};
  node.position = copy(initialPosition);

  var layout = createLayout(graph);
  layout.step();

  t.same(layout.getNodePosition(node.id), initialPosition, 'original position preserved');

  t.end();
});

test('layout has defined graph rectangle', function (t) {
  t.test('empty graph', function (t) {
    var graph = createGraph();
    var layout = createLayout(graph);

    var rect = layout.getGraphRect();
    var expectedProperties = ['min_x', 'min_y', 'max_x', 'max_y'];
    t.ok(rect && expectedProperties.reduce(hasProperties, true), 'Values are present before step()');

    layout.step();

    t.ok(rect && expectedProperties.reduce(hasProperties, true), 'Values are present after step()');
    t.end();

    function hasProperties(result, key) {
      return result && typeof rect[key] === 'number';
    }
  });

  t.test('two nodes', function (t) {
    var graph = createGraph();
    graph.addLink(1, 2);
    var layout = createLayout(graph);
    layout.step();

    var rect = layout.getGraphRect();
    t.ok(!rectangleIsEmpty(rect), 'Graph rectangle is not empty');

    t.end();
  });

  t.end();
});

test('it does not move pinned nodes', function (t) {
  t.test('respects original data.isPinned attribute', function (t) {
    var graph = createGraph();
    var testNode = graph.addNode(1, { isPinned: true });
    var layout = createLayout(graph);
    t.ok(layout.isNodePinned(testNode), 'Node is pinned');
    t.end();
  });

  t.test('respects node.isPinned attribute', function (t) {
    var graph = createGraph();
    var testNode = graph.addNode(1);

    // this was possible in vivagraph. Port it over to ngraph:
    testNode.isPinned = true;
    var layout = createLayout(graph);
    t.ok(layout.isNodePinned(testNode), 'Node is pinned');
    t.end();
  });

  t.test('can pin nodes after graph is initialized', function (t) {
    var graph = createGraph();
    graph.addLink(1, 2);

    var layout = createLayout(graph);
    layout.pinNode(graph.getNode(1), true);
    layout.step();
    var pos1 = copy(layout.getNodePosition(1));
    var pos2 = copy(layout.getNodePosition(2));

    // make one more step and make sure node 1 did not move:
    layout.step();

    t.ok(!positionChanged(pos1, layout.getNodePosition(1)), 'Node 1 was not moved');
    t.ok(positionChanged(pos2, layout.getNodePosition(2)), 'Node 2 has moved');

    t.end();
  });

  t.end();
});

test('it listens to graph events', function (t) {
  // we first initialize with empty graph:
  var graph = createGraph();
  var layout = createLayout(graph);

  // and only then add nodes:
  graph.addLink(1, 2);

  // make two iterations
  layout.step();
  var pos1 = copy(layout.getNodePosition(1));
  var pos2 = copy(layout.getNodePosition(2));

  layout.step();

  t.ok(positionChanged(pos1, layout.getNodePosition(1)), 'Node 1 has moved');
  t.ok(positionChanged(pos2, layout.getNodePosition(2)), 'Node 2 has moved');

  t.end();
});

test('can stop listen to events', function (t) {
  // we first initialize with empty graph:
  var graph = createGraph();
  var layout = createLayout(graph);
  layout.dispose();

  graph.addLink(1, 2);
  layout.step();
  t.ok(layout.simulator.bodies.length === 0, 'No bodies in the simulator');

  t.end();
});

test('physics simulator', function (t) {
  t.test('has default simulator', function (t) {
    var graph = createGraph();
    var layout = createLayout(graph);

    t.ok(layout.simulator, 'physics simulator is present');
    t.end();
  });

  t.test('can override default settings', function (t) {
    var graph = createGraph();
    var layout = createLayout(graph, {
      theta: 1.5
    });
    t.equal(layout.simulator.theta(), 1.5, 'Simulator settings are overridden');
    t.end();
  });

  t.end();
});

test('it removes removed nodes', function (t) {
  var graph = createGraph();
  var layout = createLayout(graph);
  graph.addLink(1, 2);

  layout.step();
  graph.clear();

  // since we removed everything from graph rect should be empty:
  var rect = layout.getGraphRect();

  t.ok(rectangleIsEmpty(rect), 'Graph rect is empty');
  t.end();
});

test('it can iterate over bodies', function(t) {
  var graph = createGraph();
  var layout = createLayout(graph);
  graph.addLink(1, 2);
  var calledCount = 0;

  layout.forEachBody(function(body, bodyId) {
    t.ok(body.pos, bodyId + ' has position');
    t.ok(graph.getNode(bodyId), bodyId + ' matches a graph node');
    calledCount += 1;
  });

  t.equal(calledCount, 2, 'Both bodies are visited');
  t.end();
});

test('it handles large graphs', function (t) {
  var graph = createGraph();
  var layout = createLayout(graph);

  var count = 60000;

  var i = count;
  while (i--) {
    graph.addNode(i);
  }

  // link each node to 2 other random nodes
  i = count;
  while (i--) {
    graph.addLink(i, Math.ceil(Math.random() * count));
    graph.addLink(i, Math.ceil(Math.random() * count));
  }

  layout.step();

  t.ok(layout.simulator.bodies.length !== 0, 'Bodies in the simulator');
  t.end();
});

test('it can create high dimensional layout', function(t) {
  var graph = createGraph();
  graph.addLink(1, 2);
  var layout = createLayout(graph, {dimensions: 6});
  layout.step();

  var pos = layout.getNodePosition(1);
  t.ok(pos.x !== undefined, 'Position has x');
  t.ok(pos.y !== undefined, 'Position has y');
  t.ok(pos.z !== undefined, 'Position has z');
  t.ok(pos.c4 !== undefined, 'Position has c4');
  t.ok(pos.c5 !== undefined, 'Position has c5');
  t.ok(pos.c6 !== undefined, 'Position has c6');
  t.end();
});

test('it can layout two graphs independently', function(t) {
  var graph1 = createGraph();
  var graph2 = createGraph();
  var layout1 = createLayout(graph1);
  var layout2 = createLayout(graph2);
  graph1.addLink(1, 2);
  graph2.addLink(1, 2);
  layout1.step();
  layout2.step();
  layout2.step();
  t.ok(layout1.getNodePosition(1).x !== layout2.getNodePosition(1).x, 'Positions are different');
  t.end();
});

function positionChanged(pos1, pos2) {
  return (pos1.x !== pos2.x) || (pos1.y !== pos2.y);
}

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function rectangleIsEmpty(rect) {
  return rect.min_x === 0 && rect.min_y === 0 && rect.max_x === 0 && rect.max_y === 0;
}
