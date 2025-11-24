export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED'
}

export enum MapLocation {
  FOREST = 'FOREST',
  OFFICE = 'OFFICE'
}

export interface InteractableObject {
  id: string;
  position: [number, number, number];
  type: 'rock' | 'tree' | 'ruin' | 'flower' | 'portal';
  name: string;
  viewed: boolean;
  targetMap?: MapLocation; // For portals
}

export interface NarrativeLog {
  id: string;
  speaker: 'Narrator' | 'Self';
  text: string;
  timestamp: number;
}