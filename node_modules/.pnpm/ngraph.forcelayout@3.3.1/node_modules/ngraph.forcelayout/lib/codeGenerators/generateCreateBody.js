
const createPatternBuilder = require('./createPatternBuilder');

module.exports = generateCreateBodyFunction;
module.exports.generateCreateBodyFunctionBody = generateCreateBodyFunctionBody;

// InlineTransform: getVectorCode
module.exports.getVectorCode = getVectorCode;
// InlineTransform: getBodyCode
module.exports.getBodyCode = getBodyCode;
// InlineTransformExport: module.exports = function() { return Body; }

function generateCreateBodyFunction(dimension, debugSetters) {
  let code = generateCreateBodyFunctionBody(dimension, debugSetters);
  let {Body} = (new Function(code))();
  return Body;
}

function generateCreateBodyFunctionBody(dimension, debugSetters) {
  let code = `
${getVectorCode(dimension, debugSetters)}
${getBodyCode(dimension, debugSetters)}
return {Body: Body, Vector: Vector};
`;
  return code;
}

function getBodyCode(dimension) {
  let pattern = createPatternBuilder(dimension);
  let variableList = pattern('{var}', {join: ', '});
  return `
function Body(${variableList}) {
  this.isPinned = false;
  this.pos = new Vector(${variableList});
  this.force = new Vector();
  this.velocity = new Vector();
  this.mass = 1;

  this.springCount = 0;
  this.springLength = 0;
}

Body.prototype.reset = function() {
  this.force.reset();
  this.springCount = 0;
  this.springLength = 0;
}

Body.prototype.setPosition = function (${variableList}) {
  ${pattern('this.pos.{var} = {var} || 0;', {indent: 2})}
};`;
}

function getVectorCode(dimension, debugSetters) {
  let pattern = createPatternBuilder(dimension);
  let setters = '';
  if (debugSetters) {
    setters = `${pattern("\n\
   var v{var};\n\
Object.defineProperty(this, '{var}', {\n\
  set: function(v) { \n\
    if (!Number.isFinite(v)) throw new Error('Cannot set non-numbers to {var}');\n\
    v{var} = v; \n\
  },\n\
  get: function() { return v{var}; }\n\
});")}`;
  }

  let variableList = pattern('{var}', {join: ', '});
  return `function Vector(${variableList}) {
  ${setters}
    if (typeof arguments[0] === 'object') {
      // could be another vector
      let v = arguments[0];
      ${pattern('if (!Number.isFinite(v.{var})) throw new Error("Expected value is not a finite number at Vector constructor ({var})");', {indent: 4})}
      ${pattern('this.{var} = v.{var};', {indent: 4})}
    } else {
      ${pattern('this.{var} = typeof {var} === "number" ? {var} : 0;', {indent: 4})}
    }
  }
  
  Vector.prototype.reset = function () {
    ${pattern('this.{var} = ', {join: ''})}0;
  };`;
}