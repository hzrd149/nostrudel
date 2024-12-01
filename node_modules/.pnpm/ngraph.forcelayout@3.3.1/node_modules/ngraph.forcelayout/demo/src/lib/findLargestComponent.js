import createGraph from 'ngraph.graph';

/**
 * Returns array of first `count` largest connected components 
 * of the `graph`
 */
export default function findLargestComponent(graph, count) {
  var nodeIdToComponentId = new Map();

  var connectedComponents = [];
  var lastComponentId = 0;

  graph.forEachNode(function(node) {
    if (nodeIdToComponentId.has(node.id)) {
      // we already seen this cluster. Ignore it.
      return;
    }

    // We found a new connected component:
    nodeIdToComponentId.set(node.id, lastComponentId);
    var currentComponent = new Set();
    connectedComponents.push(currentComponent);

    // Let's find what other nodes belong to this component
    bfs(graph, node.id, otherNode => {
      currentComponent.add(otherNode);
      nodeIdToComponentId.set(otherNode, lastComponentId);
    });

    lastComponentId += 1;
  });

  return connectedComponents.sort((a, b) => b.size - a.size)
    .slice(0, count)
    .map(largestComponent => {
      let subGraph = createGraph();
      // not the most efficient way, as we iterate over every single link.
      // This could be improved, for example by performing bfs from the component
      graph.forEachLink(link => {
        if (largestComponent.has(link.fromId)) {
          subGraph.addLink(link.fromId, link.toId);
        }
      })

      return subGraph;
    });
}

function bfs(graph, startFromNodeId, visitor) {
  let queue = [startFromNodeId];
  let visited = new Set(queue);

  while (queue.length) {
    let nodeId = queue.shift();
    visitor(nodeId);

    graph.forEachLinkedNode(nodeId, function(otherNode) {
      if (visited.has(otherNode.id)) return;

      queue.push(otherNode.id);
      visited.add(otherNode.id);
    });
  }
}