import createLayout from '../../../';

export default function createForceLayout(graph, layoutSettings) {
  // return window.ngraphCreate2dLayout(graph, Object.assign({
  return createLayout(graph, Object.assign({
    dimensions: 2,
    timeStep: 0.5,
    springLength: 10,
    gravity: -12,
    springCoefficient: 0.8,
    dragCoefficient: 0.9,
    // adaptiveTimeStepWeight: 0.1,
    debug: false,
  }, layoutSettings));
}
