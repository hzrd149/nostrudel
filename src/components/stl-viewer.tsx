// @ts-nocheck
/**
 * @react-three/fiber extends the global JSX.IntrinsicElements with 100+ extra elements which overloads typescripts type checking.
 * To fix this I pulled in the patch-package tool to comment out the offending code in @react-three/fiber
 */
import { forwardRef } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { Color, Fog, Vector3 } from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

const STLViewer = forwardRef<HTMLCanvasElement, Omit<BoxProps, "children"> & { url: string }>(
  ({ url, ...props }, ref) => {
    const geometry = useLoader(STLLoader, url);

    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();

    const objectScale = 2 / geometry.boundingSphere!.radius;
    const bb = geometry.boundingBox!;
    const center = bb.getCenter(new Vector3()).multiplyScalar(objectScale);

    return (
      <Box {...props} position="relative">
        <Canvas
          shadows
          gl={{
            antialias: true,
            shadowMapEnabled: true,
            preserveDrawingBuffer: true,
          }}
          style={{ width: "100%", height: "100%" }}
          scene={{ background: new Color(0xa0a0a0), fog: new Fog(0xa0a0a0, 4, 20) }}
          camera={{ position: [-2, 2, -2.5] }}
          ref={ref}
        >
          <OrbitControls enableDamping enablePan enableRotate enableZoom />
          <hemisphereLight color={0xffffff} groundColor={0x444444} intensity={3} position={[0, 20, 0]} />
          <ambientLight color={0xffffff} intensity={0.5} />
          <directionalLight color={0xffffff} position={[-5, 15, 10]} castShadow>
            <orthographicCamera attach="shadow-camera" args={[-2, 2, 2, -2]} />
          </directionalLight>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            position={[0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0]}
          >
            <planeGeometry args={[40, 40]} />
            <meshPhongMaterial color={0xbbbbbb} depthWrite={false} />
          </mesh>
          <gridHelper
            args={[40, 40, 0x000000, 0x000000]}
            material-opacity={0.2}
            material-transparent={true}
            position={[0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0]}
          />
          <mesh
            geometry={geometry}
            scale={objectScale}
            rotation={[Math.PI * -0.5, 0, 0]}
            castShadow
            receiveShadow
            position={[-center.x, -center.z, center.y]}
          >
            <meshPhongMaterial color={0x1a5fb4} shininess={60} flatShading />
          </mesh>
        </Canvas>
      </Box>
    );
  },
);

export default STLViewer;
