const createPatternBuilder = require('./createPatternBuilder');

module.exports = generateIntegratorFunction;
module.exports.generateIntegratorFunctionBody = generateIntegratorFunctionBody;

function generateIntegratorFunction(dimension) {
  let code = generateIntegratorFunctionBody(dimension);
  return new Function('bodies', 'timeStep', 'adaptiveTimeStepWeight', code);
}

function generateIntegratorFunctionBody(dimension) {
  let pattern = createPatternBuilder(dimension);
  let code = `
  var length = bodies.length;
  if (length === 0) return 0;

  ${pattern('var d{var} = 0, t{var} = 0;', {indent: 2})}

  for (var i = 0; i < length; ++i) {
    var body = bodies[i];
    if (body.isPinned) continue;

    if (adaptiveTimeStepWeight && body.springCount) {
      timeStep = (adaptiveTimeStepWeight * body.springLength/body.springCount);
    }

    var coeff = timeStep / body.mass;

    ${pattern('body.velocity.{var} += coeff * body.force.{var};', {indent: 4})}
    ${pattern('var v{var} = body.velocity.{var};', {indent: 4})}
    var v = Math.sqrt(${pattern('v{var} * v{var}', {join: ' + '})});

    if (v > 1) {
      // We normalize it so that we move within timeStep range. 
      // for the case when v <= 1 - we let velocity to fade out.
      ${pattern('body.velocity.{var} = v{var} / v;', {indent: 6})}
    }

    ${pattern('d{var} = timeStep * body.velocity.{var};', {indent: 4})}

    ${pattern('body.pos.{var} += d{var};', {indent: 4})}

    ${pattern('t{var} += Math.abs(d{var});', {indent: 4})}
  }

  return (${pattern('t{var} * t{var}', {join: ' + '})})/length;
`;
  return code;
}
