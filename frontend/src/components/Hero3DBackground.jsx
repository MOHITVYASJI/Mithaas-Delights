import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Floating Sweet/Mithai Shapes
 */
const FloatingSweet = ({ position, color, scale = 1, speed = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed;
    meshRef.current.position.y = position[1] + Math.sin(time) * 0.5;
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

/**
 * Particle Cloud
 */
const ParticleCloud = ({ count = 100 }) => {
  const points = useRef();

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#FFD93D"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * Animated Blob
 */
const AnimatedBlob = ({ position, color, scale = 1 }) => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </Sphere>
    </Float>
  );
};

/**
 * Glowing Ring
 */
const GlowingRing = ({ position, color, radius = 2 }) => {
  const ringRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ringRef.current.rotation.x = time * 0.5;
    ringRef.current.rotation.y = time * 0.3;
    ringRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
  });

  return (
    <mesh ref={ringRef} position={position}>
      <torusGeometry args={[radius, 0.1, 16, 100]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

/**
 * Main Hero 3D Background Component
 */
export const Hero3DBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-40">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#FFD93D" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#FF6B6B" />
        <pointLight position={[0, 0, 5]} intensity={0.6} color="#4ECDC4" />

        {/* Floating sweets */}
        <FloatingSweet position={[-4, 2, -2]} color="#FF6B6B" scale={0.8} speed={0.8} />
        <FloatingSweet position={[4, -2, -3]} color="#FFD93D" scale={1} speed={1} />
        <FloatingSweet position={[0, 3, -4]} color="#4ECDC4" scale={0.6} speed={1.2} />
        <FloatingSweet position={[-3, -3, -2]} color="#FF8C42" scale={0.7} speed={0.9} />
        <FloatingSweet position={[3, 1, -5]} color="#A8E6CF" scale={0.9} speed={1.1} />

        {/* Animated blobs */}
        <AnimatedBlob position={[-5, 0, -8]} color="#FF6B6B" scale={2} />
        <AnimatedBlob position={[5, -2, -10]} color="#4ECDC4" scale={2.5} />
        <AnimatedBlob position={[0, 4, -12]} color="#FFD93D" scale={1.8} />

        {/* Glowing rings */}
        <GlowingRing position={[-2, 2, -6]} color="#FF6B6B" radius={1.5} />
        <GlowingRing position={[2, -1, -7]} color="#4ECDC4" radius={2} />

        {/* Particle cloud */}
        <ParticleCloud count={150} />
      </Canvas>
    </div>
  );
};

export default Hero3DBackground;
