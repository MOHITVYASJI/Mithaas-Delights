import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, MeshTransmissionMaterial, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Logo Mesh Component
 */
const Logo3DMesh = ({ isHovered }) => {
  const meshRef = useRef();
  const textRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.rotation.y += delta * 0.2;
      
      // Wobble effect on hover
      if (isHovered) {
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 2) * 0.05;
      } else {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.1);
      }
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group ref={meshRef}>
        <Center>
          <mesh>
            {/* Main logo shape - a decorative sweet/mithai shape */}
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial
              color="#FF6B6B"
              metalness={0.8}
              roughness={0.2}
              emissive="#FF6B6B"
              emissiveIntensity={isHovered ? 0.3 : 0.1}
            />
          </mesh>
          
          {/* Inner glow */}
          <mesh scale={0.9}>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial
              color="#FFD93D"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.6}
              emissive="#FFD93D"
              emissiveIntensity={isHovered ? 0.5 : 0.2}
            />
          </mesh>

          {/* Outer ring */}
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[1.5, 0.1, 16, 100]} />
            <meshStandardMaterial
              color="#4ECDC4"
              metalness={0.7}
              roughness={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Center>

        {/* Orbiting particles */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle * 2) * 0.5,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color="#FFD93D"
                emissive="#FFD93D"
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
};

/**
 * Main 3D Logo Component
 */
export const AnimatedLogo3D = ({ className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`w-20 h-20 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ECDC4" />
        <spotLight
          position={[0, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
          color="#FFD93D"
        />

        {/* Logo */}
        <Logo3DMesh isHovered={isHovered} />
      </Canvas>
    </div>
  );
};

/**
 * Simpler 2D fallback for mobile devices
 */
export const AnimatedLogoFallback = ({ className = '' }) => {
  return (
    <div className={`w-20 h-20 flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#FFD93D] to-[#4ECDC4] animate-spin-slow"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#4ECDC4] via-[#FFD93D] to-[#FF6B6B] animate-pulse"></div>
        <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-900"></div>
      </div>
    </div>
  );
};

export default AnimatedLogo3D;
