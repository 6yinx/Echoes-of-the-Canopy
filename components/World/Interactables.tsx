import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import { Vector3 } from 'three';
import { InteractableObject } from '../../types';
import { useGameStore } from '../../store';

export const InteractableMarker: React.FC<{ 
  data: InteractableObject; 
  playerPosition: Vector3 
}> = ({ data, playerPosition }) => {
  const { setNearbyInteractable, nearbyInteractableId } = useGameStore();
  const ref = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    
    const dist = ref.current.position.distanceTo(playerPosition);
    const isClose = dist < 3.5;

    if (isClose && nearbyInteractableId !== data.id) {
       // Only set if we are the closest or nothing is selected
       // Simplification: First one close enough wins
       setNearbyInteractable(data.id);
    } else if (!isClose && nearbyInteractableId === data.id) {
       setNearbyInteractable(null);
    }
    
    setHovered(isClose);
  });

  // Different visuals based on type
  const getColor = () => {
    switch (data.type) {
      case 'ruin': return '#a8a29e';
      case 'flower': return '#f43f5e';
      default: return '#fbbf24';
    }
  };

  return (
    <group position={data.position} ref={ref}>
       {/* Visual indicator of the object */}
       <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {data.type === 'ruin' && (
             <mesh castShadow receiveShadow scale={[1, 2, 1]} position={[0, 1, 0]}>
               <boxGeometry />
               <meshStandardMaterial color={getColor()} />
             </mesh>
          )}
          {data.type === 'flower' && (
             <mesh castShadow receiveShadow scale={0.5} position={[0, 0.5, 0]}>
               <torusKnotGeometry args={[0.5, 0.1, 64, 8]} />
               <meshStandardMaterial color={getColor()} emissive="#ff0000" emissiveIntensity={0.5} />
             </mesh>
          )}
          {data.type === 'rock' && (
              <mesh castShadow receiveShadow scale={1.2} position={[0, 0.6, 0]}>
                <octahedronGeometry />
                <meshStandardMaterial color="#57534e" wireframe={hovered} />
              </mesh>
          )}
       </Float>

       {/* Floating text when near */}
       {hovered && (
         <group position={[0, 3.5, 0]}>
            <Text
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              ?
            </Text>
         </group>
       )}
    </group>
  );
};
