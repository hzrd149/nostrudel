var test = require('tap').test;

var dimensions = 2;
var createQuadTree = require('../lib/codeGenerators/generateQuadTree')(dimensions);
var Body = require('../lib/codeGenerators/generateCreateBody')(dimensions);
var random = require('ngraph.random').random(42);

test('insert and update update forces', function (t) {
  var tree = createQuadTree({}, random);
  var body = new Body();
  var clone = JSON.parse(JSON.stringify(body));

  tree.insertBodies([body]);
  tree.updateBodyForce(body);
  t.same(body, clone, 'The body should not be changed - there are no forces acting on it');
  t.end();
});

test('it can get root', function (t) {
  var tree = createQuadTree({}, random);
  var body = new Body();

  tree.insertBodies([body]);
  var root = tree.getRoot();
  t.ok(root, 'Root is present');
  t.equal(root.body, body, 'Body is initialized');
  t.end();
});

test('Two bodies repel each other', function (t) {
  var tree = createQuadTree({}, random);
  var bodyA = new Body(); bodyA.pos.x = 1; bodyA.pos.y = 0;
  var bodyB = new Body(); bodyB.pos.x = 2; bodyB.pos.y = 0;

  tree.insertBodies([bodyA, bodyB]);
  tree.updateBodyForce(bodyA);
  tree.updateBodyForce(bodyB);
  // based on our physical model construction forces should be equivalent, with
  // opposite sign:
  t.ok(bodyA.force.x + bodyB.force.x === 0, 'Forces should be same, with opposite sign');
  t.ok(bodyA.force.x !== 0, 'X-force for body A should not be zero');
  t.ok(bodyB.force.x !== 0, 'X-force for body B should not be zero');
  // On the other hand, our bodies should not move by Y axis:
  t.ok(bodyA.force.y === 0, 'Y-force for body A should be zero');
  t.ok(bodyB.force.y === 0, 'Y-force for body B should be zero');

  t.end();
});

test('Can handle two bodies at the same location', function (t) {
  var tree = createQuadTree({}, random);
  var bodyA = new Body();
  var bodyB = new Body();

  tree.insertBodies([bodyA, bodyB]);
  tree.updateBodyForce(bodyA);
  tree.updateBodyForce(bodyB);

  t.end();
});

test('it does not stuck', function(t) {
  var count = 60000;
  var bodies = [];

  for (var i = 0; i < count; ++i) {
    bodies.push(new Body(Math.random(), Math.random()));
  }

  var quadTree = createQuadTree({}, random);
  quadTree.insertBodies(bodies);

  bodies.forEach(function(body) {
    quadTree.updateBodyForce(body);
  });
  t.ok(1);
  t.end();
});
