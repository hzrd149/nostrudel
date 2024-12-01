/**
 * This is not used anywhere, but it is a good exploration into kd-tree based
 * simulation.
 */
module.exports = createKDForce;

function createKDForce(bodies, settings) {
  var KDBush = require('kdbush').default;
  var random = require('ngraph.random').random(1984);

  return kdForce;

  function kdForce(iterationNumber) {
    if (iterationNumber < 500) return;
    var gravity = settings.gravity;
    var points = new KDBush(bodies, p => p.pos.x0, p => p.pos.x1);
    var i = bodies.length;
    while (i--) {
      var body = bodies[i];
      body.reset();
      var neighbors = points.within(body.pos.x0, body.pos.x1, settings.springLength);
      var fx = 0, fy = 0;
      for (var j = 0; j < neighbors.length; ++j) {
        var other = bodies[neighbors[j]];
        if (other === body) continue;

        var dx = other.pos.x0 - body.pos.x0;
        var dy = other.pos.x1 - body.pos.x1;
        var r = Math.sqrt(dx * dx + dy * dy);
        if (r === 0) {
          // Poor man's protection against zero distance.
          dx = (random.nextDouble() - 0.5) / 50;
          dy = (random.nextDouble() - 0.5) / 50;
          r = Math.sqrt(dx * dx + dy * dy);
        }
        var v = gravity * other.mass * body.mass / (r * r * r);
        fx += v * dx;
        fy += v * dy;
      }
      body.force.x0 = fx;
      body.force.x1 = fy;
      //dragForce.update(body);
    }
  }
}