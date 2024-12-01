var test = require('tap').test;
var {generateCreateBodyFunctionBody} = require('../lib/codeGenerators/generateCreateBody');

function primitive(dimension) {
  let res = (new Function(generateCreateBodyFunctionBody(dimension)))();
  return res;
}

test('Body has properties force, pos and mass', function(t) {
  debugger;
  var body = new (primitive(2).Body)();
  t.ok(body.force, 'Force attribute is missing on body');
  t.ok(body.pos, 'Pos attribute is missing on body');
  t.ok(body.velocity, 'Velocity attribute is missing on body');
  t.ok(typeof body.mass === 'number' && body.mass !== 0, 'Body should have a mass');
  t.end();
});

test('Vector has x and y', function(t) {
  var vector = new (primitive(2).Vector)();
  t.ok(typeof vector.x === 'number', 'Vector has x coordinates');
  t.ok(typeof vector.y === 'number', 'Vector has y coordinates');

  var initialized = new (primitive(2).Vector)(1, 2);
  t.equal(initialized.x, 1, 'Vector initialized properly');
  t.equal(initialized.y, 2, 'Vector initialized properly');

  var badInput = new (primitive(2).Vector)('hello world');
  t.equal(badInput.x, 0, 'Vector should be resilient to bed input');
  t.equal(badInput.y, 0, 'Vector should be resilient to bed input');
  t.end();
});

test('Body3d has properties force, pos and mass', function(t) {
  var body = new (primitive(3).Body)();
  t.ok(body.force, 'Force attribute is missing on body');
  t.ok(body.pos, 'Pos attribute is missing on body');
  t.ok(body.velocity, 'Velocity attribute is missing on body');
  t.ok(typeof body.mass === 'number' && body.mass !== 0, 'Body should have a mass');
  t.end();
});

test('Vector3d has x and y and z', function(t) {
  var vector = new (primitive(3).Vector)();
  t.ok(typeof vector.x === 'number', 'Vector has x coordinates');
  t.ok(typeof vector.y === 'number', 'Vector has y coordinates');
  t.ok(typeof vector.z === 'number', 'Vector has z coordinates');

  var initialized = new (primitive(3).Vector)(1, 2, 3);
  t.equal(initialized.x, 1, 'Vector initialized properly');
  t.equal(initialized.y, 2, 'Vector initialized properly');
  t.equal(initialized.z, 3, 'Vector initialized properly');

  var badInput = new (primitive(3).Vector)('hello world');
  t.equal(badInput.x, 0, 'Vector should be resilient to bed input');
  t.equal(badInput.y, 0, 'Vector should be resilient to bed input');
  t.equal(badInput.z, 0, 'Vector should be resilient to bed input');
  t.end();
});

test('reset vector', function(t) {
  var v3 = new (primitive(3).Vector)(1, 2, 3);
  v3.reset();
  t.equal(v3.x, 0, 'Reset to 0');
  t.equal(v3.y, 0, 'Reset to 0');
  t.equal(v3.z, 0, 'Reset to 0');
  var v2 = new (primitive(2).Vector)(1, 2);
  v2.reset();
  t.equal(v2.x, 0, 'Reset to 0');
  t.equal(v2.y, 0, 'Reset to 0');
  t.end();
});

test('vector can use copy constructor', function(t) {
  var a = new (primitive(3).Vector)(1, 2, 3);
  var b = new (primitive(3).Vector)(a);
  t.equal(b.x, a.x, 'Value copied');
  t.equal(b.y, a.y, 'Value copied');
  t.equal(b.z, a.z, 'Value copied');
  t.end();
});

test('Body3d can set position', function(t) {
  var body = new (primitive(3).Body)();
  body.setPosition(10, 11, 12);
  t.equal(body.pos.x, 10, 'x is correct');
  t.equal(body.pos.y, 11, 'y is correct');
  t.equal(body.pos.z, 12, 'z is correct');

  t.end();
});

test('Body can set position', function(t) {
  var body = new (primitive(2).Body)();
  body.setPosition(10, 11);
  t.equal(body.pos.x, 10, 'x is correct');
  t.equal(body.pos.y, 11, 'y is correct');

  t.end();
});
