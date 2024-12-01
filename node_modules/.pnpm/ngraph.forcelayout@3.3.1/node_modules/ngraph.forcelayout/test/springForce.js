/* eslint-disable no-shadow */
var test = require('tap').test;

var dimensions = 2;
var createSpringForce = require('../lib/codeGenerators/generateCreateSpringForce')(dimensions);
var Body = require('../lib/codeGenerators/generateCreateBody')(dimensions);
var Spring = require('../lib/spring');
var random = require('ngraph.random')(42);

test('Initialized with default value', function (t) {
  t.throws(() => createSpringForce());
  t.end();
});


test('Should bump bodies at same position', function (t) { 
  var body1 = new Body(0, 0);
  var body2 = new Body(0, 0);
  // length between two bodies is 2, while ideal length is 1. Each body
  // should start moving towards each other after force update
  var idealLength = 1;
  var spring = new Spring(body1, body2, idealLength);
  var springForce = createSpringForce({springCoefficient: 0.1, springLength: 1}, random);
  springForce.update(spring);

  t.ok(body1.force.x > 0, 'Body 1 should go right');
  t.ok(body2.force.x < 0, 'Body 2 should go left');
  t.end();
});

test('Check spring force direction', function (t) {
  var springForce = createSpringForce({springCoefficient: 0.1, springLength: 1});

  t.test('Should contract two bodies when ideal length is smaller than actual', function (t) { 
    var body1 = new Body(-1, 0);
    var body2 = new Body(+1, 0);
    // length between two bodies is 2, while ideal length is 1. Each body
    // should start moving towards each other after force update
    var idealLength = 1;
    var spring = new Spring(body1, body2, idealLength);
    springForce.update(spring);

    t.ok(body1.force.x > 0, 'Body 1 should go right');
    t.ok(body2.force.x < 0, 'Body 2 should go left');
    t.end();
  });

  t.test('Should repel two bodies when ideal length is larger than actual', function (t) { 
    var body1 = new Body(-1, 0);
    var body2 = new Body(+1, 0);
    // length between two bodies is 2, while ideal length is 1. Each body
    // should start moving towards each other after force update
    var idealLength = 3;
    var spring = new Spring(body1, body2, idealLength);
    springForce.update(spring);

    t.ok(body1.force.x < 0, 'Body 1 should go left');
    t.ok(body2.force.x > 0, 'Body 2 should go right');
    t.end();
  });

  t.end();
});
