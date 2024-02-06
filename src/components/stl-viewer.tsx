import { useEffect, useRef, useState } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  NormalBufferAttributes,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls, STLLoader } from "three-stdlib";
import { useAsync, useMount } from "react-use";

function createSTLWorld(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true,
  });
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  scene.background = new Color(0xa0a0a0);
  scene.fog = new Fog(0xa0a0a0, 4, 20);

  const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  camera.position.set(-2, 2, -2.5);
  scene.add(camera);

  const hemiLight = new HemisphereLight(0xffffff, 0x444444, 3);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const ambientLight = new AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xffffff);
  dirLight.position.set(-5, 15, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const floor = new Mesh(new PlaneGeometry(40, 40), new MeshPhongMaterial({ color: 0xbbbbbb, depthWrite: false }));
  floor.rotation.set(-Math.PI / 2, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new GridHelper(40, 40, 0x000000, 0x000000);
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  scene.add(grid);

  const object = new Mesh(
    new BufferGeometry(),
    new MeshPhongMaterial({ color: 0x1a5fb4, shininess: 60, flatShading: true }),
  );
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;

  function setSTLGeometry(geometry: BufferGeometry<NormalBufferAttributes>) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();

    const objectScale = 2 / geometry.boundingSphere!.radius;
    const bb = geometry.boundingBox!;
    const center = bb.getCenter(new Vector3()).multiplyScalar(objectScale);

    // update object
    object.geometry = geometry;
    object.scale.set(objectScale, objectScale, objectScale);
    object.rotation.set(Math.PI * -0.5, 0, 0);
    object.position.set(-center.x, -center.z, center.y);

    // update floor
    grid.position.set(0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0);
    floor.position.set(0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0);

    console.log(object);
  }

  function resize() {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
  }
  function animate() {
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    renderer,
    scene,
    camera,
    object,
    grid,
    floor,
    dirLight,
    ambientLight,
    hemiLight,
    controls,
    animate,
    resize,
    setSTLGeometry,
  };
}

export default function STLViewer({
  url,
  width,
  height,
  ...props
}: Omit<BoxProps, "children" | "width" | "height"> & { url: string; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  const [world, setWorld] = useState<ReturnType<typeof createSTLWorld>>();
  const { value: geometry } = useAsync(async () => {
    const loader = new STLLoader();
    return await loader.loadAsync(url);
  }, [url]);

  useMount(() => {
    if (!ref.current) return;
    ref.current.width = width;
    ref.current.height = height;
    setWorld(createSTLWorld(ref.current));
  });

  useEffect(() => {
    if (!world) return;
    let running = true;
    const animate = () => {
      if (running) {
        world.animate();
        requestAnimationFrame(animate);
      }
    };
    animate();
    return () => {
      running = false;
    };
  }, [world]);

  useEffect(() => {
    if (geometry && world) world.setSTLGeometry(geometry);
  }, [world, geometry]);

  return <Box as="canvas" ref={ref} {...props} />;
}
