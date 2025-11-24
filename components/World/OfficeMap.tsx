import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { useGameStore } from '../../store';
import { MapLocation } from '../../types';

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

// Fluorescent Ceiling Lights (Liminal aesthetic)
export const FluorescentLights: React.FC = () => {
    const lightsRef = useRef<THREE.Group>(null);

    // Subtle flicker effect
    useFrame((state) => {
        if (lightsRef.current) {
            const flicker = Math.sin(state.clock.elapsedTime * 30) * 0.05 + 0.95;
            lightsRef.current.children.forEach((light) => {
                if (light instanceof THREE.RectAreaLight) {
                    light.intensity = 3 * flicker;
                }
            });
        }
    });

    const lights = [];
    const gridSize = 10;
    const spacing = 10;

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
        for (let z = -gridSize / 2; z < gridSize / 2; z++) {
            lights.push(
                <rectAreaLight
                    key={`light-${x}-${z}`}
                    args={['#FFFACD', 3, 4, 2]} // Pale yellow fluorescent
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

// Office Furniture (Minimal for liminal effect)
export const OfficeFurniture: React.FC = () => {
    const furniture = [];

    // Scattered desks
    const deskPositions = [
        [10, 0.4, 10],
        [-15, 0.4, -20],
        [20, 0.4, -15],
        [-25, 0.4, 15],
        [5, 0.4, -30]
    ];

    deskPositions.forEach((pos, i) => {
        furniture.push(
            <group key={`desk-${i}`} position={pos as [number, number, number]}>
                {/* Desk surface */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[2, 0.1, 1]} />
                    <meshStandardMaterial color="#8B7355" />
                </mesh>
                {/* Desk legs */}
                <mesh position={[-0.8, -0.4, 0.4]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#696969" />
                </mesh>
                <mesh position={[0.8, -0.4, 0.4]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#696969" />
                </mesh>
                <mesh position={[-0.8, -0.4, -0.4]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#696969" />
                </mesh>
                <mesh position={[0.8, -0.4, -0.4]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#696969" />
                </mesh>
            </group>
        );
    });

    return <group>{furniture}</group>;
};

// Complete Office Map
export const OfficeMap: React.FC = () => {
    return (
        <>
            {/* Fluorescent lights */}
            <FluorescentLights />

            {/* Environment */}
            <OfficeGround />
            <OfficeWalls />
            <OfficeFurniture />
            <pointLight color="#a855f7" intensity={5} distance={15} decay={2} position={[0, 0, 0.5]} />
            <pointLight color="#a855f7" intensity={3} distance={10} decay={2} position={[0, 0, -0.5]} />
        </group >
        </>
    );
};
