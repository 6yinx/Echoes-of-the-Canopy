import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky, Stars, Loader, KeyboardControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { Player } from './World/Player';
import { Ground, VisualGround, InfiniteWorld, DynamicItems } from './World/Environment';
import { OfficeMap } from './World/OfficeMap';
import { ProjectileSystem } from './World/Projectiles';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { GameState, MapLocation } from '../types';

const EveningAtmosphere = () => {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Static Sun Position for Evening (Sunset)
  const sunPos = new Vector3(100, 20, -100);

  return (
    <>
      {/* Warm/Yellow Ambient Light for visibility */}
      <ambientLight intensity={0.6} color="#d97706" />

      {/* The Main Sun - Golden Yellow */}
      <directionalLight
        ref={sunRef}
        position={sunPos}
        intensity={2.8}
        color="#ffd700" // Bright Gold
        castShadow
        shadow-bias={-0.001}
        shadow-normalBias={0.05}
        shadow-mapSize={[2048, 2048]} // Increased for better quality
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />

      <Sky
        sunPosition={sunPos}
        turbidity={8}
        rayleigh={0.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
        inclination={0.6} // Set inclination for evening effect
        azimuth={0.25}
      />
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      {/* Golden/Brown Fog for Evening Atmosphere */}
      <fog attach="fog" args={['#713f12', 5, 45]} />
    </>
  )
}

const MenuCamera = () => {
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.05;
    state.camera.position.set(Math.sin(t) * 50, 20, Math.cos(t) * 50);
    state.camera.lookAt(0, 5, 0);
  });
  return null;
}

const SceneContent = () => {
  const isPaused = useGameStore((state) => state.isPaused);
  const gameState = useGameStore((state) => state.gameState);
  const currentMap = useGameStore((state) => state.currentMap);

  return (
    <>
      {/* Render atmosphere based on current map */}
      {currentMap === MapLocation.FOREST ? (
        <EveningAtmosphere />
      ) : (
        <OfficeMap />
      )}

      {/* Render Physics when Playing OR Loading OR Intro (to settle) */}
      <Physics gravity={[0, -30, 0]} isPaused={isPaused || gameState === GameState.MENU}>
        {gameState === GameState.MENU ? (
          <MenuCamera />
        ) : (
          <Player />
        )}

        {/* Render environment based on current map */}
        {currentMap === MapLocation.FOREST ? (
          <>
            <Ground />
            <InfiniteWorld />
            <VisualGround />
          </>
        ) : (
          <>
            {/* Office has its own ground in OfficeMap component */}
          </>
        )}

        <DynamicItems />
        <ProjectileSystem />
      </Physics>
    </>
  );
};

export const GameScene: React.FC = () => {
  const setPaused = useGameStore((state) => state.setPaused);
  const setGameState = useGameStore((state) => state.setGameState);
  const gameState = useGameStore((state) => state.gameState);

  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    // Sprint removed
  ];

  // Handle Transition from LOADING to INTRO/PLAYING
  useEffect(() => {
    if (gameState === GameState.LOADING) {
      // Increased wait time to 4 seconds to ensure chunks are generated and physics settled
      const timer = setTimeout(() => {
        const showIntro = useGameStore.getState().showIntro;
        if (showIntro) {
          setGameState(GameState.INTRO);
          setPaused(false); // Ensure we are not paused for the animation
        } else {
          setGameState(GameState.PLAYING);
          // HUD effect will handle locking
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState, setGameState, setPaused]);

  useEffect(() => {
    const handleLockChange = () => {
      const isInventoryOpen = useGameStore.getState().isInventoryOpen;
      const currentState = useGameStore.getState().gameState;
      const showTouchControls = useGameStore.getState().showTouchControls;

      // Allow lock checking even during LOADING/INTRO so that if focus is lost, game pauses
      if (document.pointerLockElement === null) {
        // Don't auto-pause if we are in INTRO (animation playing)
        // Don't auto-pause if Touch Controls are enabled (no lock needed)
        if (!isInventoryOpen && currentState !== GameState.INTRO && !showTouchControls) {
          setPaused(true);
        }
      } else {
        setPaused(false);
      }
    };

    const handleLockError = () => {
      console.warn("Pointer lock failed or was denied");
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('pointerlockerror', handleLockError);

    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('pointerlockerror', handleLockError);
    };
  }, [setPaused]);

  const handleCanvasClick = () => {
    // Fallback: If user clicks canvas while playing but not locked (e.g. after Intro finishes but user didn't move mouse)
    const state = useGameStore.getState();
    if (state.gameState === GameState.PLAYING && !state.isInventoryOpen && !state.isPaused && !state.showTouchControls && !state.mobileInput.throwing) {
      const canvas = document.querySelector('canvas');
      if (canvas && document.pointerLockElement !== canvas) {
        // Safely request lock, catching errors if user exits lock immediately
        (canvas as any).requestPointerLock()?.catch((e: any) => {
          console.warn("Pointer lock failed:", e);
        });
      }
    }
  }

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0 touch-none" onClick={handleCanvasClick}>
      <Canvas shadows camera={{ fov: 75 }}>
        <Suspense fallback={null}>
          <KeyboardControls map={keyboardMap}>
            <SceneContent />
          </KeyboardControls>
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};
