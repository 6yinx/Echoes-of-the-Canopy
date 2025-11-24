import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { useGameStore } from '../../store';
import { MapLocation } from '../../types';
import { OfficeReturnDoor } from './Environment';

// Liminal Office Environment
export const OfficeGround: React.FC = () => {
    const [ref] = usePlane<THREE.Mesh>(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        material: { friction: 0.3 }
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#D2B48C" /> {/* Beige office carpet */}
        </mesh>
    );
};

// Fluorescent Ceiling Lights (Liminal aesthetic) - Optimized for mobile
export const FluorescentLights: React.FC = () => {
    const lightsRef = useRef<THREE.Group>(null);

    // Subtle flicker effect
    useFrame((state) => {
        if (lightsRef.current) {
            const flicker = Math.sin(state.clock.elapsedTime * 30) * 0.05 + 0.95;
            lightsRef.current.children.forEach((light) => {
                if (light instanceof THREE.RectAreaLight) {
                    light.intensity = 4 * flicker; // Increased intensity since fewer lights
                }
            });
        }
    });

    const lights = [];
    const gridSize = 3; // Reduced from 10 to 3 for mobile performance
    const spacing = 15; // Increased spacing to cover same area

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
        for (let z = -gridSize / 2; z < gridSize / 2; z++) {
            lights.push(
                <rectAreaLight
                    key={`light-${x}-${z}`}
                    args={['#FFFACD', 4, 6, 3]} // Larger lights with more intensity
                    position={[x * spacing, 4.8, z * spacing]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    castShadow
                />
            );
        }
    }

    return <group ref={lightsRef}>{lights}</group>;
};

// Office Walls
export const OfficeWalls: React.FC = () => {
    const wallHeight = 5;
    const wallLength = 100;
    const wallColor = "#F5F5DC"; // Off-white/beige

    return (
        <group>
            {/* North Wall */}
            <mesh position={[0, wallHeight / 2, -wallLength / 2]} receiveShadow>
                <boxGeometry args={[wallLength, wallHeight, 0.2]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* South Wall */}
            <mesh position={[0, wallHeight / 2, wallLength / 2]} receiveShadow>
                <boxGeometry args={[wallLength, wallHeight, 0.2]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* East Wall */}
            <mesh position={[wallLength / 2, wallHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[0.2, wallHeight, wallLength]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* West Wall */}
            <mesh position={[-wallLength / 2, wallHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[0.2, wallHeight, wallLength]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Ceiling */}
            <mesh position={[0, wallHeight, 0]} receiveShadow>
                <boxGeometry args={[wallLength, 0.2, wallLength]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>
        </group>
    );
};

// Office Furniture removed for mobile performance
// Empty office creates better liminal space aesthetic
export const OfficeFurniture: React.FC = () => {
    return null;
};

// Complete Office Map - Optimized for mobile
export const OfficeMap: React.FC = () => {
    return (
        <>
            {/* Fluorescent lights - reduced for performance */}
            <FluorescentLights />

            {/* Environment */}
            <OfficeGround />
            <OfficeWalls />

            {/* Return door to forest */}
            <OfficeReturnDoor />
        </>
    );
};
