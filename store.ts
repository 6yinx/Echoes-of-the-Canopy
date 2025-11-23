import { create } from 'zustand';
import { GameState, NarrativeLog } from './types';

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface DroppedItem {
    id: string;
    position: [number, number, number];
    type: string;
}

export interface InventoryItem {
    type: string;
    count: number;
}

export interface MobileInputState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
    throwing: boolean; // 'throw' is reserved
}

interface GameStore {
  gameState: GameState;
  logs: NarrativeLog[];
  isProcessingAI: boolean;
  nearbyInteractableId: string | null;
  interactionText: string | null;
  
  isPaused: boolean;
  isInventoryOpen: boolean;
  isLanternActive: boolean;
  showIntro: boolean;
  showTouchControls: boolean;
  
  // Feedback
  notification: string | null;
  
  // Player Stats
  health: number;
  hunger: number;
  stamina: number;
  playerPosition: [number, number, number];
  inventory: InventoryItem[]; // Updated to support stacking
  activeSlot: number; // 0, 1, 2 (Hotbar slots)
  
  // Controls
  mobileInput: MobileInputState;
  
  // Projectiles
  projectiles: Projectile[];
  
  // Dropped Items (Reusable thrown rocks)
  droppedItems: DroppedItem[];

  // Environment Stats
  timeOfDay: number; 

  // Teleportation
  teleportSignal: number;
  teleportTarget: [number, number, number];

  // Actions
  setGameState: (state: GameState) => void;
  addLog: (text: string, speaker?: 'Narrator' | 'Self') => void;
  setNearbyInteractable: (id: string | null) => void;
  setInteractionText: (text: string | null) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  toggleInventory: () => void;
  toggleLantern: () => void;
  setPlayerStats: (stats: Partial<{ health: number, hunger: number, stamina: number }>) => void;
  updatePlayerPosition: (pos: [number, number, number]) => void;
  
  // Inventory Actions
  addToInventory: (itemType: string, amount?: number) => void;
  removeFromInventory: (itemType: string, amount?: number) => void;
  hasItem: (itemType: string, amount?: number) => boolean;
  setActiveSlot: (index: number) => void;
  
  setShowIntro: (show: boolean) => void;
  toggleTouchControls: () => void;
  setNotification: (text: string | null) => void;
  
  // Input Actions
  setMobileInput: (input: Partial<MobileInputState>) => void;

  addProjectile: (pos: [number, number, number], vel: [number, number, number]) => void;
  removeProjectile: (id: string) => void;
  
  addDroppedItem: (item: DroppedItem) => void;
  removeDroppedItem: (id: string) => void;

  teleportPlayer: (pos: [number, number, number]) => void;
  
  // Save/Load/Reset
  saveGame: () => void;
  loadGame: () => boolean;
  hasSaveFile: () => boolean;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MENU,
  logs: [],
  isProcessingAI: false,
  nearbyInteractableId: null,
  interactionText: null,
  isPaused: true,
  isInventoryOpen: false,
  isLanternActive: false, 
  showIntro: false,
  showTouchControls: false,
  notification: null,
  
  health: 100,
  hunger: 100,
  stamina: 100,
  playerPosition: [0, 0.5, 0], 
  timeOfDay: 0.24, 
  inventory: [],
  activeSlot: 0,
  projectiles: [],
  droppedItems: [],
  
  mobileInput: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      throwing: false
  },

  teleportSignal: 0,
  teleportTarget: [0, 0, 0],

  setGameState: (state) => set({ gameState: state }),
  
  addLog: (text, speaker = 'Narrator') => set((state) => ({
    logs: [...state.logs, { id: Date.now().toString(), text, speaker, timestamp: Date.now() }].slice(-5)
  })),

  setNearbyInteractable: (id) => set({ nearbyInteractableId: id }),
  
  setInteractionText: (text) => set({ interactionText: text }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  setPaused: (paused) => set((state) => ({ isPaused: paused })),
  
  toggleInventory: () => set((state) => ({ isInventoryOpen: !state.isInventoryOpen })),
  
  toggleLantern: () => set((state) => ({ isLanternActive: !state.isLanternActive })),

  setPlayerStats: (stats) => set((state) => ({
    health: stats.health !== undefined ? Math.max(0, Math.min(100, stats.health)) : state.health,
    hunger: stats.hunger !== undefined ? Math.max(0, Math.min(100, stats.hunger)) : state.hunger,
    stamina: stats.stamina !== undefined ? Math.max(0, Math.min(100, stats.stamina)) : state.stamina,
  })),
  
  updatePlayerPosition: (pos) => set({ playerPosition: pos }),

  addToInventory: (itemType, amount = 1) => set((state) => {
      const newInv = [...state.inventory];
      const existingItemIndex = newInv.findIndex(i => i.type === itemType);
      
      if (existingItemIndex > -1) {
          newInv[existingItemIndex].count += amount;
      } else {
          newInv.push({ type: itemType, count: amount });
      }
      return { inventory: newInv };
  }),

  removeFromInventory: (itemType, amount = 1) => set((state) => {
      const newInv = [...state.inventory];
      const index = newInv.findIndex(i => i.type === itemType);
      
      if (index > -1) {
          if (newInv[index].count > amount) {
              newInv[index].count -= amount;
          } else {
              newInv.splice(index, 1);
          }
          return { inventory: newInv };
      }
      return state;
  }),
  
  hasItem: (itemType, amount = 1) => {
      const item = get().inventory.find(i => i.type === itemType);
      return item ? item.count >= amount : false;
  },

  setActiveSlot: (index) => set({ activeSlot: index }),
  
  setShowIntro: (show) => set({ showIntro: show }),
  toggleTouchControls: () => set((state) => ({ showTouchControls: !state.showTouchControls })),
  setNotification: (text) => set({ notification: text }),
  
  setMobileInput: (input) => set((state) => ({
      mobileInput: { ...state.mobileInput, ...input }
  })),

  addProjectile: (pos, vel) => set((state) => ({
      projectiles: [...state.projectiles, { id: Math.random().toString(), position: pos, velocity: vel }]
  })),

  removeProjectile: (id) => set((state) => ({
      projectiles: state.projectiles.filter(p => p.id !== id)
  })),

  addDroppedItem: (item) => set((state) => ({
      droppedItems: [...state.droppedItems, item]
  })),

  removeDroppedItem: (id) => set((state) => ({
      droppedItems: state.droppedItems.filter(i => i.id !== id)
  })),

  teleportPlayer: (pos) => set((state) => ({ 
      teleportSignal: state.teleportSignal + 1, 
      teleportTarget: pos 
  })),

  saveGame: () => {
      const state = get();
      const saveData = {
          health: state.health,
          hunger: state.hunger,
          stamina: state.stamina,
          playerPosition: state.playerPosition,
          timeOfDay: state.timeOfDay,
          isLanternActive: state.isLanternActive,
          inventory: state.inventory,
          activeSlot: state.activeSlot,
          droppedItems: state.droppedItems,
          showTouchControls: state.showTouchControls
      };
      localStorage.setItem('echoes_save_v1', JSON.stringify(saveData));
      console.log("Game Saved");
  },

  loadGame: () => {
      const saveString = localStorage.getItem('echoes_save_v1');
      if (!saveString) return false;
      
      try {
          const data = JSON.parse(saveString);
          set({
              health: data.health,
              hunger: data.hunger,
              stamina: data.stamina,
              playerPosition: data.playerPosition,
              timeOfDay: 0.24,
              isLanternActive: data.isLanternActive,
              inventory: data.inventory || [],
              activeSlot: data.activeSlot || 0,
              droppedItems: data.droppedItems || [],
              showTouchControls: data.showTouchControls || false,
              gameState: GameState.PLAYING,
              isPaused: false
          });
          return true;
      } catch (e) {
          console.error("Failed to load save", e);
          return false;
      }
  },
  
  hasSaveFile: () => !!localStorage.getItem('echoes_save_v1'),
  
  resetGame: () => set({
      gameState: GameState.MENU,
      health: 100,
      hunger: 100,
      stamina: 100,
      playerPosition: [0, 0.5, 0],
      timeOfDay: 0.24,
      inventory: [],
      activeSlot: 0,
      projectiles: [],
      droppedItems: [],
      isLanternActive: false,
      notification: null,
      isPaused: true,
      isInventoryOpen: false,
      teleportSignal: 0
  })
}));