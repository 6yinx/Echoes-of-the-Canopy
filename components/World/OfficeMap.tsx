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
    const setCurrentMap = useGameStore(state => state.setCurrentMap);
    const currentMap = useGameStore(state => state.currentMap);
    const addLog = useGameStore(state => state.addLog);
    const setNotification = useGameStore(state => state.setNotification);
    const setNearbyInteractable = useGameStore(state => state.setNearbyInteractable);
    const setInteractionText = useGameStore(state => state.setInteractionText);

    const doorPos: [number, number, number] = [15, 2.5, 0];

    // Check proximity for interaction prompt
    useFrame(() => {
        const playerPos = useGameStore.getState().playerPosition;

        const dx = playerPos[0] - doorPos[0];
        const dy = playerPos[1] - doorPos[1];
        const dz = playerPos[2] - doorPos[2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 16.0) { // Within 4 units
            setNearbyInteractable('office_return_door');
            setInteractionText('Press F to return to the forest');
        } else if (useGameStore.getState().nearbyInteractableId === 'office_return_door') {
            setNearbyInteractable(null);
            setInteractionText(null);
        }
    });

    // Listen for F key press
    React.useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F') {
                const nearbyId = useGameStore.getState().nearbyInteractableId;
                if (nearbyId === 'office_return_door' && currentMap === MapLocation.OFFICE) {
                    addLog("You escape back to the forest.", "Narrator");
                    setNotification("Returned to Forest");
                    setCurrentMap(MapLocation.FOREST);
                    setNearbyInteractable(null);
                    setInteractionText(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentMap, addLog, setNotification, setCurrentMap, setNearbyInteractable, setInteractionText]);

    return (
        <>
            {/* Ambient lighting for liminal effect */}
            <ambientLight intensity={0.3} color="#FFFACD" />

            {/* Fluorescent lights */}
            <FluorescentLights />

            {/* Fog for atmosphere */}
            <fog attach="fog" args={['#F5F5DC', 20, 80]} />

            {/* Environment */}
            <OfficeGround />
            <OfficeWalls />
            <OfficeFurniture />

            {/* Return door */}
            <group position={doorPos}>
                <mesh castShadow receiveShadow>
                    <planeGeometry args={[3, 5]} />
                    <meshBasicMaterial color="black" side={THREE.DoubleSide} />
                </mesh>
                <pointLight color="#a855f7" intensity={5} distance={15} decay={2} position={[0, 0, 0.5]} />
                <pointLight color="#a855f7" intensity={3} distance={10} decay={2} position={[0, 0, -0.5]} />
            </group>
        </>
    );
};
