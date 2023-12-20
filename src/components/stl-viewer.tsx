import { useMemo, useRef, useState } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { PCFSoftShadowMap } from "three";
import { Canvas, ThreeElements, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

// http://cdn.thingiverse.com/assets/3c/fe/bc/3b/9e/3dae334c-589e-4d59-97e6-3578426751d1.stl

// let camera, cameraTarget, scene, renderer, controls;
// function Stl(width, height, url, objectColor, gridLineColor, skyboxColor, groundColor, lightColor, volume) {
//   // scene setup

//   scene = new THREE.Scene();
//   scene.background = new THREE.Color(skyboxColor);
//   scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

//   // camera setup
//   camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
//   camera.position.set(200, 100, 200);

//   cameraTarget = new THREE.Vector3(0, 0, 0);
//   camera.position.z = 5 * 2;
//   // renderer setup
//   renderer = new THREE.WebGLRenderer({
//     antialias: true,
//     alpha: true,
//     preserveDrawingBuffer: true,
//   });
//   renderer.setSize(width, height);

//   // where to render your scene
//   document.getElementById("stlviewer").innerHTML = "";
//   document.getElementById("stlviewer").appendChild(renderer.domElement);

//   // controls
//   controls = new OrbitControls(camera, renderer.domElement);
//   controls.target.set(0, 0, 0);
//   controls.update();

//   // ground

//   const ground = new THREE.Mesh(
//     new THREE.PlaneGeometry(2000, 2000),
//     new THREE.MeshPhongMaterial({ color: groundColor, depthWrite: false }),
//   );
//   ground.rotation.x = -Math.PI / 2;
//   ground.receiveShadow = true;
//   scene.add(ground);

//   // const grid = new THREE.GridHelper(2000, 20, gridLineColor, gridLineColor)
//   // grid.material.opacity = 0.2
//   // grid.material.transparent = true
//   // scene.add(grid)

//   // lights
//   const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
//   hemiLight.position.set(0, 200, 0);
//   scene.add(hemiLight);

//   const directionalLight = new THREE.DirectionalLight(lightColor);
//   directionalLight.position.set(0, 200, 100);
//   directionalLight.castShadow = true;
//   directionalLight.shadow.camera.top = 180;
//   directionalLight.shadow.camera.bottom = -100;
//   directionalLight.shadow.camera.left = -120;
//   directionalLight.shadow.camera.right = 120;
//   scene.add(directionalLight);

//   // adding stl to scene
//   const loader = new STLLoader();
//   loader.load(url, (geometry) => {
//     const material = new THREE.MeshPhongMaterial({
//       color: objectColor,
//       specular: 0x111111,
//       shininess: 200,
//     });
//     const mesh = new THREE.Mesh(geometry, material);

//     mesh.position.set(0, 0, 0);
//     mesh.rotation.set(-Math.PI / 2, 0, 0);
//     mesh.scale.set(1.5, 1.5, 1.5);

//     mesh.castShadow = true;
//     mesh.receiveShadow = true;

//     const signedVolumeOfTriangle = (p1, p2, p3) => {
//       return p1.dot(p2.cross(p3)) / 6.0;
//     };
//     let position = geometry.attributes.position;
//     let faces = position.count / 3;
//     let sum = 0;
//     let p1 = new THREE.Vector3(),
//       p2 = new THREE.Vector3(),
//       p3 = new THREE.Vector3();
//     for (let i = 0; i < faces; i++) {
//       p1.fromBufferAttribute(position, i * 3 + 0);
//       p2.fromBufferAttribute(position, i * 3 + 1);
//       p3.fromBufferAttribute(position, i * 3 + 2);
//       sum += signedVolumeOfTriangle(p1, p2, p3);
//     }
//     volume(sum);

//     scene.add(mesh);
//   });

//   // renderer

//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.outputEncoding = THREE.sRGBEncoding;

//   renderer.shadowMap.enabled = true;

//   function onWindowResize() {
//     camera.aspect = window.innerWidth / height;
//     camera.updateProjectionMatrix();

//     renderer.setSize(window.innerWidth, height);
//   }

//   const animate = () => {
//     requestAnimationFrame(animate);
//     render();
//   };

//   const render = () => {
//     camera.lookAt(cameraTarget);
//     renderer.render(scene, camera);
//   };
//   animate();
//   // window.addEventListener('resize', onWindowResize)
// }

function Cube(props: ThreeElements["mesh"]) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  useFrame((state, delta) => (ref.current.rotation.x += delta));

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

export default function STLViewer({ url, ...props }: Omit<BoxProps, "children"> & { url: string }) {
  const geometry = useLoader(STLLoader, url);

  const radius = useMemo(() => {
    geometry.computeBoundingSphere();
    return geometry.boundingSphere?.radius ?? 10;
  }, [geometry]);

  return (
    <Box {...props} position="relative">
      <Canvas
        shadows
        gl={{
          preserveDrawingBuffer: true,
          shadowMapType: PCFSoftShadowMap,
          antialias: true,
          useLegacyLights: true,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <hemisphereLight color={0xffffff} groundColor={0x080820} intensity={1} position={[0, 50, 0]} />
        <OrbitControls enableDamping enablePan enableRotate enableZoom />
        <mesh geometry={geometry} scale={3 / radius} rotation={[Math.PI * 1.5, 0, 0]}>
          <meshStandardMaterial color="teal" />
        </mesh>
      </Canvas>
    </Box>
  );
}
