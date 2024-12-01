/* eslint-disable no-shadow */
var test = require('tap').test;
var dimensions = 2;
var Body = require('../lib/codeGenerators/generateCreateBody')(dimensions);
var createSimulator = require('../lib/createPhysicsSimulator');

test('Can step without bodies', function (t) {
  var simulator = createSimulator();
  t.equal(simulator.bodies.length, 0, 'There should be no bodies');
  t.equal(simulator.springs.length, 0, 'There should be no springs');
  simulator.step();
  t.end();
});

test('it has settings exposed', function(t) {
  var mySettings = { };
  var simulator = createSimulator(mySettings);
  t.ok(mySettings === simulator.settings, 'settings are exposed');
  t.end();
});

test('it gives amount of total movement', function(t) {
  var simulator = createSimulator();
  var body1 = new Body(-10, 0);
  var body2 = new Body(10, 0);
  simulator.addBody(body1);
  simulator.addBody(body2);
  simulator.step();

  var totalMoved = simulator.getTotalMovement();
  t.ok(!isNaN(totalMoved), 'Amount of total movement is returned');
  t.end();
});

test('it can add a body at given position', function(t) {
  var simulator = createSimulator();
  var pos1 = {x: -10, y: 0};
  var pos2 = {x: 10, y: 0};
  simulator.addBodyAt(pos1);
  simulator.addBodyAt(pos2);

  t.equal(simulator.bodies.length, 2, 'All bodies are added');
  var body1 = simulator.bodies[0];

  t.equal(body1.pos.x, -10, 'X is there');
  t.equal(body1.pos.y, 0, 'Y is there');

  var body2 = simulator.bodies[1];
  t.equal(body2.pos.x, 10, 'X is there');
  t.equal(body2.pos.y, 0, 'Y is there');
  t.end();
});

test('Does not update position of one body', function (t) {
  var simulator = createSimulator();
  var body = new Body(0, 0);
  simulator.addBody(body);

  simulator.step(1);
  t.equal(simulator.bodies.length, 1, 'Number of bodies is 1');
  t.equal(simulator.springs.length, 0, 'Number of springs is 0');
  t.equal(simulator.bodies[0], body, 'Body points to actual object');
  t.equal(body.pos.x, 0, 'X is not changed');
  t.equal(body.pos.y, 0, 'Y is not changed');
  t.end();
});

test('throws on no body or no pos', t => {
  var simulator = createSimulator();
  t.throws(() => simulator.addBody(), /Body is required/);
  t.throws(() => simulator.addBodyAt(), /Body position is required/);
  t.end();
});

test('throws on no spring', t => {
  var simulator = createSimulator();
  t.throws(() => simulator.addSpring(), /Cannot add null spring to force simulator/);
  t.end();
});

test('Can add and remove forces', function (t) {
  var simulator = createSimulator();
  var testForce = function () {};
  simulator.addForce('foo', testForce);
  t.equal(simulator.getForces().get('foo'), testForce);

  simulator.removeForce('foo');
  t.equal(simulator.getForces().get('foo'), undefined);

  simulator.removeForce('foo');
  // should still be good
  t.end();
});

test('Can configure forces', function (t) {
  t.test('Gravity', function (t) {
    var simulator = createSimulator();
    var body1 = new Body(0, 0);
    var body2 = new Body(1, 0);

    simulator.addBody(body1);
    simulator.addBody(body2);

    simulator.step();
    // by default gravity is negative, bodies should repel each other:
    var x1 = body1.pos.x;
    var x2 = body2.pos.x;
    t.ok(x1 < 0, 'Body 1 moves away from body 2');
    t.ok(x2 > 1, 'Body 2 moves away from body 1');

    // now reverse gravity, and bodies should attract each other:
    simulator.gravity(100);
    simulator.step();
    t.ok(body1.pos.x > x1, 'Body 1 moved towards body 2');
    t.ok(body2.pos.x < x2, 'Body 2 moved towards body 1');

    t.end();
  });

  t.test('Drag', function (t) {
    var simulator = createSimulator();
    var body1 = new Body(0, 0);
    body1.velocity.x = -1; // give it small impulse
    simulator.addBody(body1);

    simulator.step();

    var x1 = body1.velocity.x;
    // by default drag force will slow down entire system:
    t.ok(x1 > -1, 'Body 1 moves at reduced speed');

    // Restore original velocity, but now set drag force to 0
    body1.velocity.x = -1;
    simulator.dragCoefficient(0);
    simulator.step();
    t.ok(body1.velocity.x === -1, 'Velocity should remain unchanged');
    t.end();
  });
  t.end();
});

test('Can remove bodies', function (t) {
  var simulator = createSimulator();
  var body = new Body(0, 0);
  simulator.addBody(body);
  t.equal(simulator.bodies.length, 1, 'Number of bodies is 1');
  var result = simulator.removeBody(body);
  t.equal(result, true, 'body successfully removed');
  t.equal(simulator.bodies.length, 0, 'Number of bodies is 0');
  t.end();
});

test('Updates position for two bodies', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(-1, 0);
  var body2 = new Body(1, 0);
  simulator.addBody(body1);
  simulator.addBody(body2);

  simulator.step();
  t.equal(simulator.bodies.length, 2, 'Number of bodies is 2');
  t.ok(body1.pos.x !== 0, 'Body1.X has changed');
  t.ok(body2.pos.x !== 0, 'Body2.X has changed');

  t.equal(body1.pos.y, 0, 'Body1.Y has not changed');
  t.equal(body2.pos.y, 0, 'Body2.Y has not changed');
  t.end();
});

test('add spring should not add bodies', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(-1, 0);
  var body2 = new Body(1, 0);

  simulator.addSpring(body1, body2, 10);

  t.equal(simulator.bodies.length, 0, 'Should not add two bodies');
  t.equal(simulator.bodies.length, 0, 'Should not add two bodies');
  t.equal(simulator.springs.length, 1, 'Should have a spring');
  t.end();
});

test('Spring affects bodies positions', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(-10, 0);
  var body2 = new Body(10, 0);
  simulator.addBody(body1);
  simulator.addBody(body2);
  // If you take this out, bodies will repel each other:
  simulator.addSpring(body1, body2, 1);

  simulator.step();

  t.ok(body1.pos.x > -10, 'Body 1 should move towards body 2');
  t.ok(body2.pos.x < 10, 'Body 2 should move towards body 1');

  t.end();
});

test('Can remove springs', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(-10, 0);
  var body2 = new Body(10, 0);
  simulator.addBody(body1);
  simulator.addBody(body2);
  var spring = simulator.addSpring(body1, body2, 1);
  simulator.removeSpring(spring);

  simulator.step();

  t.ok(body1.pos.x < -10, 'Body 1 should move away from body 2');
  t.ok(body2.pos.x > 10, 'Body 2 should move away from body 1');

  t.end();
});

test('Get bounding box', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(0, 0);
  var body2 = new Body(10, 10);
  simulator.addBody(body1);
  simulator.addBody(body2);
  simulator.step(); // this will move bodies farther away
  var bbox = simulator.getBBox();
  t.ok(bbox.min_x <= 0, 'Left is 0');
  t.ok(bbox.min_y <= 0, 'Top is 0');
  t.ok(bbox.max_x >= 10, 'right is 10');
  t.ok(bbox.max_y >= 10, 'bottom is 10');
  t.end();
});

test('it updates bounding box', function (t) {
  var simulator = createSimulator();
  var body1 = new Body(0, 0);
  var body2 = new Body(10, 10);
  simulator.addBody(body1);
  simulator.addBody(body2);
  var bbox = simulator.getBBox();

  t.ok(bbox.min_x === 0, 'Left is 0');
  t.ok(bbox.min_y === 0, 'Top is 0');
  t.ok(bbox.max_x === 10, 'right is 10');
  t.ok(bbox.max_y === 10, 'bottom is 10');

  body1.setPosition(15, 15);
  simulator.invalidateBBox();
  bbox = simulator.getBBox();

  t.ok(bbox.min_x === 10, 'Left is 10');
  t.ok(bbox.min_y === 10, 'Top is 10');
  t.ok(bbox.max_x === 15, 'right is 15');
  t.ok(bbox.max_y === 15, 'bottom is 15');
  t.end();
});

test('Get best position', function (t) {
  t.test('can get with empty simulator', function (t) {
    var simulator = createSimulator();
    var empty = simulator.getBestNewBodyPosition([]);
    t.ok(typeof empty.x === 'number', 'Has X');
    t.ok(typeof empty.y === 'number', 'Has Y');

    t.end();
  });

  t.end();
});

test('it can change settings', function(t) {
  var simulator = createSimulator();

  var currentTheta = simulator.theta();
  t.ok(typeof currentTheta === 'number', 'theta is here');
  simulator.theta(1.2);
  t.equal(simulator.theta(), 1.2, 'theta is changed');

  var currentSpringCoefficient = simulator.springCoefficient();
  t.ok(typeof currentSpringCoefficient === 'number', 'springCoefficient is here');
  simulator.springCoefficient(0.8);
  t.equal(simulator.springCoefficient(), 0.8, 'springCoefficient is changed');

  var gravity = simulator.gravity();
  t.ok(typeof gravity === 'number', 'gravity is here');
  simulator.gravity(-0.8);
  t.equal(simulator.gravity(), -0.8, 'gravity is changed');

  var springLength = simulator.springLength();
  t.ok(typeof springLength === 'number', 'springLength is here');
  simulator.springLength(80);
  t.equal(simulator.springLength(), 80, 'springLength is changed');

  var dragCoefficient = simulator.dragCoefficient();
  t.ok(typeof dragCoefficient === 'number', 'dragCoefficient is here');
  simulator.dragCoefficient(0.8);
  t.equal(simulator.dragCoefficient(), 0.8, 'dragCoefficient is changed');

  var timeStep = simulator.timeStep();
  t.ok(typeof timeStep === 'number', 'timeStep is here');
  simulator.timeStep(8);
  t.equal(simulator.timeStep(), 8, 'timeStep is changed');

  t.end();
});

test('it can augment string setter values', function (t) {
  var simulator = createSimulator({
    name: 'John'
  });

  simulator.name('Alisa');
  t.equal(simulator.name(), 'Alisa', 'name is Alisa');
  t.end();
});

test('it ignores body that does not exist', function(t) {
  var simulator = createSimulator();
  var body = new Body(0, 0);
  simulator.addBody(body);
  simulator.removeBody({});
  t.equal(simulator.bodies.length, 1, 'Should ignore body that does not exist');
  t.end();
});

test('it throws on springCoeff', function (t) {
  t.throws(function () {
    createSimulator({springCoeff: 1});
  }, 'springCoeff was renamed to springCoefficient');
  t.end();
});

test('it throws on dragCoeff', function (t) {
  t.throws(function () {
    createSimulator({dragCoeff: 1});
  }, 'dragCoeff was renamed to dragCoefficient');
  t.end();
});