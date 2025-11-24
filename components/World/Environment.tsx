
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { usePlane, useCylinder, useBox, useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { MapLocation, GameState } from '../../types';

// --- Random Utils ---

const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const getChunkSeed = (cx: number, cz: number) => {
    return cx * 43758.5453 + cz * 12.9898;
};

const getDeterministicRotation = (id: string): [number, number, number] => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
    }
    const angle = Math.abs(hash) % 360 * (Math.PI / 180);
    return [0, angle, 0];
};

// --- Components ---

const Tree: React.FC<{ position: [number, number, number], scale: number, seed: number, type: number }> = ({ position, scale, seed, type }) => {
    const rotY = seededRandom(seed) * Math.PI * 2;
    const leafColor1 = useMemo(() => new THREE.Color().setHSL(0.25 + seededRandom(seed + 1) * 0.1, 0.6, 0.25), [seed]);
    const leafColor2 = useMemo(() => new THREE.Color().setHSL(0.2 + seededRandom(seed + 2) * 0.1, 0.5, 0.3), [seed]);
    const trunkColor = "#3e2723";

    // Physics Collider for Trunk
    useCylinder(() => ({
        mass: 0,
        type: 'Static',
        position: [position[0], position[1] + 2 * scale, position[2]],
        args: [0.5 * scale, 0.7 * scale, 4 * scale, 8],
    }));

    if (type === 1) { // Detailed Pine
        return (
            <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
                {/* Trunk */}
                <mesh position={[0, 1, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.3, 0.5, 2, 7]} />
                    <meshStandardMaterial color={trunkColor} roughness={1} />
                </mesh>
                {/* Taller upper trunk */}
                <mesh position={[0, 4, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.15, 0.3, 6, 7]} />
                    <meshStandardMaterial color={trunkColor} roughness={1} />
                </mesh>

                {/* Canopy layers - Stacked Cones with slight wobble */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <mesh key={i} position={[0, 2.5 + i * 1.2, 0]} rotation={[0.05 * Math.sin(i + seed), 0, 0.05 * Math.cos(i + seed)]} castShadow receiveShadow>
                        <coneGeometry args={[2.5 - i * 0.4, 2.0, 7]} />
                        <meshStandardMaterial color={i % 2 === 0 ? leafColor1 : leafColor2} roughness={0.9} />
                    </mesh>
                ))}
            </group>
        );
    }

    // Styled Broadleaf (Cloud-like)
    return (
        <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
            {/* Trunk */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.4, 0.6, 3, 6]} />
                <meshStandardMaterial color={trunkColor} roughness={1} />
            </mesh>

            {/* Branches */}
            <mesh position={[0.3, 2.5, 0]} rotation={[0, 0, -0.5]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.3, 1.5, 5]} />
                <meshStandardMaterial color={trunkColor} roughness={1} />
            </mesh>
            <mesh position={[-0.3, 2.8, 0.2]} rotation={[0.4, 0, 0.5]} castShadow receiveShadow>
                <cylinderGeometry args={[0.15, 0.25, 1.2, 5]} />
                <meshStandardMaterial color={trunkColor} roughness={1} />
            </mesh>

            {/* Leaf Clusters (Icosahedrons for low poly aesthetic) */}
            <group position={[0, 4, 0]}>
                <mesh position={[0, 0, 0]} scale={1.8} castShadow receiveShadow>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={leafColor1} roughness={0.8} />
                </mesh>
                <mesh position={[1.2, 0.5, 0.5]} scale={1.3} castShadow receiveShadow>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={leafColor2} roughness={0.8} />
                </mesh>
                <mesh position={[-1.2, 0.8, -0.5]} scale={1.4} castShadow receiveShadow>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={leafColor2} roughness={0.8} />
                </mesh>
                <mesh position={[0, 1.5, 0]} scale={1.2} castShadow receiveShadow>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={leafColor1} roughness={0.8} />
                </mesh>
                <mesh position={[0.5, -0.5, 1.2]} scale={1.0} castShadow receiveShadow>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={leafColor2} roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
};

const Rock: React.FC<{ position: [number, number, number], scale: number, rotation: [number, number, number], type: number }> = ({ position, scale, rotation, type }) => {
    useSphere(() => ({
        mass: 0,
        type: 'Static',
        position: position,
        args: [scale * 0.95]
    }));

    return (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
            {type === 1 ? <icosahedronGeometry args={[1, 1]} /> : <dodecahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial color={type === 1 ? "#57534e" : "#44403c"} roughness={0.9} flatShading />
        </mesh>
    );
};

const SmallRock: React.FC<{ position: [number, number, number], id?: string }> = ({ position, id }) => {
    const rotation = useMemo(() => [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    ] as [number, number, number], []);

    return (
        <group position={position} userData={{ type: 'small_rock', id }}>
            <mesh
                rotation={rotation}
                castShadow
                receiveShadow
            >
                <dodecahedronGeometry args={[0.1, 0]} />
                <meshStandardMaterial color="#78716c" roughness={0.9} />
            </mesh>
        </group>
    );
};

const Stick: React.FC<{ position: [number, number, number], rotation: [number, number, number], id?: string }> = ({ position, rotation, id }) => {
    return (
        <group position={position} rotation={rotation} userData={{ type: 'stick', id }}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.02, 0.03, 0.8, 5]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
            {/* Tiny branch off */}
            <mesh rotation={[Math.PI / 2, 0.5, 0]} position={[0.1, 0, 0.1]} castShadow receiveShadow>
                <cylinderGeometry args={[0.01, 0.015, 0.3, 4]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
        </group>
    )
}

const MushroomVariant1: React.FC = () => (
    <group>
        {/* Stalk */}
        <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
            <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        {/* Cap - Flat */}
        <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.02, 0.1, 7]} />
            <meshStandardMaterial color="#b91c1c" />
        </mesh>
        {/* Cap Dome */}
        <mesh position={[0, 0.45, 0]} castShadow>
            <sphereGeometry args={[0.15, 6, 4]} />
            <meshStandardMaterial color="#b91c1c" />
        </mesh>
        {/* Glowing Spots */}
        <mesh position={[0.08, 0.5, 0.05]}><icosahedronGeometry args={[0.02, 0]} /><meshBasicMaterial color="#fefce8" toneMapped={false} /></mesh>
        <mesh position={[-0.08, 0.48, 0.08]}><icosahedronGeometry args={[0.02, 0]} /><meshBasicMaterial color="#fefce8" toneMapped={false} /></mesh>
    </group>
);

const MushroomVariant2: React.FC = () => (
    <group>
        {/* Tall Neon Mushroom */}
        <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.04, 0.6, 5]} />
            <meshStandardMaterial color="#3f3f46" />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[0.15, 0.4, 6]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} color="#06b6d4" distance={1} intensity={0.5} decay={2} />
    </group>
);

const Mushroom: React.FC<{ position: [number, number, number], type: number, scale: number, id?: string }> = ({ position, type, scale, id }) => {
    return (
        <group position={position} scale={scale} userData={{ type: 'mushroom', id }}>
            {type === 0 ? <MushroomVariant1 /> : <MushroomVariant2 />}
        </group>
    )
}

const Bush: React.FC<{ position: [number, number, number], scale: number, colorHex: string, bushType: string }> = ({ position, scale, colorHex, bushType }) => {
    const seed = useMemo(() => position[0] + position[2], [position]);

    const clusters = useMemo(() => {
        const c = [];
        const count = 5 + Math.floor(seededRandom(seed) * 4);
        for (let i = 0; i < count; i++) {
            c.push({
                pos: [
                    (seededRandom(seed + i) - 0.5) * 1.0,
                    0.2 + seededRandom(seed + i * 2) * 0.6,
                    (seededRandom(seed + i * 3) - 0.5) * 1.0
                ] as [number, number, number],
                scale: 0.4 + seededRandom(seed + i * 4) * 0.5,
                rot: [seededRandom(seed + i * 5) * Math.PI, seededRandom(seed + i * 6) * Math.PI, seededRandom(seed + i * 7) * Math.PI] as [number, number, number]
            })
        }
        return c;
    }, [seed]);

    return (
        <group position={position} scale={scale} userData={{ type: 'bush', bushType, searched: false }}>
            {/* Leaf Clusters - Icosahedrons for better shape */}
            {clusters.map((c, i) => (
                <mesh key={i} position={c.pos} rotation={c.rot} scale={c.scale} castShadow receiveShadow>
                    <icosahedronGeometry args={[0.6, 0]} />
                    <meshStandardMaterial color={colorHex} roughness={0.9} flatShading />
                </mesh>
            ))}

            {/* Berries */}
            {bushType === 'berry_red' && (
                <>
                    <mesh position={[0.3, 0.6, 0.3]} castShadow><dodecahedronGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[-0.2, 0.5, 0.4]} castShadow><dodecahedronGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[0.1, 0.7, -0.3]} castShadow><dodecahedronGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                </>
            )}
            {bushType === 'berry_blue' && (
                <>
                    <mesh position={[0.3, 0.6, 0.3]} castShadow><dodecahedronGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                    <mesh position={[-0.2, 0.5, 0.4]} castShadow><dodecahedronGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                </>
            )}
        </group>
    )
}

// Low-Poly Tulip-like Flowers
export const Flowers: React.FC<{ data: any[] }> = ({ data }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    React.useLayoutEffect(() => {
        if (!mesh.current) return;
        data.forEach((d, i) => {
            dummy.position.set(d.x, 0.15 * d.scale, d.z);
            dummy.scale.setScalar(d.scale);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
            mesh.current!.setColorAt(i, new THREE.Color(d.color));
        });
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }, [data, dummy]);

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, data.length]} castShadow>
            {/* Inverted Cone for Flower Cup */}
            <coneGeometry args={[0.15, 0.3, 5, 1, true]} />
            <meshStandardMaterial side={THREE.DoubleSide} />
        </instancedMesh>
    );
}

export const GrassClumps: React.FC<{ data: any[] }> = ({ data }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    React.useLayoutEffect(() => {
        if (!mesh.current) return;
        data.forEach((d, i) => {
            dummy.position.set(d.x, 0.2, d.z);
            dummy.scale.setScalar(d.scale);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    }, [data, dummy]);

    useFrame((state) => {
        if (materialRef.current && materialRef.current.userData.shader) {
            materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    const handleOnBeforeCompile = (shader: any) => {
        shader.uniforms.uTime = { value: 0 };
        shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            float heightFactor = position.y + 0.2;
            vec4 worldPos = instanceMatrix * vec4(position, 1.0);
            float x = worldPos.x;
            float z = worldPos.z;
            float time = uTime * 1.5;
            
            float mainFlow = sin(x * 0.05 + z * 0.05 + time);
            float turbulence = sin(x * 0.2 - z * 0.1 + time * 2.5 + mainFlow);
            float gust = sin(time * 0.5 + x * 0.02) * 0.5 + 0.5;
            
            float bendAmount = heightFactor * heightFactor; 
            
            float offsetX = (mainFlow * 0.15 + turbulence * 0.05) * bendAmount * (0.8 + gust);
            float offsetZ = (cos(time * 0.8 + x * 0.1) * 0.1 + turbulence * 0.03) * bendAmount;
            
            transformed.x += offsetX;
            transformed.z += offsetZ;
            transformed.y -= (abs(offsetX) + abs(offsetZ)) * 0.2;
            `
        );
        if (materialRef.current) {
            materialRef.current.userData.shader = shader;
        }
    };

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, data.length]} castShadow receiveShadow>
            <coneGeometry args={[0.1, 0.4, 4]} />
            <meshStandardMaterial
                ref={materialRef}
                color="#3f6212"
                onBeforeCompile={handleOnBeforeCompile}
            />
        </instancedMesh>
    );
}

// --- Fauna ---

const Rabbit: React.FC<{ position: [number, number, number], rotation: number }> = ({ position, rotation }) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!group.current) return;
        const t = state.clock.getElapsedTime();
        const offset = position[0] * 0.5 + position[2] * 0.5;
        // Periodic hop
        const cycle = (t + offset) % 4; // 4 second cycle
        if (cycle < 0.5) {
            // Hop up
            const hopHeight = Math.sin(cycle * Math.PI * 2) * 0.3;
            group.current.position.y = position[1] + Math.max(0, hopHeight);
        } else {
            group.current.position.y = position[1];
        }
    })

    return (
        <group ref={group} position={position} rotation={[0, rotation, 0]}>
            {/* Body */}
            <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.25, 0.25, 0.35]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.3, 0.2]} castShadow>
                <boxGeometry args={[0.18, 0.18, 0.18]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {/* Ears */}
            <mesh position={[0.05, 0.45, 0.2]} castShadow>
                <boxGeometry args={[0.04, 0.15, 0.04]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            <mesh position={[-0.05, 0.45, 0.2]} castShadow>
                <boxGeometry args={[0.04, 0.15, 0.04]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 0.15, -0.2]} castShadow>
                <boxGeometry args={[0.08, 0.08, 0.08]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
        </group>
    )
}

const Butterflies: React.FC<{ data: any[] }> = ({ data }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!mesh.current) return;
        const t = state.clock.getElapsedTime();
        data.forEach((d, i) => {
            // Float around base position
            const x = d.x + Math.sin(t * d.speed + i) * 0.5;
            const y = d.y + Math.cos(t * d.speed * 0.5 + i) * 0.2;
            const z = d.z + Math.cos(t * d.speed + i) * 0.5;

            dummy.position.set(x, y, z);
            // Flapping rotation
            dummy.rotation.set(Math.sin(t * 15 + i) * 0.5, t * 0.5 + i, Math.sin(t * 15 + i) * 0.5);
            dummy.scale.setScalar(0.1);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
            mesh.current!.setColorAt(i, new THREE.Color(d.color));
        });
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, data.length]}>
            {/* Simple Triangle Wing Shape */}
            <circleGeometry args={[1, 3]} />
            <meshBasicMaterial side={THREE.DoubleSide} transparent opacity={0.8} />
        </instancedMesh>
    );
}

export const FloatingDust: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 50;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 100,
            y: Math.random() * 20,
            z: (Math.random() - 0.5) * 100,
            speed: 0.002 + Math.random() * 0.005,
            phase: Math.random() * Math.PI * 2
        }));
    }, []);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((p, i) => {
            const y = p.y + Math.sin(time * p.speed + p.phase) * 0.5;
            const x = p.x + Math.cos(time * 0.1 + p.phase) * 1;

            dummy.position.set(x + position[0], y, p.z + position[2]);
            dummy.scale.setScalar(Math.sin(time * 2 + p.phase) * 0.05 + 0.05);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    )
}

// --- Dynamic Items (Dropped by Player) ---
const DroppedBerry: React.FC<{ position: [number, number, number], color: string, id: string, type: string }> = ({ position, color, id, type }) => (
    <group position={position} userData={{ type, id }}>
        <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color={color} />
        </mesh>
    </group>
);

const DroppedGeneric: React.FC<{ position: [number, number, number], id: string, type: string, color: string }> = ({ position, id, type, color }) => (
    <group position={position} userData={{ type, id }}>
        <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={color} />
        </mesh>
    </group>
);

export const DynamicItems: React.FC = () => {
    const droppedItems = useGameStore(state => state.droppedItems);

    return (
        <group>
            {droppedItems.map(item => {
                const pos = item.position;
                const id = item.id;
                const deterministicRotation = getDeterministicRotation(id);

                if (item.type === 'small_rock') return <SmallRock key={id} position={pos} id={id} />;
                if (item.type === 'stick') return <Stick key={id} position={pos} rotation={deterministicRotation} id={id} />;
                if (item.type === 'mushroom') return <Mushroom key={id} position={pos} type={0} scale={0.5} id={id} />;
                if (item.type === 'red_berry') return <DroppedBerry key={id} position={pos} color="#ef4444" id={id} type="red_berry" />;
                if (item.type === 'blue_berry') return <DroppedBerry key={id} position={pos} color="#3b82f6" id={id} type="blue_berry" />;
                if (item.type === 'torch') return <DroppedGeneric key={id} position={pos} color="#fbbf24" id={id} type="torch" />;
                if (item.type === 'sharp_rock') return <DroppedGeneric key={id} position={pos} color="#57534e" id={id} type="sharp_rock" />;
                if (item.type === 'stick_bundle') return <DroppedGeneric key={id} position={pos} color="#5d4037" id={id} type="stick_bundle" />;

                return <SmallRock key={id} position={pos} id={id} />;
            })}
        </group>
    )
}

// --- Map Boundaries ---
const MapBoundary: React.FC<{ limit: number }> = ({ limit }) => {
    const thickness = 50;
    const height = 50;

    useBox(() => ({ position: [0, height / 2, -limit - thickness / 2], args: [limit * 2 + thickness * 2, height, thickness], type: 'Static' }));
    useBox(() => ({ position: [0, height / 2, limit + thickness / 2], args: [limit * 2 + thickness * 2, height, thickness], type: 'Static' }));
    useBox(() => ({ position: [limit + thickness / 2, height / 2, 0], args: [thickness, height, limit * 2], type: 'Static' }));
    useBox(() => ({ position: [-limit - thickness / 2, height / 2, 0], args: [thickness, height, limit * 2], type: 'Static' }));

    return null;
}

// --- Mysterious Door ---
const MysteriousDoor: React.FC<{ limit: number }> = ({ limit }) => {
    const [pos, setPos] = useState<[number, number, number]>([0, -500, 0]); // Start hidden
    const [rot, setRot] = useState<[number, number, number]>([0, 0, 0]);
    const [hasTriggered, setHasTriggered] = useState(false); // Prevent multiple triggers
    const setCurrentMap = useGameStore(state => state.setCurrentMap);
    const currentMap = useGameStore(state => state.currentMap);
    const addLog = useGameStore(state => state.addLog);
    const setGameState = useGameStore(state => state.setGameState);
    const { camera } = useThree();

    useEffect(() => {
        const spawn = () => {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            let targetSide = 0;
            if (Math.abs(dir.x) > Math.abs(dir.z)) {
                targetSide = dir.x > 0 ? 2 : 3;
            } else {
                targetSide = dir.z > 0 ? 0 : 1;
            }

            // 75% chance to spawn in front of player, 25% random
            let side = targetSide;
            if (Math.random() > 0.75) {
                side = Math.floor(Math.random() * 4);
            }

            const edge = limit - 0.2;
            const range = limit - 10;
            const offset = (Math.random() - 0.5) * 2 * range;

            let p: [number, number, number];
            let r: [number, number, number];

            switch (side) {
                case 0: // +Z barrier (North)
                    p = [offset, 2.5, edge];
                    r = [0, Math.PI, 0]; // Face South (-Z)
                    break;
                case 1: // -Z barrier (South)
                    p = [offset, 2.5, -edge];
                    r = [0, 0, 0]; // Face North (+Z)
                    break;
                case 2: // +X barrier (East)
                    p = [edge, 2.5, offset];
                    r = [0, -Math.PI / 2, 0]; // Face West (-X)
                    break;
                case 3: // -X barrier (West)
                    p = [-edge, 2.5, offset];
                    r = [0, Math.PI / 2, 0]; // Face East (+X)
                    break;
                default:
                    p = [0, -500, 0];
                    r = [0, 0, 0];
            }
            setPos(p);
            setRot(r);
            setHasTriggered(false); // Reset trigger on new spawn
        };

        spawn(); // Initial spawn
        const interval = setInterval(spawn, 60000);
        return () => clearInterval(interval);
    }, [limit, camera]);

    useFrame(() => {
        // Only check for interaction in forest map
        if (currentMap !== MapLocation.FOREST) return;
        if (hasTriggered) return; // Prevent multiple triggers

        const playerPos = useGameStore.getState().playerPosition;
        const dx = playerPos[0] - pos[0];
        const dy = playerPos[1] - pos[1];
        const dz = playerPos[2] - pos[2];
        const distSq = dx * dx + dy * dy + dz * dz;

        // Touch-based entry - automatic when player gets close
        // Increased radius to 3 units (distSq < 9.0) for easier entry
        if (distSq < 9.0 && pos[1] > -100) { // Within 2 units and door is visible
            setHasTriggered(true); // Mark as triggered
            addLog("You step through the mysterious door into an endless office...", "Narrator");
            setGameState(GameState.LOADING); // Trigger loading screen

            // Delay map change to ensure loading screen shows
            setTimeout(() => {
                setCurrentMap(MapLocation.OFFICE);
                setPos([0, -500, 0]); // Hide door after use (one-way portal)
            }, 100);
        }
    });

    // Only render in forest
    if (currentMap !== MapLocation.FOREST) return null;

    return (
        <group position={pos} rotation={rot}>
            <mesh receiveShadow> {/* Removed castShadow */}
                <planeGeometry args={[3, 5]} />
                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
            </mesh>
            {/* Brighter purple glow for visibility */}
            <pointLight color="#a855f7" intensity={5} distance={15} decay={2} position={[0, 0, 0.5]} />
        </group>
    );
}

// --- Office Return Door removed - one-way portal only ---
// Players cannot return from the office
export const OfficeReturnDoor: React.FC = () => {
    return null;
}

// --- Visual Background ---
export const HorizonGrass: React.FC = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
            <circleGeometry args={[800, 32]} />
            <meshStandardMaterial color="#3f2e22" />
        </mesh>
    )
}

// --- Chunk System ---

const CHUNK_SIZE = 100;

interface ChunkData {
    trees: any[];
    rocks: any[];
    flowers: any[];
    grass: any[];
    mushrooms: any[];
    bushes: any[];
    sticks: any[];
    smallRocks: any[];
    rabbits: any[];
    butterflies: any[];
}

const Chunk: React.FC<{ x: number, z: number }> = ({ x, z }) => {
    const chunkData = useMemo<ChunkData>(() => {
        const seed = getChunkSeed(x, z);

        const _trees = [];
        const _rocks = [];
        const _flowers = [];
        const _grass = [];
        const _mushrooms = [];
        const _bushes = [];
        const _sticks = [];
        const _smallRocks = [];
        const _rabbits = [];
        const _butterflies = [];

        const offsetX = x * CHUNK_SIZE;
        const offsetZ = z * CHUNK_SIZE;

        const placedObjects: { x: number, z: number, r: number }[] = [];

        const isPositionValid = (x: number, z: number, radius: number) => {
            const distToCenterSq = x * x + z * z;
            if (distToCenterSq < 49) return false;

            for (const obj of placedObjects) {
                const dx = x - obj.x;
                const dz = z - obj.z;
                const distSq = dx * dx + dz * dz;
                const minDist = radius + obj.r;
                if (distSq < minDist * minDist) {
                    return false;
                }
            }
            return true;
        };

        // Trees
        const treeCount = Math.floor(10 + seededRandom(seed + 1) * 6);
        for (let i = 0; i < treeCount; i++) {
            const lx = (seededRandom(seed + i * 2) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 3) - 0.5) * CHUNK_SIZE;
            const wx = offsetX + lx;
            const wz = offsetZ + lz;
            const scale = 1.2 + seededRandom(seed + i * 4) * 2.5;
            const radius = 1.5 * scale;

            if (!isPositionValid(wx, wz, radius)) continue;

            const type = seededRandom(seed + i * 99) > 0.6 ? 1 : 0;
            _trees.push({ position: [wx, 0, wz] as [number, number, number], scale, seed: seed + i, type });
            placedObjects.push({ x: wx, z: wz, r: radius * 0.8 });
        }

        // Rocks
        const rockCount = Math.floor(8 + seededRandom(seed + 10) * 4);
        for (let i = 0; i < rockCount; i++) {
            const lx = (seededRandom(seed + i * 10) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 11) - 0.5) * CHUNK_SIZE;
            const wx = offsetX + lx;
            const wz = offsetZ + lz;
            const scale = 1.5 + seededRandom(seed + i * 12) * 3.5;
            const radius = scale;

            if (!isPositionValid(wx, wz, radius)) continue;

            const type = seededRandom(seed + i * 88) > 0.5 ? 1 : 0;
            _rocks.push({
                position: [wx, scale / 2, wz] as [number, number, number],
                scale,
                rotation: [seededRandom(seed) * Math.PI, seededRandom(seed + 1) * Math.PI, seededRandom(seed + 2) * Math.PI] as [number, number, number],
                type
            });
            placedObjects.push({ x: wx, z: wz, r: radius });
        }

        // Sticks
        const stickCount = Math.floor(6 + seededRandom(seed + 60) * 5);
        for (let i = 0; i < stickCount; i++) {
            const lx = (seededRandom(seed + i * 60) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 61) - 0.5) * CHUNK_SIZE;
            _sticks.push({
                position: [offsetX + lx, 0.1, offsetZ + lz] as [number, number, number],
                rotation: [0, seededRandom(seed + i * 62) * Math.PI, 0] as [number, number, number]
            });
        }

        // Mushrooms
        const mushroomCount = Math.floor(5 + seededRandom(seed + 50) * 5);
        for (let i = 0; i < mushroomCount; i++) {
            const lx = (seededRandom(seed + i * 50) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 51) - 0.5) * CHUNK_SIZE;
            _mushrooms.push({
                position: [offsetX + lx, 0, offsetZ + lz],
                type: seededRandom(seed + i * 52) > 0.7 ? 1 : 0,
                scale: 0.5 + seededRandom(seed + i * 53) * 0.5
            });
        }

        // Small Rocks 
        const smallRockCount = Math.floor(5 + seededRandom(seed + 70) * 3);
        for (let i = 0; i < smallRockCount; i++) {
            const lx = (seededRandom(seed + i * 70) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 71) - 0.5) * CHUNK_SIZE;
            _smallRocks.push({
                position: [offsetX + lx, 0.05, offsetZ + lz] as [number, number, number]
            });
        }

        // Bushes
        const bushCount = Math.floor(15 + seededRandom(seed + 20) * 10);
        for (let i = 0; i < bushCount; i++) {
            const lx = (seededRandom(seed + i * 20) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 21) - 0.5) * CHUNK_SIZE;
            const wx = offsetX + lx;
            const wz = offsetZ + lz;

            if (!isPositionValid(wx, wz, 0.5)) continue;

            const typeRand = seededRandom(seed + i * 24);
            let bushType = 'empty';
            if (typeRand > 0.7) bushType = 'berry_red';
            else if (typeRand > 0.5) bushType = 'berry_blue';

            _bushes.push({
                position: [wx, 0, wz] as [number, number, number],
                scale: 0.8 + seededRandom(seed + i * 22) * 1.2,
                colorHex: seededRandom(seed + i * 23) > 0.5 ? "#422006" : "#3f6212",
                bushType
            });
        }

        // Flowers
        const flowerCount = Math.floor(30 + seededRandom(seed + 30) * 20);
        for (let i = 0; i < flowerCount; i++) {
            const lx = (seededRandom(seed + i * 30) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 31) - 0.5) * CHUNK_SIZE;
            _flowers.push({
                x: offsetX + lx,
                z: offsetZ + lz,
                scale: 0.3 + seededRandom(seed + i * 32) * 0.4,
                color: seededRandom(seed + i * 33) > 0.5 ? '#f43f5e' : '#fbbf24'
            });
        }

        // Grass
        const grassCount = Math.floor(4000 + seededRandom(seed + 40) * 1000);
        for (let i = 0; i < grassCount; i++) {
            const lx = (seededRandom(seed + i * 40) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 41) - 0.5) * CHUNK_SIZE;
            _grass.push({
                x: offsetX + lx,
                z: offsetZ + lz,
                scale: 0.5 + seededRandom(seed + i * 42) * 0.5,
            });
        }

        // Rabbits
        const rabbitCount = seededRandom(seed + 80) > 0.7 ? 1 : 0;
        for (let i = 0; i < rabbitCount; i++) {
            const lx = (seededRandom(seed + i * 80) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 81) - 0.5) * CHUNK_SIZE;
            _rabbits.push({
                position: [offsetX + lx, 0, offsetZ + lz],
                rotation: seededRandom(seed + i * 82) * Math.PI * 2
            });
        }

        // Butterflies
        const butterflyCount = Math.floor(seededRandom(seed + 90) * 10);
        for (let i = 0; i < butterflyCount; i++) {
            const lx = (seededRandom(seed + i * 90) - 0.5) * CHUNK_SIZE;
            const lz = (seededRandom(seed + i * 91) - 0.5) * CHUNK_SIZE;
            _butterflies.push({
                x: offsetX + lx,
                y: 1 + seededRandom(seed + i) * 2,
                z: offsetZ + lz,
                speed: 1 + seededRandom(seed + i) * 2,
                color: seededRandom(seed + i * 92) > 0.5 ? '#60a5fa' : '#c084fc'
            });
        }

        return { trees: _trees, rocks: _rocks, flowers: _flowers, grass: _grass, mushrooms: _mushrooms, bushes: _bushes, sticks: _sticks, smallRocks: _smallRocks, rabbits: _rabbits, butterflies: _butterflies };
    }, [x, z]);

    return (
        <group>
            {chunkData.trees.map((t, i) => <Tree key={i} {...t} />)}
            {chunkData.rocks.map((r, i) => <Rock key={i} {...r} />)}
            {chunkData.mushrooms.map((m, i) => <Mushroom key={i} {...m} />)}
            {chunkData.sticks.map((s, i) => <Stick key={i} {...s} />)}
            {chunkData.smallRocks.map((s, i) => <SmallRock key={i} {...s} />)}
            {chunkData.bushes.map((b, i) => <Bush key={i} {...b} />)}
            {chunkData.rabbits.map((r, i) => <Rabbit key={i} position={r.position} rotation={r.rotation} />)}
            <Flowers data={chunkData.flowers} />
            <GrassClumps data={chunkData.grass} />
            <Butterflies data={chunkData.butterflies} />
            <FloatingDust position={[x * CHUNK_SIZE, 0, z * CHUNK_SIZE]} />
        </group>
    )
};

export const InfiniteWorld: React.FC = () => {
    const { camera } = useThree();
    const [chunks, setChunks] = useState<{ x: number, z: number }[]>([]);
    const currentChunk = useRef<{ x: number, z: number } | null>(null);
    const MAP_RADIUS_CHUNKS = 1;

    useFrame(() => {
        const cx = Math.round(camera.position.x / CHUNK_SIZE);
        const cz = Math.round(camera.position.z / CHUNK_SIZE);

        if (!currentChunk.current || currentChunk.current.x !== cx || currentChunk.current.z !== cz) {
            currentChunk.current = { x: cx, z: cz };
            const newChunks = [];
            const range = 1;
            for (let x = cx - range; x <= cx + range; x++) {
                for (let z = cz - range; z <= cz + range; z++) {
                    if (Math.abs(x) <= MAP_RADIUS_CHUNKS && Math.abs(z) <= MAP_RADIUS_CHUNKS) {
                        newChunks.push({ x, z });
                    }
                }
            }
            setChunks(newChunks);
        }
    });

    const mapLimit = (MAP_RADIUS_CHUNKS * CHUNK_SIZE) + (CHUNK_SIZE / 2);

    return (
        <>
            <MapBoundary limit={mapLimit} />
            <MysteriousDoor limit={mapLimit} />
            <HorizonGrass />
            {chunks.map(chunk => (
                <Chunk key={`${chunk.x},${chunk.z}`} x={chunk.x} z={chunk.z} />
            ))}
        </>
    );
};

export const Ground: React.FC = () => {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        type: 'Static',
        material: { friction: 0.1, restitution: 0 }
    }));

    return <mesh ref={ref as any} />;
};

export const VisualGround: React.FC = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[300, 300]} />
            <meshStandardMaterial color="#3f2e22" roughness={1} />
        </mesh>
    )
}
