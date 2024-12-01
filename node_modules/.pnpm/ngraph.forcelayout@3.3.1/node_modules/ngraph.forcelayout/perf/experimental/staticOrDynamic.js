// Comparing the difference of compiled adhoc vs compiled in runtime function execution
// This should let build functions specific to dimension, without affecting performance.

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
let bodies;
let total = 0;

let srcCode = staticCompiled.toString().split('\n').slice(1, -1).join('\n');
let dynamicCompiled = compile(srcCode);
resetBodies();

suite.add('static compiled', function() {
  for (var i = 0; i < 2000; ++i) {
    if (staticCompiled(bodies, 0.5, 0) > 0) {
      total = 1;
    }
  }
})
.add('dynamic pre-compiled', function() {
  for (var i = 0; i < 2000; ++i) {
    if (dynamicCompiled(bodies, 0.5, 0) > 0) {
      total = 1;
    }
  }
})
.add('dynamic ad-hoc pre-compiled', function() {
  let fn = compile(srcCode);
  for (var i = 0; i < 2000; ++i) {
    if (fn(bodies, 0.5, 0) > 0) {
      total = 1;
    }
  }
})
.on('cycle', function(event) {
  console.log(String(event.target), total);
  total = 0;
  resetBodies();
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });

function resetBodies() {
  bodies = [];
  for (let i = 0; i < 100; ++i) {
    bodies.push(createBody(i));
  }
}

function createBody(i) {
  return {
    springCount: 0,
    springLength: 10,
    mass: 1,
    force: {x: i, y: i},
    velocity: {x: 0, y: 0},
    pos: {x: i, y: i}
  };
}

function staticCompiled(bodyCollection, timeStep, adaptiveTimeStepWeight) {
  var dx = 0, tx = 0,
      dy = 0, ty = 0,
      i,
      max = bodyCollection.length;

  if (max === 0) {
    return 0;
  }

  for (i = 0; i < max; ++i) {
    var body = bodyCollection[i];
    if (adaptiveTimeStepWeight && body.springCount) {
      timeStep = (adaptiveTimeStepWeight * body.springLength/body.springCount);
    }

    var coefficient = timeStep / body.mass;

    body.velocity.x += coefficient * body.force.x;
    body.velocity.y += coefficient * body.force.y;
    var vx = body.velocity.x,
        vy = body.velocity.y,
        v = Math.sqrt(vx * vx + vy * vy);

    if (v > 1) {
      // We normalize it so that we move within timeStep range. 
      // for the case when v <= 1 - we let velocity to fade out.
      body.velocity.x = vx / v;
      body.velocity.y = vy / v;
    }

    dx = timeStep * body.velocity.x;
    dy = timeStep * body.velocity.y;

    body.pos.x += dx;
    body.pos.y += dy;

    tx += Math.abs(dx); ty += Math.abs(dy);
  }

  return (tx * tx + ty * ty)/max;
}

function compile(body) {
  return new Function('bodies', 'timeStep', 'adaptiveTimeStepWeight', body);

}