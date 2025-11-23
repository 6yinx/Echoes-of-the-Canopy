
import React, { useEffect, useRef } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store';

const ThrownRock: React.FC<{ 
    id: string; 
    position: [number, number, number]; 
    velocity: [number, number, number];
}> = ({ id, position, velocity }) => {
    const removeProjectile = useGameStore(state => state.removeProjectile);
    const addDroppedItem = useGameStore(state => state.addDroppedItem);
    
    // Track physics state
    const currentPos = useRef(position);
    const currentVelocity = useRef([0, 0, 0]);
    const currentAngularVelocity = useRef([0, 0, 0]);
    const isSlowingDown = useRef(false);
    
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position: position,
        velocity: velocity,
        args: [0.1], // Radius
        linearDamping: 0.1,
        angularDamping: 0.1,
        material: { friction: 0.5, restitution: 0.4 }
    }));

    // Subscribe to physics updates
    useEffect(() => {
        const unsubPos = api.position.subscribe(v => currentPos.current = v);
        const unsubVel = api.velocity.subscribe(v => currentVelocity.current = v);
        const unsubAngVel = api.angularVelocity.subscribe(v => currentAngularVelocity.current = v);
        
        return () => {
            unsubPos();
            unsubVel();
            unsubAngVel();
        };
    }, [api]);

    // Timers for slowing down and persistence
    useEffect(() => {
        // Start braking after 2 seconds to stop it rolling away
        const slowTimer = setTimeout(() => {
            isSlowingDown.current = true;
        }, 2000);

        // Convert to persistent item after 5 seconds
        const despawnTimer = setTimeout(() => {
            addDroppedItem({ 
                id: Math.random().toString(), 
                position: currentPos.current, 
                type: 'small_rock' 
            });
            removeProjectile(id);
        }, 5000);
        
        return () => {
            clearTimeout(slowTimer);
            clearTimeout(despawnTimer);
        };
    }, [id, removeProjectile, addDroppedItem]);

    // Apply braking physics
    useFrame(() => {
        if (isSlowingDown.current) {
            // Aggressively dampen horizontal velocity (X, Z) to stop rolling
            // Preserve Y velocity so gravity still works if it's falling
            api.velocity.set(
                currentVelocity.current[0] * 0.85,
                currentVelocity.current[1], 
                currentVelocity.current[2] * 0.85
            );
            
            // Aggressively dampen rotation to stop spinning
            api.angularVelocity.set(
                currentAngularVelocity.current[0] * 0.8,
                currentAngularVelocity.current[1] * 0.8,
                currentAngularVelocity.current[2] * 0.8
            );
        }
    });

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#78716c" />
        </mesh>
    );
};

export const ProjectileSystem: React.FC = () => {
    const projectiles = useGameStore(state => state.projectiles);

    return (
        <group>
            {projectiles.map(p => (
                <ThrownRock 
                    key={p.id} 
                    id={p.id} 
                    position={p.position} 
                    velocity={p.velocity} 
                />
            ))}
        </group>
    );
};
