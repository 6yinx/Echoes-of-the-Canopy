
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Euler, Vector2 } from 'three';
import { useSphere } from '@react-three/cannon';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { GameState } from '../../types';

const WALK_SPEED = 10;
const SPRINT_SPEED = 16;
const MOUSE_SENSITIVITY = 0.002;

// --- Held Item Visuals ---

const HeldRock: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
        meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.5) * 0.05;
    });
    return (
        <mesh ref={meshRef} castShadow rotation={[0.2, -0.2, 0]}>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.9} />
        </mesh>
    )
}

const HeldStick: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        groupRef.current.rotation.x = Math.sin(t * 2) * 0.02;
        groupRef.current.rotation.z = Math.cos(t * 1.5) * 0.02;
    });
    return (
        <group ref={groupRef}>
            <group rotation={[Math.PI / 6, 0, -Math.PI / 12]} position={[0, -0.1, 0]}>
                <mesh castShadow position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.015, 0.025, 0.6, 6]} />
                    <meshStandardMaterial color="#5d4037" roughness={1.0} />
                </mesh>
                <mesh position={[0, 0.35, 0.01]} rotation={[0.6, 0.2, 0]}>
                    <cylinderGeometry args={[0.005, 0.01, 0.15, 4]} />
                    <meshStandardMaterial color="#5d4037" roughness={1.0} />
                </mesh>
                <mesh position={[0, 0.05, -0.015]} rotation={[-0.5, -0.5, 0]}>
                    <cylinderGeometry args={[0.005, 0.008, 0.1, 4]} />
                    <meshStandardMaterial color="#5d4037" roughness={1.0} />
                </mesh>
            </group>
        </group>
    )
}

const HeldMushroom: React.FC = () => {
    return (
        <group rotation={[0.5, 0, 0]} position={[0, -0.05, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.04, 0.25, 6]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[0, 0.25, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.15, 0.1, 7]} />
                <meshStandardMaterial color="#991b1b" />
            </mesh>
        </group>
    )
}

const HeldBerry: React.FC<{ color: string }> = ({ color }) => {
    return (
        <group position={[0, 0, 0]}>
            <mesh position={[0, 0.05, 0]} castShadow>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0.04, 0.02, 0.04]} castShadow>
                <sphereGeometry args={[0.04]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[-0.03, 0.06, -0.02]} castShadow>
                <sphereGeometry args={[0.04]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    )
}

const HeldTorch: React.FC = () => {
    return (
        <group rotation={[Math.PI / 6, 0, 0]} position={[0, -0.1, 0]}>
            <mesh castShadow position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
                <meshStandardMaterial color="#451a03" />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
                <dodecahedronGeometry args={[0.06, 0]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, 0.4, 0]} intensity={2} color="#fbbf24" distance={5} decay={2} />
        </group>
    )
}

const HeldSharpRock: React.FC = () => {
    return (
        <mesh rotation={[0, -0.5, 0.5]} position={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.06, 0.2, 4]} />
            <meshStandardMaterial color="#78716c" roughness={0.6} />
        </mesh>
    )
}

const HeldBundle: React.FC = () => {
    return (
        <group rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
            <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4]} /><meshStandardMaterial color="#5d4037" /></mesh>
            <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4]} /><meshStandardMaterial color="#5d4037" /></mesh>
            <mesh position={[0, 0, 0.02]}><cylinderGeometry args={[0.02, 0.02, 0.4]} /><meshStandardMaterial color="#5d4037" /></mesh>
        </group>
    )
}



const Flashlight: React.FC = () => {
    const [target, setTarget] = useState<THREE.Object3D | null>(null);

    return (
        <group>
            {/* Flashlight beam */}
            <spotLight
                position={[0.2, -0.2, 0]}
                angle={0.6}
                penumbra={0.2}
                intensity={100}
                distance={80}
                color="#ffffff"
                castShadow
                target={target || undefined}
            />
            {/* Inner bright core */}
            <spotLight
                position={[0.2, -0.2, 0]}
                angle={0.3}
                penumbra={0.1}
                intensity={150}
                distance={100}
                color="#e0f2fe"
                target={target || undefined}
            />
            {/* Ambient spill */}
            <pointLight position={[0, 0, 0]} intensity={2} distance={5} color="#ffffff" decay={2} />

            {/* Invisible target for spotlight to look at */}
            <object3D ref={setTarget} position={[0, 0, -10]} />
        </group>
    );
};

export const Player: React.FC = () => {
    const { scene, camera, gl } = useThree();

    const isPaused = useGameStore(state => state.isPaused);
    const gameState = useGameStore(state => state.gameState);
    const setGameState = useGameStore(state => state.setGameState);
    const hunger = useGameStore(state => state.hunger);
    const health = useGameStore(state => state.health);
    const stamina = useGameStore(state => state.stamina);
    const isInventoryOpen = useGameStore(state => state.isInventoryOpen);
    const isLanternActive = useGameStore(state => state.isLanternActive);
    const activeSlot = useGameStore(state => state.activeSlot);
    const inventory = useGameStore(state => state.inventory);
    const showTouchControls = useGameStore(state => state.showTouchControls);
    const teleportSignal = useGameStore(state => state.teleportSignal);
    const teleportTarget = useGameStore(state => state.teleportTarget);

    const initialPos = useRef(useGameStore.getState().playerPosition);

    const setPlayerStats = useGameStore(state => state.setPlayerStats);
    const toggleInventory = useGameStore(state => state.toggleInventory);
    const toggleLantern = useGameStore(state => state.toggleLantern);
    const setInteractionText = useGameStore(state => state.setInteractionText);
    const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);
    const addToInventory = useGameStore(state => state.addToInventory);
    const removeFromInventory = useGameStore(state => state.removeFromInventory);
    const addProjectile = useGameStore(state => state.addProjectile);
    const removeDroppedItem = useGameStore(state => state.removeDroppedItem);
    const setActiveSlot = useGameStore(state => state.setActiveSlot);
    const mobileInput = useGameStore(state => state.mobileInput);
    const setMobileInput = useGameStore(state => state.setMobileInput);

    const [sub, get] = useKeyboardControls();

    const [ref, api] = useSphere(() => ({
        mass: 1,
        position: [initialPos.current[0], 2, initialPos.current[2]],
        args: [0.4],
        fixedRotation: true,
        allowSleep: false,
        material: { friction: 0.0, restitution: 0.0 }
    }));

    const velocity = useRef([0, 0, 0]);
    const position = useRef(initialPos.current);
    const cameraState = useRef({ yaw: 0, pitch: 0 });
    const lastStatUpdate = useRef(0);
    const lastPositionSave = useRef(0);
    const heldItemRef = useRef<THREE.Group>(null);

    // Movement Smoothing State
    const smoothedVelocity = useRef(new THREE.Vector3(0, 0, 0));

    // Animation State
    const introTimer = useRef(0);

    // Attack State
    const isAttacking = useRef(false);
    const attackProgress = useRef(0);

    // Sprint State
    const isSprinting = useRef(false);
    const lastForwardPress = useRef(0);
    const wasForwardPressed = useRef(false);

    // Bobbing State
    const bobbingTime = useRef(0);
    const bobbingAmplitude = useRef(0);

    useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);
    useEffect(() => api.position.subscribe((p) => (position.current = p)), [api.position]);

    useEffect(() => {
        const savedPos = useGameStore.getState().playerPosition;
        api.position.set(savedPos[0], Math.max(2, savedPos[1]), savedPos[2]);
    }, []);

    // Handle Teleportation
    useEffect(() => {
        if (teleportSignal > 0) {
            api.position.set(teleportTarget[0], teleportTarget[1], teleportTarget[2]);
            api.velocity.set(0, 0, 0);
        }
    }, [teleportSignal, teleportTarget, api.position, api.velocity]);

    useEffect(() => {
        if (isInventoryOpen) {
            document.exitPointerLock();
        }
    }, [isInventoryOpen]);

    // --- Interaction Logic ---
    const getInteractableFromHit = (hitObject: THREE.Object3D): { data: any, object: THREE.Object3D } | null => {
        let curr: THREE.Object3D | null = hitObject;
        while (curr) {
            if (curr.userData && (curr.userData.type || curr.userData.id)) {
                return { data: curr.userData, object: curr };
            }
            curr = curr.parent;
        }
        return null;
    }

    const performInteraction = (interactable: { data: any, object: THREE.Object3D }) => {
        const { data, object } = interactable;
        const currentHunger = useGameStore.getState().hunger;
        const id = data.id;

        if (data.type === 'mushroom') {
            if (id) {
                addToInventory('mushroom');
                removeDroppedItem(id);
                useGameStore.getState().setNotification("Picked up Mushroom");
            } else {
                setPlayerStats({ hunger: Math.min(100, currentHunger + 15) });
                object.visible = false;
                object.position.y = -500;
                useGameStore.getState().setNotification("Ate Mushroom");
            }
        } else if (data.type === 'door') {
            if (data.onInteract) data.onInteract();
        } else if (data.type === 'stick') {
            addToInventory('stick');
            if (id) {
                removeDroppedItem(id);
            } else {
                object.visible = false;
                object.position.y = -500;
            }
            useGameStore.getState().setNotification("Picked up Stick");
        } else if (data.type === 'small_rock') {
            addToInventory('small_rock');
            if (id) {
                removeDroppedItem(id);
            } else {
                object.visible = false;
                object.position.y = -500;
            }
            useGameStore.getState().setNotification("Picked up Small Rock");
        } else if (data.type === 'red_berry' || data.type === 'blue_berry' || data.type === 'torch' || data.type === 'sharp_rock' || data.type === 'stick_bundle') {
            if (id) {
                addToInventory(data.type);
                removeDroppedItem(id);
                useGameStore.getState().setNotification(`Picked up ${data.type.replace('_', ' ')}`);
            }
        } else if (data.type === 'bush') {
            if (!data.searched) {
                data.searched = true;
                let found = "Nothing found";

                if (data.bushType === 'berry_red') {
                    addToInventory('red_berry');
                    found = "Found Red Berries";
                    useGameStore.getState().setNotification("Harvested Red Berries");
                } else if (data.bushType === 'berry_blue') {
                    addToInventory('blue_berry');
                    found = "Found Blue Berries";
                    useGameStore.getState().setNotification("Harvested Blue Berries");
                } else {
                    if (Math.random() < 0.4) {
                        addToInventory('stick');
                        found = "Found a Stick";
                        useGameStore.getState().setNotification("Found Stick in Bush");
                    } else {
                        useGameStore.getState().setNotification("Bush is empty");
                    }
                }
                data.message = found;
                setTimeout(() => {
                    data.message = null;
                }, 2000);
            }
        }
    };

    const handleInteraction = () => {
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find(i => i.distance < 5);
        if (hit) {
            const result = getInteractableFromHit(hit.object);
            if (result) performInteraction(result);
        }
    };

    const handleTouchInteraction = (clientX: number, clientY: number) => {
        const x = (clientX / window.innerWidth) * 2 - 1;
        const y = -(clientY / window.innerHeight) * 2 + 1;
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find(i => i.distance < 8);
        if (hit) {
            const result = getInteractableFromHit(hit.object);
            if (result) performInteraction(result);
        }
    };

    const handleAction = () => {
        const inv = useGameStore.getState().inventory;
        const slot = useGameStore.getState().activeSlot;
        const activeItem = inv[slot];

        if (activeItem && activeItem.type === 'small_rock') {
            removeFromInventory('small_rock');
            const dir = new Vector3(0, 0, -1);
            dir.applyQuaternion(camera.quaternion);
            const spawnPos = new Vector3(...position.current);
            spawnPos.y += 1.5;
            spawnPos.add(dir.clone().multiplyScalar(0.5));
            const force = 20;
            const vel = dir.multiplyScalar(force);
            addProjectile([spawnPos.x, spawnPos.y, spawnPos.z], [vel.x, vel.y, vel.z]);
        } else {
            if (!isAttacking.current) {
                isAttacking.current = true;
                attackProgress.current = 0;
            }
        }
    }

    // --- Touch Logic (Tap vs Drag) ---
    useEffect(() => {
        let touchId: number | null = null;
        let startX = 0;
        let startY = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;
        let startTime = 0;
        let isDrag = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING) return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.hotbar-slot')) return;

            if (touchId === null) {
                const touch = e.changedTouches[0];
                touchId = touch.identifier;
                startX = touch.clientX;
                startY = touch.clientY;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                startTime = Date.now();
                isDrag = false;
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING) return;
            if (touchId === null) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchId) {
                    const touch = e.changedTouches[i];
                    const moveDist = Math.sqrt(Math.pow(touch.clientX - startX, 2) + Math.pow(touch.clientY - startY, 2));
                    if (moveDist > 30) isDrag = true;

                    const dx = touch.clientX - lastTouchX;
                    const dy = touch.clientY - lastTouchY;
                    const sensitivity = 0.005;
                    cameraState.current.yaw -= dx * sensitivity;
                    cameraState.current.pitch -= dy * sensitivity;
                    cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));

                    lastTouchX = touch.clientX;
                    lastTouchY = touch.clientY;
                    break;
                }
            }
        }

        const handleTouchEnd = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchId) {
                    const endTime = Date.now();
                    const touch = e.changedTouches[i];
                    const moveDist = Math.sqrt(Math.pow(touch.clientX - startX, 2) + Math.pow(touch.clientY - startY, 2));
                    if (!isDrag && (endTime - startTime < 500) && moveDist < 30) {
                        handleTouchInteraction(touch.clientX, touch.clientY);
                    }
                    touchId = null;
                    break;
                }
            }
        }

        const handleTouchCancel = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchId) {
                    touchId = null;
                    break;
                }
            }
        }

        if (showTouchControls) {
            window.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
            window.addEventListener('touchcancel', handleTouchCancel);
        }

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchCancel);
        }
    }, [showTouchControls, isPaused, isInventoryOpen, gameState]);

    // --- Mouse Drag Look ---
    useEffect(() => {
        if (!showTouchControls || isPaused || isInventoryOpen || gameState !== GameState.PLAYING) return;
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        const handleMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            startTime = Date.now();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const sensitivity = 0.005;
            cameraState.current.yaw -= dx * sensitivity;
            cameraState.current.pitch -= dy * sensitivity;
            cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));

            lastX = e.clientX;
            lastY = e.clientY;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                const endTime = Date.now();
                const moveDist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
                if ((endTime - startTime < 500) && moveDist < 10) {
                    handleTouchInteraction(e.clientX, e.clientY);
                }
            }
            isDragging = false;
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [showTouchControls, isPaused, isInventoryOpen, gameState]);

    useEffect(() => {
        if (mobileInput.throwing) {
            handleAction();
            setMobileInput({ throwing: false });
        }
    }, [mobileInput.throwing]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused || gameState !== GameState.PLAYING) return;
            if (e.key === '1') setActiveSlot(0);
            if (e.key === '2') setActiveSlot(1);
            if (e.key === '3') setActiveSlot(2);

            if (e.code === 'KeyE') {
                toggleInventory();
                const state = useGameStore.getState();
                if (!state.isInventoryOpen && !state.showTouchControls) {
                    const canvas = document.querySelector('canvas');
                    if (canvas) (canvas as any).requestPointerLock()?.catch((e: any) => { });
                }
            }

            if (e.code === 'Escape') {
                const state = useGameStore.getState();
                if (state.isInventoryOpen) {
                    toggleInventory();
                    if (!state.showTouchControls) {
                        const canvas = document.querySelector('canvas');
                        if (canvas) (canvas as any).requestPointerLock()?.catch((e: any) => { });
                    }
                }
            }

            if (e.code === 'KeyQ') {
                toggleLantern();
            }
            if (e.code === 'KeyF') {
                handleInteraction();
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING) return;
            if (e.button === 0 && !showTouchControls) {
                handleAction();
            }
        }

        const handleWheel = (e: WheelEvent) => {
            if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING) return;
            const currentSlot = useGameStore.getState().activeSlot;
            let newSlot = currentSlot + (e.deltaY > 0 ? 1 : -1);
            if (newSlot > 2) newSlot = 0;
            if (newSlot < 0) newSlot = 2;
            setActiveSlot(newSlot);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('wheel', handleWheel);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('wheel', handleWheel);
        }
    }, [isPaused, hunger, gameState, isInventoryOpen, showTouchControls]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING || showTouchControls) return;
            cameraState.current.yaw -= e.movementX * MOUSE_SENSITIVITY;
            cameraState.current.pitch -= e.movementY * MOUSE_SENSITIVITY;
            cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [isPaused, isInventoryOpen, gameState, showTouchControls]);

    useFrame((state, delta) => {
        const currentPos = new Vector3(...position.current);

        if (gameState === GameState.INTRO) {
            if (isPaused) return;
            introTimer.current += delta;
            const t = introTimer.current;
            const duration = 11.0;
            api.velocity.set(0, velocity.current[1], 0);
            const lyingOffset = -0.5;
            const sittingOffset = 0.5;
            const standingOffset = 1.2;
            let targetY = currentPos.y + lyingOffset;
            let targetPitch = Math.PI / 2;
            let targetYaw = 0;

            if (t < 2.0) {
                targetY = currentPos.y + lyingOffset;
                targetPitch = Math.PI / 2 - Math.sin(t) * 0.05;
                targetYaw = 0;
            } else if (t >= 2.0 && t < 5.0) {
                const p = (t - 2.0) / 3.0;
                const smoothP = THREE.MathUtils.smoothstep(p, 0, 1);
                targetY = THREE.MathUtils.lerp(currentPos.y + lyingOffset, currentPos.y + sittingOffset, smoothP);
                targetPitch = THREE.MathUtils.lerp(Math.PI / 2, 0, smoothP);
                targetYaw = THREE.MathUtils.lerp(0, 1.2, smoothP);
            } else if (t >= 5.0 && t < 8.0) {
                const p = (t - 5.0) / 3.0;
                const smoothP = THREE.MathUtils.smoothstep(p, 0, 1);
                targetY = currentPos.y + sittingOffset;
                targetPitch = 0 + Math.sin(t * 2) * 0.02;
                targetYaw = THREE.MathUtils.lerp(1.2, -1.2, smoothP);
            } else if (t >= 8.0) {
                const p = Math.min(1, (t - 8.0) / 2.5);
                const smoothP = p * p * (3 - 2 * p);
                targetY = THREE.MathUtils.lerp(currentPos.y + sittingOffset, currentPos.y + standingOffset, smoothP);
                targetPitch = THREE.MathUtils.lerp(0, 0, smoothP);
                targetYaw = THREE.MathUtils.lerp(-1.2, 0, smoothP);
            }

            const pivot = new Vector3(currentPos.x, targetY, currentPos.z);
            const quat = new THREE.Quaternion();
            quat.setFromEuler(new Euler(targetPitch, targetYaw, 0, 'YXZ'));
            state.camera.position.lerp(pivot, 0.1);
            state.camera.quaternion.slerp(quat, 0.1);

            if (t >= duration) {
                setGameState(GameState.PLAYING);
                cameraState.current.pitch = 0;
                cameraState.current.yaw = 0;
                state.camera.position.set(currentPos.x, currentPos.y + standingOffset, currentPos.z);
                state.camera.rotation.set(0, 0, 0);
            }
            return;
        }

        if (isPaused) return;

        const k = get();
        const forwardInput = k.forward || mobileInput.forward;
        const backwardInput = k.backward || mobileInput.backward;
        const leftInput = k.left || mobileInput.left;
        const rightInput = k.right || mobileInput.right;

        if (forwardInput && !wasForwardPressed.current) {
            const now = Date.now();
            if (now - lastForwardPress.current < 300) {
                isSprinting.current = true;
            }
            lastForwardPress.current = now;
        }
        if (!forwardInput) {
            isSprinting.current = false;
        }
        wasForwardPressed.current = forwardInput;

        if (!isInventoryOpen && !showTouchControls) {
            const raycaster = new Raycaster();
            raycaster.setFromCamera(new Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            const hit = intersects.find(i => i.distance < 5);
            let text = null;
            if (hit) {
                const result = getInteractableFromHit(hit.object);
                if (result && result.object.visible) {
                    if (result.data.type === 'mushroom') text = "Press F to Eat";
                    else if (result.data.type === 'door') text = "Press F to Open/Close";
                    else if (result.data.type === 'stick') text = "Press F to Pickup Stick";
                    else if (result.data.type === 'small_rock') text = "Press F to Pickup Rock";
                    else if (result.data.type === 'red_berry' || result.data.type === 'blue_berry') text = "Press F to Pickup Berry";
                    else if (result.data.type === 'torch' || result.data.type === 'sharp_rock' || result.data.type === 'stick_bundle') text = `Press F to Pickup ${result.data.type.replace('_', ' ')}`;
                    else if (result.data.type === 'bush') {
                        if (result.data.message) text = result.data.message;
                        else if (!result.data.searched) text = "Press F to Search Bush";
                        else text = "Empty Bush";
                    }
                }
            }
            setInteractionText(text);
        } else if (showTouchControls) {
            setInteractionText(null);
        }

        const now = state.clock.getElapsedTime();

        if (now - lastStatUpdate.current > 0.1) {
            lastStatUpdate.current = now;
            let newHunger = hunger;
            let newStamina = stamina;
            let newHealth = health;
            newHunger = Math.max(0, hunger - 0.005);
            const isMoving = (forwardInput || backwardInput || leftInput || rightInput);

            if (isSprinting.current && isMoving) {
                newStamina = stamina - 1.5;
                if (newStamina <= 0) {
                    newStamina = 0;
                    isSprinting.current = false;
                }
            } else {
                newStamina = stamina < 100 ? stamina + 1 : 100;
            }

            if (newHealth < 100 && newHunger > 90) {
                newHealth = Math.min(100, newHealth + 0.5);
                newHunger = Math.max(0, newHunger - 0.2);
            }
            if (newHunger <= 0) {
                newHealth = Math.max(0, newHealth - 0.2);
            }

            setPlayerStats({
                hunger: newHunger,
                stamina: Math.max(0, newStamina),
                health: newHealth
            });
        }

        if (now - lastPositionSave.current > 1.0) {
            lastPositionSave.current = now;
            updatePlayerPosition(position.current as [number, number, number]);
        }

        let speed = WALK_SPEED;
        if (isSprinting.current && stamina > 0) speed = SPRINT_SPEED;
        if (hunger === 0) speed *= 0.5;
        if (isInventoryOpen) speed = 0;

        const moveVector = new Vector3(0, 0, 0);
        if (forwardInput) moveVector.z -= 1;
        if (backwardInput) moveVector.z += 1;
        if (leftInput) moveVector.x -= 1;
        if (rightInput) moveVector.x += 1;

        // Movement Smoothing Logic
        const targetVelocity = new Vector3(0, 0, 0);
        if (moveVector.lengthSq() > 0 && !isInventoryOpen) {
            moveVector.normalize();
            moveVector.applyEuler(new Euler(0, cameraState.current.yaw, 0));
            moveVector.multiplyScalar(speed);
            targetVelocity.copy(moveVector);
        }

        // Smoothly interpolate current horizontal velocity towards target velocity
        // A factor of 8.0 with delta gives a quick but smooth acceleration
        const smoothingFactor = 8.0;
        smoothedVelocity.current.x = THREE.MathUtils.lerp(smoothedVelocity.current.x, targetVelocity.x, delta * smoothingFactor);
        smoothedVelocity.current.z = THREE.MathUtils.lerp(smoothedVelocity.current.z, targetVelocity.z, delta * smoothingFactor);

        api.velocity.set(smoothedVelocity.current.x, velocity.current[1], smoothedVelocity.current.z);

        const velocityHorizontal = new THREE.Vector2(velocity.current[0], velocity.current[2]);
        const speedMag = velocityHorizontal.length();
        const isMovingBool = speedMag > 0.5;
        const targetAmp = isMovingBool ? (isSprinting.current ? 0.1 : 0.07) : 0;
        const bobFreq = isSprinting.current ? 18 : 12;
        bobbingAmplitude.current = THREE.MathUtils.lerp(bobbingAmplitude.current, targetAmp, delta * 10);

        if (isMovingBool) {
            bobbingTime.current += delta * bobFreq;
        } else {
            if (bobbingAmplitude.current < 0.01) {
                bobbingTime.current = 0;
            }
        }

        const bobY = Math.sin(bobbingTime.current) * bobbingAmplitude.current;
        const camBaseHeight = 1.2;
        const pivot = new Vector3(currentPos.x, currentPos.y + camBaseHeight + bobY, currentPos.z);
        const quat = new THREE.Quaternion();
        quat.setFromEuler(new Euler(cameraState.current.pitch, cameraState.current.yaw, 0, 'YXZ'));

        // Improved Camera Smoothing
        // Use exponential decay for frame-rate independent smoothing
        // Higher value = tighter follow. 20 is responsive but smooths out physics jitter.
        const camSmoothSpeed = 20;
        state.camera.position.lerp(pivot, 1 - Math.exp(-camSmoothSpeed * delta));
        state.camera.quaternion.slerp(quat, 1 - Math.exp(-camSmoothSpeed * delta));

        if (heldItemRef.current) {
            heldItemRef.current.position.copy(state.camera.position);
            heldItemRef.current.quaternion.copy(state.camera.quaternion);

            let offsetX = 0.4;
            let offsetY = -0.35 + Math.sin(now * 2) * 0.005;
            let offsetZ = -0.5;
            let rotX = 0;
            let rotY = 0;

            if (isAttacking.current) {
                attackProgress.current += delta * 5;
                const prog = attackProgress.current;
                if (prog >= Math.PI) {
                    isAttacking.current = false;
                    attackProgress.current = 0;
                } else {
                    const swing = Math.sin(prog);
                    offsetZ -= swing * 0.4;
                    offsetY += swing * 0.1;
                    rotX = -swing * 0.8;
                    rotY = -swing * 0.5;
                }
            }

            heldItemRef.current.translateX(offsetX);
            heldItemRef.current.translateY(offsetY);
            heldItemRef.current.translateZ(offsetZ);
            heldItemRef.current.rotateX(rotX);
            heldItemRef.current.rotateY(rotY);
        }
    });

    const activeItem = inventory[activeSlot];

    return (
        <>
            <group ref={ref as any}>
                {/* Physics body */}
            </group>

            {/* Flashlight attached to camera view (via heldItemRef which follows camera) */}
            <group ref={heldItemRef}>
                {isLanternActive && <Flashlight />}

                {activeItem?.type === 'small_rock' && <HeldRock />}
                {activeItem?.type === 'stick' && <HeldStick />}
                {activeItem?.type === 'mushroom' && <HeldMushroom />}
                {activeItem?.type === 'red_berry' && <HeldBerry color="#ef4444" />}
                {activeItem?.type === 'blue_berry' && <HeldBerry color="#3b82f6" />}
                {activeItem?.type === 'torch' && <HeldTorch />}
                {activeItem?.type === 'sharp_rock' && <HeldSharpRock />}
                {activeItem?.type === 'stick_bundle' && <HeldBundle />}
            </group>
        </>
    );
};
