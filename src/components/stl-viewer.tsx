import { useMemo, useRef, useState } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { Color, Fog, PCFSoftShadowMap } from "three";
import { Canvas, ThreeElements, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

// http://cdn.thingiverse.com/assets/3c/fe/bc/3b/9e/3dae334c-589e-4d59-97e6-3578426751d1.stl

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
          antialias: true,
          shadowMapEnabled: true,
        }}
        style={{ width: "100%", height: "100%" }}
        scene={{ background: new Color(0xa0a0a0), fog: new Fog(0xa0a0a0, 4, 20) }}
        camera={{ position: [-2, 2, -2.5] }}
      >
        <OrbitControls enableDamping enablePan enableRotate enableZoom />
        <hemisphereLight color={0xffffff} groundColor={0x444444} intensity={3} position={[0, 20, 0]} />
        <ambientLight color={0xffffff} intensity={0.5} />
        <directionalLight color={0xffffff} position={[-5, 15, 10]} castShadow>
          <orthographicCamera attach="shadow-camera" args={[-2, 2, 2, -2]} />
        </directionalLight>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshPhongMaterial color={0xbbbbbb} depthWrite={false} />
        </mesh>
        <gridHelper args={[40, 40, 0x000000, 0x000000]} material-opacity={0.2} material-transparent={true} />
        <mesh geometry={geometry} scale={2 / radius} rotation={[Math.PI * 1.5, 0, 0]} castShadow receiveShadow>
          <meshPhongMaterial color={0x1a5fb4} shininess={60} flatShading />
        </mesh>
      </Canvas>
    </Box>
  );
}
