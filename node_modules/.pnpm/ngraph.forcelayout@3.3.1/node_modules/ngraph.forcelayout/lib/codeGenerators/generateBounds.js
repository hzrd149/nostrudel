
module.exports = generateBoundsFunction;
module.exports.generateFunctionBody = generateBoundsFunctionBody;

const createPatternBuilder = require('./createPatternBuilder');

function generateBoundsFunction(dimension) {
  let code = generateBoundsFunctionBody(dimension);
  return new Function('bodies', 'settings', 'random', code);
}

function generateBoundsFunctionBody(dimension) {
  let pattern = createPatternBuilder(dimension);

  let code = `
  var boundingBox = {
    ${pattern('min_{var}: 0, max_{var}: 0,', {indent: 4})}
  };

  return {
    box: boundingBox,

    update: updateBoundingBox,

    reset: resetBoundingBox,

    getBestNewPosition: function (neighbors) {
      var ${pattern('base_{var} = 0', {join: ', '})};

      if (neighbors.length) {
        for (var i = 0; i < neighbors.length; ++i) {
          let neighborPos = neighbors[i].pos;
          ${pattern('base_{var} += neighborPos.{var};', {indent: 10})}
        }

        ${pattern('base_{var} /= neighbors.length;', {indent: 8})}
      } else {
        ${pattern('base_{var} = (boundingBox.min_{var} + boundingBox.max_{var}) / 2;', {indent: 8})}
      }

      var springLength = settings.springLength;
      return {
        ${pattern('{var}: base_{var} + (random.nextDouble() - 0.5) * springLength,', {indent: 8})}
      };
    }
  };

  function updateBoundingBox() {
    var i = bodies.length;
    if (i === 0) return; // No bodies - no borders.

    ${pattern('var max_{var} = -Infinity;', {indent: 4})}
    ${pattern('var min_{var} = Infinity;', {indent: 4})}

    while(i--) {
      // this is O(n), it could be done faster with quadtree, if we check the root node bounds
      var bodyPos = bodies[i].pos;
      ${pattern('if (bodyPos.{var} < min_{var}) min_{var} = bodyPos.{var};', {indent: 6})}
      ${pattern('if (bodyPos.{var} > max_{var}) max_{var} = bodyPos.{var};', {indent: 6})}
    }

    ${pattern('boundingBox.min_{var} = min_{var};', {indent: 4})}
    ${pattern('boundingBox.max_{var} = max_{var};', {indent: 4})}
  }

  function resetBoundingBox() {
    ${pattern('boundingBox.min_{var} = boundingBox.max_{var} = 0;', {indent: 4})}
  }
`;
  return code;
}
