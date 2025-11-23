

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { usePlane, useCylinder, useBox, useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store';

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
  const leafColor2 = useMemo(() => new THREE.Color().setHSL(0.2 + seededRandom(seed + 2) * 0.1, 0.7, 0.3), [seed]);
  const trunkColor = "#3e2723";

  // Physics Collider for Trunk
  useCylinder(() => ({
    mass: 0,
    type: 'Static',
    position: [position[0], position[1] + 2 * scale, position[2]],
    args: [0.5 * scale, 0.7 * scale, 4 * scale, 8], 
  }));

  if (type === 1) { // Pine-like but detailed
      return (
        <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
           {/* Trunk with flared base */}
           <mesh position={[0, 1, 0]} castShadow receiveShadow>
             <cylinderGeometry args={[0.3, 0.6, 2, 7]} />
             <meshStandardMaterial color={trunkColor} roughness={1} />
           </mesh>
           <mesh position={[0, 3, 0]} castShadow receiveShadow>
             <cylinderGeometry args={[0.2, 0.3, 3, 7]} />
             <meshStandardMaterial color={trunkColor} roughness={1} />
           </mesh>

           {/* Canopy layers */}
           <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
             <coneGeometry args={[2.5, 2.5, 8]} />
             <meshStandardMaterial color={leafColor1} roughness={0.9} />
           </mesh>
           <mesh position={[0, 5, 0]} castShadow receiveShadow>
             <coneGeometry args={[2.0, 2.5, 8]} />
             <meshStandardMaterial color={leafColor2} roughness={0.9} />
           </mesh>
           <mesh position={[0, 6.5, 0]} castShadow receiveShadow>
             <coneGeometry args={[1.5, 2.5, 8]} />
             <meshStandardMaterial color={leafColor1} roughness={0.9} />
           </mesh>
           <mesh position={[0, 8, 0]} castShadow receiveShadow>
             <coneGeometry args={[0.8, 2, 8]} />
             <meshStandardMaterial color={leafColor2} roughness={0.9} />
           </mesh>
        </group>
      );
  }

  // Broadleaf / Bushy Tree
  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
       {/* Trunk */}
       <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
         <cylinderGeometry args={[0.35, 0.5, 3, 6]} />
         <meshStandardMaterial color={trunkColor} roughness={1} />
       </mesh>
       <mesh position={[0, 3.5, 0]} rotation={[0.2, 0, 0.1]} castShadow receiveShadow>
         <cylinderGeometry args={[0.25, 0.35, 2, 6]} />
         <meshStandardMaterial color={trunkColor} roughness={1} />
       </mesh>

       {/* Leaf Clusters (Low Poly blobs) */}
       <group position={[0, 4.5, 0]}>
           <mesh position={[0, 0, 0]} scale={1.2} castShadow receiveShadow>
               <dodecahedronGeometry args={[2, 0]} />
               <meshStandardMaterial color={leafColor1} roughness={0.8} />
           </mesh>
           <mesh position={[1.5, 0.5, 0.5]} scale={0.8} castShadow receiveShadow>
               <dodecahedronGeometry args={[1.8, 0]} />
               <meshStandardMaterial color={leafColor2} roughness={0.8} />
           </mesh>
           <mesh position={[-1.2, 0.8, -0.5]} scale={0.9} castShadow receiveShadow>
               <dodecahedronGeometry args={[1.9, 0]} />
               <meshStandardMaterial color={leafColor2} roughness={0.8} />
           </mesh>
           <mesh position={[0, 1.8, 0]} scale={0.7} castShadow receiveShadow>
               <dodecahedronGeometry args={[1.5, 0]} />
               <meshStandardMaterial color={leafColor1} roughness={0.8} />
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
      {type === 1 ? <icosahedronGeometry args={[1, 0]} /> : <dodecahedronGeometry args={[1, 0]} />}
      <meshStandardMaterial color={type === 1 ? "#6b7280" : "#5d5753"} roughness={0.8} flatShading />
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
                <cylinderGeometry args={[0.03, 0.04, 0.8, 5]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
        </group>
    )
}

const MushroomVariant1: React.FC = () => (
  <group>
     {/* Stalk */}
     <mesh position={[0, 0.25, 0]} castShadow>
       <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
       <meshStandardMaterial color="#e5e7eb" />
     </mesh>
     {/* Cap */}
     <mesh position={[0, 0.5, 0]} castShadow>
       <cylinderGeometry args={[0.05, 0.35, 0.2, 7]} /> 
       <meshStandardMaterial color="#991b1b" />
     </mesh>
     <mesh position={[0, 0.6, 0]} castShadow>
       <dodecahedronGeometry args={[0.25, 0]} /> 
       <meshStandardMaterial color="#991b1b" />
     </mesh>
     {/* Spots */}
     <mesh position={[0.15, 0.6, 0.1]} castShadow><icosahedronGeometry args={[0.03, 0]} /><meshStandardMaterial color="#fefce8" /></mesh>
     <mesh position={[-0.1, 0.65, 0.15]} castShadow><icosahedronGeometry args={[0.03, 0]} /><meshStandardMaterial color="#fefce8" /></mesh>
     <mesh position={[0, 0.62, -0.2]} castShadow><icosahedronGeometry args={[0.03, 0]} /><meshStandardMaterial color="#fefce8" /></mesh>
  </group>
);

const MushroomVariant2: React.FC = () => (
  <group>
      {/* Cluster of 3 small mushrooms */}
     <group position={[0, 0, 0]}>
         <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 0.4, 5]} /><meshStandardMaterial color="#d6d3d1" /></mesh>
         <mesh position={[0, 0.4, 0]} castShadow><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#5d4037" /></mesh>
     </group>
     <group position={[0.2, 0, 0.1]} scale={0.7} rotation={[0.1, 0, 0.2]}>
         <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 0.4, 5]} /><meshStandardMaterial color="#d6d3d1" /></mesh>
         <mesh position={[0, 0.4, 0]} castShadow><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#5d4037" /></mesh>
     </group>
     <group position={[-0.15, 0, 0.15]} scale={0.5} rotation={[-0.1, 0, -0.1]}>
         <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 0.4, 5]} /><meshStandardMaterial color="#d6d3d1" /></mesh>
         <mesh position={[0, 0.4, 0]} castShadow><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#5d4037" /></mesh>
     </group>
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
        const count = 6 + Math.floor(seededRandom(seed) * 3);
        for(let i=0; i<count; i++) {
            c.push({
                pos: [
                    (seededRandom(seed+i)-0.5) * 0.8,
                    0.3 + seededRandom(seed+i*2) * 0.5,
                    (seededRandom(seed+i*3)-0.5) * 0.8
                ] as [number, number, number],
                scale: 0.3 + seededRandom(seed+i*4) * 0.4,
                rot: [seededRandom(seed+i*5), seededRandom(seed+i*6), seededRandom(seed+i*7)] as [number, number, number]
            })
        }
        return c;
    }, [seed]);

    return (
        <group position={position} scale={scale} userData={{ type: 'bush', bushType, searched: false }}>
            {/* Branches underneath */}
             <mesh position={[0, 0.2, 0]} rotation={[0.1, 0, 0.1]} castShadow>
                <cylinderGeometry args={[0.04, 0.06, 0.6]} />
                <meshStandardMaterial color="#4a3728" />
             </mesh>
             <mesh position={[0.1, 0.2, 0.1]} rotation={[0, 0, -0.4]} castShadow>
                <cylinderGeometry args={[0.03, 0.04, 0.5]} />
                <meshStandardMaterial color="#4a3728" />
             </mesh>
             <mesh position={[-0.1, 0.25, -0.1]} rotation={[0.4, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.03, 0.4]} />
                <meshStandardMaterial color="#4a3728" />
             </mesh>

            {/* Leaf Clusters */}
            {clusters.map((c, i) => (
                <mesh key={i} position={c.pos} rotation={c.rot} scale={c.scale} castShadow receiveShadow>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={colorHex} roughness={0.8} />
                </mesh>
            ))}

            {/* Berries */}
            {bushType === 'berry_red' && (
                <>
                    <mesh position={[0.3, 0.6, 0.3]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[-0.2, 0.5, 0.4]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[0.1, 0.7, -0.3]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[-0.3, 0.4, -0.2]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ef4444" /></mesh>
                </>
            )}
            {bushType === 'berry_blue' && (
                <>
                    <mesh position={[0.3, 0.6, 0.3]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                    <mesh position={[-0.2, 0.5, 0.4]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                    <mesh position={[0.1, 0.7, -0.3]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                    <mesh position={[-0.3, 0.4, -0.2]} castShadow><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                </>
            )}
        </group>
    )
}

export const Flowers: React.FC<{ data: any[] }> = ({ data }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    React.useLayoutEffect(() => {
        if (!mesh.current) return;
        data.forEach((d, i) => {
            dummy.position.set(d.x, 0, d.z);
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
        <instancedMesh ref={mesh} args={[undefined, undefined, data.length]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial />
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

    const handleOnBeforeCompile = (shader: THREE.Shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            // Advanced Wind Physics
            float heightFactor = position.y + 0.2; // Normalize approximate height (0.0 to 0.6)
            
            vec4 worldPos = instanceMatrix * vec4(position, 1.0);
            float x = worldPos.x;
            float z = worldPos.z;
            
            float time = uTime * 1.5;
            
            // Multi-frequency wind simulation
            float mainFlow = sin(x * 0.05 + z * 0.05 + time);
            float turbulence = sin(x * 0.2 - z * 0.1 + time * 2.5 + mainFlow);
            float gust = sin(time * 0.5 + x * 0.02) * 0.5 + 0.5; // low freq gusts
            
            // Non-linear bending (tips bend more)
            float bendAmount = heightFactor * heightFactor; 
            
            float offsetX = (mainFlow * 0.15 + turbulence * 0.05) * bendAmount * (0.8 + gust);
            float offsetZ = (cos(time * 0.8 + x * 0.1) * 0.1 + turbulence * 0.03) * bendAmount;
            
            transformed.x += offsetX;
            transformed.z += offsetZ;
            
            // Slight vertical dip to preserve length appearance during strong bends
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

export const Fireflies: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 8; 
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: 0.5 + Math.random() * 2,
      z: (Math.random() - 0.5) * 100,
      speed: 0.005 + Math.random() * 0.01,
      offset: Math.random() * 100
    }));
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    particles.forEach((p, i) => {
      const y = p.y + Math.sin(time * p.speed * 100 + p.offset) * 0.2;
      const x = p.x + Math.sin(time * 0.2 + p.offset) * 2;
      const z = p.z + Math.cos(time * 0.2 + p.offset) * 2;
      
      dummy.position.set(x + position[0], y, z + position[2]);
      dummy.scale.setScalar(0.1 + Math.sin(time * 5 + p.offset) * 0.05);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
       <sphereGeometry args={[0.3, 4, 4]} />
       <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
    </instancedMesh>
  );
};

// --- Dynamic Items (Dropped by Player) ---
const DroppedBerry: React.FC<{ position: [number, number, number], color: string, id: string, type: string }> = ({ position, color, id, type }) => (
    <group position={position} userData={{ type, id }}>
        <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.08]} />
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
    
    useBox(() => ({ position: [0, height/2, -limit - thickness/2], args: [limit*2 + thickness*2, height, thickness], type: 'Static' }));
    useBox(() => ({ position: [0, height/2, limit + thickness/2], args: [limit*2 + thickness*2, height, thickness], type: 'Static' }));
    useBox(() => ({ position: [limit + thickness/2, height/2, 0], args: [thickness, height, limit*2], type: 'Static' }));
    useBox(() => ({ position: [-limit - thickness/2, height/2, 0], args: [thickness, height, limit*2], type: 'Static' }));

    return null;
}

// --- Mysterious Door ---
const MysteriousDoor: React.FC<{ limit: number }> = ({ limit }) => {
    const [pos, setPos] = useState<[number, number, number]>([0, -500, 0]); // Start hidden
    const [rot, setRot] = useState<[number, number, number]>([0, 0, 0]);
    const teleportPlayer = useGameStore(state => state.teleportPlayer);
    const addLog = useGameStore(state => state.addLog);
    const setNotification = useGameStore(state => state.setNotification);
    const { camera } = useThree();
    
    useEffect(() => {
        const spawn = () => {
            // Get player direction
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);

            // Determine determining side based on looking direction
            // 0: +Z (South), 1: -Z (North), 2: +X (East), 3: -X (West)
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

            const edge = limit - 0.2; // Very close to the edge
            const range = limit - 10;
            const offset = (Math.random() - 0.5) * 2 * range;
            
            let p: [number, number, number];
            let r: [number, number, number];

            switch(side) {
                case 0: // +Z barrier
                   p = [offset, 2.5, edge];
                   r = [0, Math.PI, 0]; // Face -Z (towards center)
                   break;
                case 1: // -Z barrier
                   p = [offset, 2.5, -edge];
                   r = [0, 0, 0]; // Face +Z (towards center)
                   break;
                case 2: // +X barrier
                   p = [edge, 2.5, offset];
                   r = [0, -Math.PI / 2, 0]; // Face -X (towards center)
                   break;
                case 3: // -X barrier
                   p = [-edge, 2.5, offset];
                   r = [0, Math.PI / 2, 0]; // Face +X (towards center)
                   break;
                default:
                   p = [0, -500, 0];
                   r = [0, 0, 0];
            }
            setPos(p);
            setRot(r);
        };

        spawn(); // Initial spawn
        const interval = setInterval(spawn, 60000); // Respawn every 60 seconds
        return () => clearInterval(interval);
    }, [limit, camera]);

    useFrame(() => {
        const playerPos = useGameStore.getState().playerPosition;
        const dx = playerPos[0] - pos[0];
        const dy = playerPos[1] - pos[1];
        const dz = playerPos[2] - pos[2];
        const distSq = dx*dx + dy*dy + dz*dz;
        
        // Check if player is near/inside
        if (distSq < 2.0 && pos[1] > -100) {
            // Player entered
            addLog("The world shifts as you step through the darkness.", "Narrator");
            setNotification("Entered the Void");
            
            // Random teleport
            const safeRange = limit * 0.6;
            const rX = (Math.random() - 0.5) * 2 * safeRange;
            const rZ = (Math.random() - 0.5) * 2 * safeRange;
            teleportPlayer([rX, 5, rZ]);
            
            // Hide door
            setPos([0, -500, 0]);
        }
    });

    return (
        <group position={pos} rotation={rot as any}>
            <mesh castShadow receiveShadow>
                <planeGeometry args={[3, 5]} />
                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
            </mesh>
             {/* Subtle emission to make it look unnatural */}
            <pointLight color="#a855f7" intensity={2} distance={8} decay={2} position={[0, 0, 0.2]} />
        </group>
    );
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
      
      const offsetX = x * CHUNK_SIZE;
      const offsetZ = z * CHUNK_SIZE;

      const placedObjects: {x: number, z: number, r: number}[] = [];

      const isPositionValid = (x: number, z: number, radius: number) => {
          const distToCenterSq = x*x + z*z;
          if (distToCenterSq < 49) return false;

          for (const obj of placedObjects) {
              const dx = x - obj.x;
              const dz = z - obj.z;
              const distSq = dx*dx + dz*dz;
              const minDist = radius + obj.r;
              if (distSq < minDist * minDist) {
                  return false;
              }
          }
          return true;
      };

      // Trees
      const treeCount = Math.floor(12 + seededRandom(seed + 1) * 6);
      for(let i=0; i<treeCount; i++) {
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

         if (seededRandom(seed + i * 5) > 0.6) {
             const mCount = 1 + Math.floor(seededRandom(seed + i) * 2);
             for (let m=0; m<mCount; m++) {
                 _mushrooms.push({
                     position: [wx + (seededRandom(seed+m)-0.5)*3, 0, wz + (seededRandom(seed+m+1)-0.5)*3] as [number, number, number],
                     type: seededRandom(seed+m) > 0.5 ? 0 : 1,
                     scale: 0.3 + seededRandom(seed+m) * 0.3
                 });
             }
         }
      }

      // Rocks
      const rockCount = Math.floor(8 + seededRandom(seed + 10) * 4);
      for(let i=0; i<rockCount; i++) {
         const lx = (seededRandom(seed + i * 10) - 0.5) * CHUNK_SIZE;
         const lz = (seededRandom(seed + i * 11) - 0.5) * CHUNK_SIZE;
         const wx = offsetX + lx;
         const wz = offsetZ + lz;
         const scale = 1.5 + seededRandom(seed + i * 12) * 3.5;
         const radius = scale; 

         if (!isPositionValid(wx, wz, radius)) continue;

         const type = seededRandom(seed + i * 88) > 0.5 ? 1 : 0;
         _rocks.push({
             position: [wx, scale/2, wz] as [number, number, number],
             scale,
             rotation: [seededRandom(seed)*Math.PI, seededRandom(seed+1)*Math.PI, seededRandom(seed+2)*Math.PI] as [number, number, number],
             type
         });
         placedObjects.push({ x: wx, z: wz, r: radius });

         // Spawn small rocks around big rock
         const smallCount = Math.floor(seededRandom(seed + i * 99) * 3) + 2; 
         for(let k=0; k<smallCount; k++) {
            const angle = seededRandom(seed + k * 100) * Math.PI * 2;
            const dist = radius + 0.5 + seededRandom(seed + k * 101) * 1.5;
            _smallRocks.push({
                 position: [wx + Math.cos(angle)*dist, 0.05, wz + Math.sin(angle)*dist] as [number, number, number]
            });
         }
      }

      // Sticks
      const stickCount = Math.floor(6 + seededRandom(seed + 60) * 5);
      for(let i=0; i<stickCount; i++) {
          const lx = (seededRandom(seed + i * 60) - 0.5) * CHUNK_SIZE;
          const lz = (seededRandom(seed + i * 61) - 0.5) * CHUNK_SIZE;
          _sticks.push({
              position: [offsetX + lx, 0.1, offsetZ + lz] as [number, number, number],
              rotation: [0, seededRandom(seed + i * 62) * Math.PI, 0] as [number, number, number]
          });
      }

      // Scattered Random Small Rocks 
      const smallRockCount = Math.floor(5 + seededRandom(seed + 70) * 3);
      for(let i=0; i<smallRockCount; i++) {
          const lx = (seededRandom(seed + i * 70) - 0.5) * CHUNK_SIZE;
          const lz = (seededRandom(seed + i * 71) - 0.5) * CHUNK_SIZE;
          _smallRocks.push({
              position: [offsetX + lx, 0.05, offsetZ + lz] as [number, number, number]
          });
      }

      // Bushes
      const bushCount = Math.floor(15 + seededRandom(seed + 20) * 10);
      for(let i=0; i<bushCount; i++) {
          const lx = (seededRandom(seed + i * 20) - 0.5) * CHUNK_SIZE;
          const lz = (seededRandom(seed + i * 21) - 0.5) * CHUNK_SIZE;
          const wx = offsetX + lx;
          const wz = offsetZ + lz;
          
          if (!isPositionValid(wx, wz, 0.5)) continue;

          // Determine bush type
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
      for(let i=0; i<flowerCount; i++) {
          const lx = (seededRandom(seed + i * 30) - 0.5) * CHUNK_SIZE;
          const lz = (seededRandom(seed + i * 31) - 0.5) * CHUNK_SIZE;
          _flowers.push({
              x: offsetX + lx,
              z: offsetZ + lz,
              scale: 0.3 + seededRandom(seed + i * 32) * 0.4,
              color: seededRandom(seed + i * 33) > 0.5 ? '#fb923c' : '#fcd34d' 
          });
      }

      // Grass - Increased Density
      const grassCount = Math.floor(4000 + seededRandom(seed + 40) * 1000);
      for(let i=0; i<grassCount; i++) {
          const lx = (seededRandom(seed + i * 40) - 0.5) * CHUNK_SIZE;
          const lz = (seededRandom(seed + i * 41) - 0.5) * CHUNK_SIZE;
          _grass.push({
              x: offsetX + lx,
              z: offsetZ + lz,
              scale: 0.5 + seededRandom(seed + i * 42) * 0.5,
          });
      }

      return { trees: _trees, rocks: _rocks, flowers: _flowers, grass: _grass, mushrooms: _mushrooms, bushes: _bushes, sticks: _sticks, smallRocks: _smallRocks };
  }, [x, z]);

  return (
    <group>
       {chunkData.trees.map((t, i) => <Tree key={i} {...t} />)}
       {chunkData.rocks.map((r, i) => <Rock key={i} {...r} />)}
       {chunkData.mushrooms.map((m, i) => <Mushroom key={i} {...m} />)}
       {chunkData.sticks.map((s, i) => <Stick key={i} {...s} />)}
       {chunkData.smallRocks.map((s, i) => <SmallRock key={i} {...s} />)}
       {chunkData.bushes.map((b, i) => <Bush key={i} {...b} />)}
       <Flowers data={chunkData.flowers} />
       <GrassClumps data={chunkData.grass} />
       <Fireflies position={[x * CHUNK_SIZE, 0, z * CHUNK_SIZE]} />
       <FloatingDust position={[x * CHUNK_SIZE, 0, z * CHUNK_SIZE]} />
    </group>
  )
};

export const InfiniteWorld: React.FC = () => {
    const { camera } = useThree();
    const [chunks, setChunks] = useState<{x: number, z: number}[]>([]);
    const currentChunk = useRef<{x: number, z: number} | null>(null);
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
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[300, 300]} />
            <meshStandardMaterial color="#3f2e22" roughness={1} />
        </mesh>
    )
}
