/**
 * Manages a simulation of physical forces acting on bodies and springs.
 */
module.exports = createPhysicsSimulator;

var generateCreateBodyFunction = require('./codeGenerators/generateCreateBody');
var generateQuadTreeFunction = require('./codeGenerators/generateQuadTree');
var generateBoundsFunction = require('./codeGenerators/generateBounds');
var generateCreateDragForceFunction = require('./codeGenerators/generateCreateDragForce');
var generateCreateSpringForceFunction = require('./codeGenerators/generateCreateSpringForce');
var generateIntegratorFunction = require('./codeGenerators/generateIntegrator');

var dimensionalCache = {};

function createPhysicsSimulator(settings) {
  var Spring = require('./spring');
  var merge = require('ngraph.merge');
  var eventify = require('ngraph.events');
  if (settings) {
    // Check for names from older versions of the layout
    if (settings.springCoeff !== undefined) throw new Error('springCoeff was renamed to springCoefficient');
    if (settings.dragCoeff !== undefined) throw new Error('dragCoeff was renamed to dragCoefficient');
  }

  settings = merge(settings, {
      /**
       * Ideal length for links (springs in physical model).
       */
      springLength: 10,

      /**
       * Hook's law coefficient. 1 - solid spring.
       */
      springCoefficient: 0.8, 

      /**
       * Coulomb's law coefficient. It's used to repel nodes thus should be negative
       * if you make it positive nodes start attract each other :).
       */
      gravity: -12,

      /**
       * Theta coefficient from Barnes Hut simulation. Ranged between (0, 1).
       * The closer it's to 1 the more nodes algorithm will have to go through.
       * Setting it to one makes Barnes Hut simulation no different from
       * brute-force forces calculation (each node is considered).
       */
      theta: 0.8,

      /**
       * Drag force coefficient. Used to slow down system, thus should be less than 1.
       * The closer it is to 0 the less tight system will be.
       */
      dragCoefficient: 0.9, // TODO: Need to rename this to something better. E.g. `dragCoefficient`

      /**
       * Default time step (dt) for forces integration
       */
      timeStep : 0.5,

      /**
       * Adaptive time step uses average spring length to compute actual time step:
       * See: https://twitter.com/anvaka/status/1293067160755957760
       */
      adaptiveTimeStepWeight: 0,

      /**
       * This parameter defines number of dimensions of the space where simulation
       * is performed. 
       */
      dimensions: 2,

      /**
       * In debug mode more checks are performed, this will help you catch errors
       * quickly, however for production build it is recommended to turn off this flag
       * to speed up computation.
       */
      debug: false
  });

  var factory = dimensionalCache[settings.dimensions];
  if (!factory) {
    var dimensions = settings.dimensions;
    factory = {
      Body: generateCreateBodyFunction(dimensions, settings.debug),
      createQuadTree: generateQuadTreeFunction(dimensions),
      createBounds: generateBoundsFunction(dimensions),
      createDragForce: generateCreateDragForceFunction(dimensions),
      createSpringForce: generateCreateSpringForceFunction(dimensions),
      integrate: generateIntegratorFunction(dimensions),
    };
    dimensionalCache[dimensions] = factory;
  }

  var Body = factory.Body;
  var createQuadTree = factory.createQuadTree;
  var createBounds = factory.createBounds;
  var createDragForce = factory.createDragForce;
  var createSpringForce = factory.createSpringForce;
  var integrate = factory.integrate;
  var createBody = pos => new Body(pos);

  var random = require('ngraph.random').random(42);
  var bodies = []; // Bodies in this simulation.
  var springs = []; // Springs in this simulation.

  var quadTree = createQuadTree(settings, random);
  var bounds = createBounds(bodies, settings, random);
  var springForce = createSpringForce(settings, random);
  var dragForce = createDragForce(settings);

  var totalMovement = 0; // how much movement we made on last step
  var forces = [];
  var forceMap = new Map();
  var iterationNumber = 0;
 
  addForce('nbody', nbodyForce);
  addForce('spring', updateSpringForce);

  var publicApi = {
    /**
     * Array of bodies, registered with current simulator
     *
     * Note: To add new body, use addBody() method. This property is only
     * exposed for testing/performance purposes.
     */
    bodies: bodies,
  
    quadTree: quadTree,

    /**
     * Array of springs, registered with current simulator
     *
     * Note: To add new spring, use addSpring() method. This property is only
     * exposed for testing/performance purposes.
     */
    springs: springs,

    /**
     * Returns settings with which current simulator was initialized
     */
    settings: settings,

    /**
     * Adds a new force to simulation
     */
    addForce: addForce,
    
    /**
     * Removes a force from the simulation.
     */
    removeForce: removeForce,

    /**
     * Returns a map of all registered forces.
     */
    getForces: getForces,

    /**
     * Performs one step of force simulation.
     *
     * @returns {boolean} true if system is considered stable; False otherwise.
     */
    step: function () {
      for (var i = 0; i < forces.length; ++i) {
        forces[i](iterationNumber);
      }
      var movement = integrate(bodies, settings.timeStep, settings.adaptiveTimeStepWeight);
      iterationNumber += 1;
      return movement;
    },

    /**
     * Adds body to the system
     *
     * @param {ngraph.physics.primitives.Body} body physical body
     *
     * @returns {ngraph.physics.primitives.Body} added body
     */
    addBody: function (body) {
      if (!body) {
        throw new Error('Body is required');
      }
      bodies.push(body);

      return body;
    },

    /**
     * Adds body to the system at given position
     *
     * @param {Object} pos position of a body
     *
     * @returns {ngraph.physics.primitives.Body} added body
     */
    addBodyAt: function (pos) {
      if (!pos) {
        throw new Error('Body position is required');
      }
      var body = createBody(pos);
      bodies.push(body);

      return body;
    },

    /**
     * Removes body from the system
     *
     * @param {ngraph.physics.primitives.Body} body to remove
     *
     * @returns {Boolean} true if body found and removed. falsy otherwise;
     */
    removeBody: function (body) {
      if (!body) { return; }

      var idx = bodies.indexOf(body);
      if (idx < 0) { return; }

      bodies.splice(idx, 1);
      if (bodies.length === 0) {
        bounds.reset();
      }
      return true;
    },

    /**
     * Adds a spring to this simulation.
     *
     * @returns {Object} - a handle for a spring. If you want to later remove
     * spring pass it to removeSpring() method.
     */
    addSpring: function (body1, body2, springLength, springCoefficient) {
      if (!body1 || !body2) {
        throw new Error('Cannot add null spring to force simulator');
      }

      if (typeof springLength !== 'number') {
        springLength = -1; // assume global configuration
      }

      var spring = new Spring(body1, body2, springLength, springCoefficient >= 0 ? springCoefficient : -1);
      springs.push(spring);

      // TODO: could mark simulator as dirty.
      return spring;
    },

    /**
     * Returns amount of movement performed on last step() call
     */
    getTotalMovement: function () {
      return totalMovement;
    },

    /**
     * Removes spring from the system
     *
     * @param {Object} spring to remove. Spring is an object returned by addSpring
     *
     * @returns {Boolean} true if spring found and removed. falsy otherwise;
     */
    removeSpring: function (spring) {
      if (!spring) { return; }
      var idx = springs.indexOf(spring);
      if (idx > -1) {
        springs.splice(idx, 1);
        return true;
      }
    },

    getBestNewBodyPosition: function (neighbors) {
      return bounds.getBestNewPosition(neighbors);
    },

    /**
     * Returns bounding box which covers all bodies
     */
    getBBox: getBoundingBox, 
    getBoundingBox: getBoundingBox, 

    invalidateBBox: function () {
      console.warn('invalidateBBox() is deprecated, bounds always recomputed on `getBBox()` call');
    },

    // TODO: Move the force specific stuff to force
    gravity: function (value) {
      if (value !== undefined) {
        settings.gravity = value;
        quadTree.options({gravity: value});
        return this;
      } else {
        return settings.gravity;
      }
    },

    theta: function (value) {
      if (value !== undefined) {
        settings.theta = value;
        quadTree.options({theta: value});
        return this;
      } else {
        return settings.theta;
      }
    },

    /**
     * Returns pseudo-random number generator instance.
     */
    random: random
  };

  // allow settings modification via public API:
  expose(settings, publicApi);

  eventify(publicApi);

  return publicApi;

  function getBoundingBox() {
    bounds.update();
    return bounds.box;
  }

  function addForce(forceName, forceFunction) {
    if (forceMap.has(forceName)) throw new Error('Force ' + forceName + ' is already added');

    forceMap.set(forceName, forceFunction);
    forces.push(forceFunction);
  }

  function removeForce(forceName) {
    var forceIndex = forces.indexOf(forceMap.get(forceName));
    if (forceIndex < 0) return;
    forces.splice(forceIndex, 1);
    forceMap.delete(forceName);
  }

  function getForces() {
    // TODO: Should I trust them or clone the forces?
    return forceMap;
  }

  function nbodyForce(/* iterationUmber */) {
    if (bodies.length === 0) return;

    quadTree.insertBodies(bodies);
    var i = bodies.length;
    while (i--) {
      var body = bodies[i];
      if (!body.isPinned) {
        body.reset();
        quadTree.updateBodyForce(body);
        dragForce.update(body);
      }
    }
  }

  function updateSpringForce() {
    var i = springs.length;
    while (i--) {
      springForce.update(springs[i]);
    }
  }

}

function expose(settings, target) {
  for (var key in settings) {
    augment(settings, target, key);
  }
}

function augment(source, target, key) {
  if (!source.hasOwnProperty(key)) return;
  if (typeof target[key] === 'function') {
    // this accessor is already defined. Ignore it
    return;
  }
  var sourceIsNumber = Number.isFinite(source[key]);

  if (sourceIsNumber) {
    target[key] = function (value) {
      if (value !== undefined) {
        if (!Number.isFinite(value)) throw new Error('Value of ' + key + ' should be a valid number.');
        source[key] = value;
        return target;
      }
      return source[key];
    };
  } else {
    target[key] = function (value) {
      if (value !== undefined) {
        source[key] = value;
        return target;
      }
      return source[key];
    };
  }
}
