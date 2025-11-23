import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// The main 3D element with updated effects
function HolographicShield() {
  const groupRef = useRef<THREE.Group>(null!);
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const shieldMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state) => {
    if (groupRef.current && ring1.current && ring2.current && shieldMaterialRef.current) {
      const { clock, mouse } = state;

      // Rings continue to rotate independently
      ring1.current.rotation.x += 0.004;
      ring1.current.rotation.y += 0.004;
      ring2.current.rotation.x -= 0.002;
      ring2.current.rotation.y -= 0.002;

      // Group smoothly rotates to follow the mouse
      const targetRotationY = (mouse.x * Math.PI) / 6;
      const targetRotationX = (mouse.y * Math.PI) / 6;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);

      // Pulsing "breathing" light effect
      const pulse = (Math.sin(clock.getElapsedTime() * 1.5) + 1) / 2; // Normalizes to 0-1 range
      shieldMaterialRef.current.emissiveIntensity = 0.5 + pulse * 0.8;
    }
  });

  return (
    <group ref={groupRef} scale={1.2}>
      {/* Custom shield geometry with an accessible material for animation */}
      <mesh rotation={[0, 0, Math.PI]}>
        <extrudeGeometry args={[new THREE.Shape().moveTo(0, 2).absarc(0, 1.2, 1.5, Math.PI * 1.35, Math.PI * 1.65, false).lineTo(0, -2).lineTo(0, 2), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }]} />
        <meshStandardMaterial
          ref={shieldMaterialRef}
          color="#00ff99"
          emissive="#00ff99"
          metalness={1}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring1} scale={3}>
        <torusGeometry args={[1, 0.015, 16, 100]} />
        <meshStandardMaterial wireframe color="#00ff99" emissive="#00ff99" />
      </mesh>
      <mesh ref={ring2} scale={3.5} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1, 0.01, 16, 100]} />
        <meshStandardMaterial wireframe color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Floating Particles Component
function FloatingParticles({ count = 200 }) {
    const pointsRef = useRef<THREE.Points>(null!);
    
    // Generate random positions for particles once for performance
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = THREE.MathUtils.randFloatSpread(15);      // x
            positions[i3 + 1] = THREE.MathUtils.randFloatSpread(20);  // y
            positions[i3 + 2] = THREE.MathUtils.randFloatSpread(15);  // z
        }
        return positions;
    }, [count]);

    // Animate particles on each frame
    useFrame(() => {
        if(pointsRef.current) {
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                // Move particle up
                pointsRef.current.geometry.attributes.position.array[i3 + 1] += 0.01;
                // If particle is off-screen, reset to bottom
                if (pointsRef.current.geometry.attributes.position.array[i3 + 1] > 10) {
                    pointsRef.current.geometry.attributes.position.array[i3 + 1] = -10;
                }
            }
            // Inform Three.js that the positions have changed
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
            </bufferGeometry>
            {/* Corrected material without deprecated properties */}
            <pointsMaterial size={0.05} color="#00ff99" transparent />
        </points>
    );
}

// The main exportable 3D scene component
export const Scene3D = () => {
  return (
    <div className="absolute inset-0 -z-10 bg-[#0A0A1A]">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <fog attach="fog" args={["#0A0A1A", 15, 30]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#00ff99" distance={20} />
        <Stars radius={150} depth={50} count={5000} factor={5} saturation={0} fade />
        
        <HolographicShield />
        <FloatingParticles />
        
        {/* The crashing EffectComposer and Bloom components are removed from this stable version. */}
      </Canvas>
    </div>
  );
};