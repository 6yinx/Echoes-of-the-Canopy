export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED'
}

export interface InteractableObject {
  id: string;
  position: [number, number, number];
  type: 'rock' | 'tree' | 'ruin' | 'flower';
  name: string;
  viewed: boolean;
}

export interface NarrativeLog {
  id: string;
  speaker: 'Narrator' | 'Self';
  text: string;
  timestamp: number;
}