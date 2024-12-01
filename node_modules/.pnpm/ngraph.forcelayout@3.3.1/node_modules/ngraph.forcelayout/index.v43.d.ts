declare module "ngraph.forcelayout" {
  import { Graph, NodeId, LinkId, Node, Link } from "ngraph.graph";
  import { EventedType } from "ngraph.events";

  export type ForceFunction = (iterationNumber: number) => void;

  export interface Vector {
    x: number;
    y: number;
    z?: number;
    [coord: string]: number | undefined;
  }

  export interface Body {
    isPinned: boolean;
    pos: Vector;
    force: Vector;
    velocity: Vector;
    mass: number;
    springCount: number;
    springLength: number;
    reset(): void;
    setPosition(x: number, y: number, z?: number, ...c: number[]): void;
  }

  export interface Spring {
    from: Body;
    to: Body;
    length: number;
    coefficient: number;
  }

  export interface QuadNode {
    body: Body | null;
    mass: number;
    mass_x: number;
    mass_y: number;
    mass_z?: number;
  }

  export interface QuadTree {
    insertBodies(bodies: Body[]): void;
    getRoot(): QuadNode & Record<string, number | null>;
    updateBodyForce(sourceBody: Body): void;
    options(newOptions: { gravity: number; theta: number }): { gravity: number; theta: number };
  }

  export interface BoundingBox {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
    min_z?: number;
    max_z?: number;
    [min_max: string]: number | undefined;
  }

  /**
   * Settings for a PhysicsSimulator
   */
  export interface PhysicsSettings {
    /**
     * Ideal length for links (springs in physical model).
     */
    springLength: number;

    /**
     * Hook's law coefficient. 1 - solid spring.
     */
    springCoefficient: number;

    /**
     * Coulomb's law coefficient. It's used to repel nodes thus should be negative
     * if you make it positive nodes start attract each other :).
     */
    gravity: number;

    /**
     * Theta coefficient from Barnes Hut simulation. Ranged between (0, 1).
     * The closer it's to 1 the more nodes algorithm will have to go through.
     * Setting it to one makes Barnes Hut simulation no different from
     * brute-force forces calculation (each node is considered).
     */
    theta: number;

    /**
     * Drag force coefficient. Used to slow down system, thus should be less than 1.
     * The closer it is to 0 the less tight system will be.
     */
    dragCoefficient: number;

    /**
     * Default time step (dt) for forces integration
     */
    timeStep: number;

    /**
     * Adaptive time step uses average spring length to compute actual time step:
     * See: https://twitter.com/anvaka/status/1293067160755957760
     */
    adaptiveTimeStepWeight: number;

    /**
     * This parameter defines number of dimensions of the space where simulation
     * is performed.
     */
    dimensions: number;

    /**
     * In debug mode more checks are performed, this will help you catch errors
     * quickly, however for production build it is recommended to turn off this flag
     * to speed up computation.
     */
    debug: boolean;
  }

  /**
   * Manages a simulation of physical forces acting on bodies and springs.
   */
  export interface PhysicsSimulator {
    /**
     * Array of bodies, registered with current simulator
     *
     * Note: To add new body, use addBody() method. This property is only
     * exposed for testing/performance purposes.
     */
    bodies: Body[];

    quadTree: QuadTree;

    /**
     * Array of springs, registered with current simulator
     *
     * Note: To add new spring, use addSpring() method. This property is only
     * exposed for testing/performance purposes.
     */
    springs: Spring[];

    /**
     * Returns settings with which current simulator was initialized
     */
    settings: PhysicsSettings;

    /**
     * Adds a new force to simulation
     * @param forceName force identifier
     * @param forceFunction the function to apply
     */
    addForce(forceName: string, forceFunction: ForceFunction): void;

    /**
     * Removes a force from the simulation
     * @param forceName force identifier
     */
    removeForce(forceName: string): void;

    /**
     * Returns a map of all registered forces
     */
    getForces(): Map<string, ForceFunction>;

    /**
     * Performs one step of force simulation.
     *
     * @returns true if system is considered stable; False otherwise.
     */
    step(): boolean;

    /**
     * Adds body to the system
     * @param body physical body
     * @returns added body
     */
    addBody(body: Body): Body;

    /**
     * Adds body to the system at given position
     * @param pos position of a body
     * @returns added body
     */
    addBodyAt(pos: Vector): Body;

    /**
     * Removes body from the system
     * @param body to remove
     * @returns true if body found and removed. falsy otherwise;
     */
    removeBody(body: Body): boolean;

    /**
     * Adds a spring to this simulation
     * @param body1 first body
     * @param body2 second body
     * @param springLength Ideal length for links
     * @param springCoefficient Hook's law coefficient. 1 - solid spring
     * @returns a handle for a spring. If you want to later remove
     * spring pass it to removeSpring() method.
     */
    addSpring(body1: Body, body2: Body, springLength: number, springCoefficient: number): Spring;

    /**
     * Returns amount of movement performed on last step() call
     */
    getTotalMovement(): number;

    /**
     * Removes spring from the system
     * @param spring to remove. Spring is an object returned by addSpring
     * @returns true if spring found and removed. falsy otherwise;
     */
    removeSpring(spring: Spring): boolean;

    getBestNewBodyPosition(neighbors: Body[]): Vector;

    /**
     * Returns bounding box which covers all bodies
     */
    getBBox(): BoundingBox;

    /**
     * Returns bounding box which covers all bodies
     */
    getBoundingBox(): BoundingBox;

    /** @deprecated invalidateBBox() is deprecated, bounds always recomputed on `getBBox()` call */
    invalidateBBox(): void;

    /**
     * Changes the gravity for the system
     * @param value Coulomb's law coefficient
     */
    gravity(value: number): number;

    /**
     * Changes the theta coeffitient for the system
     * @param value Theta coefficient from Barnes Hut simulation
     */
    theta(value: number): number;

    // TODO: create types declaration file for ngraph.random
    /**
     * Returns pseudo-random number generator instance
     */
    random: any;
  }

  /**
   * Force based layout for a given graph.
   */
  export interface Layout<T extends Graph> {
    /**
     * Performs one step of iterative layout algorithm
     * @returns true if the system should be considered stable; False otherwise.
     * The system is stable if no further call to `step()` can improve the layout.
     */
    step(): boolean;

    /**
     * For a given `nodeId` returns position
     * @param nodeId node identifier
     */
    getNodePosition(nodeId: NodeId): Vector;

    /**
     * Sets position of a node to a given coordinates
     * @param nodeId node identifier
     * @param x position of a node
     * @param y position of a node
     * @param z position of node (only if applicable to body)
     */
    setNodePosition(nodeId: NodeId, x: number, y: number, z?: number, ...c: number[]): void;

    /**
     * Gets Link position by link id
     * @param linkId link identifier
     * @returns from: {x, y} coordinates of link start
     * @returns to: {x, y} coordinates of link end
     */
    getLinkPosition(linkId: LinkId): { from: Vector; to: Vector };

    /**
     * @returns area required to fit in the graph. Object contains
     * `x1`, `y1` - top left coordinates
     * `x2`, `y2` - bottom right coordinates
     */
    getGraphRect(): { x1: number; y1: number; x2: number; y2: number };

    /**
     * Iterates over each body in the layout simulator and performs a callback(body, nodeId)
     * @param callbackfn the callback function
     */
    forEachBody(callbackfn: (value: Body, key: NodeId, map: Map<NodeId, Body>) => void): void;

    /**
     * Requests layout algorithm to pin/unpin node to its current position
     * Pinned nodes should not be affected by layout algorithm and always
     * remain at their position
     * @param node the node to pin/unpin
     * @param isPinned true to pin, false to unpin
     */
    pinNode(node: Node, isPinned: boolean): void;

    /**
     * Checks whether given graph's node is currently pinned
     * @param node the node to check
     */
    isNodePinned(node: Node): boolean;

    /**
     * Request to release all resources
     */
    dispose(): void;

    /**
     * Gets physical body for a given node id. If node is not found undefined
     * value is returned.
     * @param nodeId node identifier
     */
    getBody(nodeId: NodeId): Body | undefined;

    /**
     * Gets spring for a given edge.
     *
     * @param linkId link identifer.
     */
    getSpring(linkId: LinkId | Link): Spring;

    /**
     * Gets spring for a given edge.
     *
     * @param fromId node identifer - tail of the link
     * @param toId head of the link - head of the link
     */
    getSpring(fromId: NodeId, toId: NodeId): Spring | undefined;

    /**
     * Returns length of cumulative force vector. The closer this to zero - the more stable the system is
     */
    getForceVectorLength(): number;

    /**
     * @readonly Gets current physics simulator
     */
    readonly simulator: PhysicsSimulator;

    /**
     * Gets the graph that was used for layout
     */
    graph: T;

    /**
     * Gets amount of movement performed during last step operation
     */
    lastMove: number;
  }

  /**
   * Creates force based layout for a given graph.
   *
   * @param graph which needs to be laid out
   * @param physicsSettings if you need custom settings
   * for physics simulator you can pass your own settings here. If it's not passed
   * a default one will be created.
   */
  export default function createLayout<T extends Graph>(
    graph: T,
    physicsSettings?: Partial<PhysicsSettings>
  ): Layout<T> & EventedType;
}
