import { WebGLRendererParameters, Renderer, Object3D, Light, WebGLRenderer, Scene, Camera, Intersection } from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

interface ConfigOptions {
  controlType?: 'trackball' | 'orbit' | 'fly';
  rendererConfig?: WebGLRendererParameters;
  extraRenderers?: Renderer[];
  waitForLoadComplete?: boolean;
}

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type Obj3DAccessor<T> = Accessor<Object3D, T>;

type Coords = { x: number; y: number; z: number; };

type Obj3DCompFn = (a: Object3D, b: Object3D) => number;

interface ThreeRenderObjectsGenericInstance<ChainableInstance> {
  (element: HTMLElement): ChainableInstance;
  resetProps(): ChainableInstance;

  // Data input
  objects(): Object3D[];
  objects(objs: Object3D[]): ChainableInstance;
  lights(): Light[];
  lights(lights: Light[]): ChainableInstance;

  // Container layout
  width(): number;
  width(width: number): ChainableInstance;
  height(): number;
  height(height: number): ChainableInstance;
  skyRadius(): number;
  skyRadius(glUnits: number): ChainableInstance;
  backgroundColor(): string;
  backgroundColor(color: string): ChainableInstance;
  backgroundImageUrl(): string | null;
  backgroundImageUrl(url: string | null): ChainableInstance;
  onBackgroundImageLoaded(callback: () => void): ChainableInstance;
  showNavInfo(): boolean;
  showNavInfo(enabled: boolean): ChainableInstance;

  // Render control
  tick(): ChainableInstance;
  cameraPosition(): Coords;
  cameraPosition(position: Partial<Coords>, lookAt?: Coords, transitionMs?: number): ChainableInstance;
  zoomToFit(durationMs?: number, padding?: number, objFilter?: (obj: Object3D) => boolean): ChainableInstance;
  fitToBbox(bbox: { x: [number, number], y: [number, number], z: [number, number] }, durationMs?: number, padding?: number): ChainableInstance;
  postProcessingComposer(): EffectComposer;
  renderer(): WebGLRenderer;
  scene(): Scene;
  camera(): Camera;
  controls(): TrackballControls | OrbitControls | FlyControls;

  // Interaction
  onClick(callback: (obj: object | null, event: MouseEvent, intersectionPoint: { x: number, y: number, z: number }) => void): ChainableInstance;
  onRightClick(callback: (obj: object | null, event: MouseEvent, intersectionPoint: { x: number, y: number, z: number }) => void): ChainableInstance;
  onHover(callback: (obj: object | null, previousObj: object | null) => void): ChainableInstance;
  hoverOrderComparator(): Obj3DCompFn;
  hoverOrderComparator(compFn: Obj3DCompFn): ChainableInstance;
  hoverFilter(): (obj: Object3D) => boolean;
  hoverFilter(filterFn: (obj: Object3D) => boolean): ChainableInstance;
  lineHoverPrecision(): number;
  lineHoverPrecision(precision: number): ChainableInstance;
  tooltipContent(): Obj3DAccessor<string>;
  tooltipContent(contentAccessor: Obj3DAccessor<string>): ChainableInstance;
  enablePointerInteraction(): boolean;
  enablePointerInteraction(enable: boolean): ChainableInstance;
  hoverDuringDrag(): boolean;
  hoverDuringDrag(enabled: boolean): ChainableInstance;
  clickAfterDrag(): boolean;
  clickAfterDrag(enabled: boolean): ChainableInstance;
  getPointerPos(): { x: number, y: number };

  // Utility
  getBbox(objFilter?: (obj: Object3D) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
  getScreenCoords(x: number, y: number, z: number): { x: number, y: number; };
  getSceneCoords(x: number, y: number, distance: number): { x: number, y: number, z: number };
  intersectingObjects(x: number, y: number): Intersection[];
}

type ThreeRenderObjectsInstance = ThreeRenderObjectsGenericInstance<ThreeRenderObjectsInstance>;

declare function ThreeRenderObjects(configOptions?: ConfigOptions): ThreeRenderObjectsInstance;

export { type ConfigOptions, type ThreeRenderObjectsGenericInstance, type ThreeRenderObjectsInstance, ThreeRenderObjects as default };
