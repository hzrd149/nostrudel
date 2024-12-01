
var test = require('tap').test;
var dimensions = 2;

test('can debug setters', function (t) {
  var Body = require('../lib/codeGenerators/generateCreateBody')(dimensions, true);
  let b = new Body();
  t.throws(() => b.pos.x = 'foo', /Cannot set non-numbers to x/);
  t.end();
});