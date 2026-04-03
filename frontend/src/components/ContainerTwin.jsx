import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Float, 
  MeshDistortMaterial, 
  ContactShadows,
  Html
} from '@react-three/drei';
import * as THREE from 'three';

const ContainerBody = ({ temp, threshold }) => {
  const meshRef = useRef();
  
  // Interpolate color based on temperature vs threshold
  const thermalColor = useMemo(() => {
    const ratio = Math.min(1.2, temp / threshold);
    if (ratio > 1.0) return new THREE.Color('#ef4444'); // Red
    if (ratio > 0.85) return new THREE.Color('#f59e0b'); // Amber
    return new THREE.Color('#00d4aa'); // Original Teal
  }, [temp, threshold]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Subtle pulse animation if near threshold
      if (temp > threshold * 0.85) {
        meshRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.01);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Container Shell */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 2, 2]} />
        <meshStandardMaterial 
          color={thermalColor} 
          metalness={0.7} 
          roughness={0.2} 
          emissive={thermalColor}
          emissiveIntensity={temp > threshold ? 0.5 : 0.1}
        />
      </mesh>

      {/* Corrugation Lines (Visual Polish) */}
      {[...Array(12)].map((_, i) => (
        <mesh key={i} position={[(i - 5.5) * 0.35, 0, 1.02]}>
          <boxGeometry args={[0.05, 1.8, 0.05]} />
          <meshStandardMaterial color="#0a2b3e" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* Reefer Unit (Cooling Engine) */}
      <mesh position={[-2.1, 0, 0]}>
        <boxGeometry args={[0.3, 1.8, 1.8]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>
    </group>
  );
};

const ContainerTwin = ({ temp, threshold, containerId }) => {
  return (
    <div className="w-full h-[400px] bg-dark-lighter/30 rounded-3xl overflow-hidden relative border border-white/5 shadow-inner">
      {/* 3D Neural Scan Overlay UI */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Digital Twin Active</span>
          <h3 className="text-xl font-bold text-white font-mono">{containerId}</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${temp > threshold ? 'bg-red-500 animate-ping' : 'bg-primary'}`} />
            <span className="text-xs font-bold text-gray-400">TELEMETRY SYNCED</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 pointer-events-none text-right">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Internal Core Temp</span>
        <p className={`text-3xl font-black ${temp > threshold ? 'text-red-500' : 'text-primary'}`}>{temp.toFixed(1)}°C</p>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={35} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <ContainerBody temp={temp} threshold={threshold} />
        </Float>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      {/* CSS-based Grid background for high-tech feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
};

export default ContainerTwin;
