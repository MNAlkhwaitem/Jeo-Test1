import { Ultimate } from './interfaces';

export enum GameState {
  Login = 'LOGIN',
  Lobby = 'LOBBY',
  PreGame = 'PRE_GAME',
  MidGame = 'MID_GAME',
  EndGame = 'END_GAME',
}

export enum QuestionStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

export interface Player {
  id: string;
  name: string;
  isGameMaster: boolean;
  isReady: boolean;
  score: number;
  ultimate: Ultimate | null;
  ultimateCharge: number; // 0 to 100
  ultimateUses: number;
  activeUltimateName?: string;
}

export interface LobbySettings {
  boardSize: number;
  maxPlayers: number;
  useUltimates: boolean;
  randomizeUltimates: boolean;
  customUltimates: Ultimate[];
}

export interface Question {
  id: string;
  creatorId: string;
  creatorName: string;
  category: string;
  question: string;
  answer: string;
  points: number;
  status: QuestionStatus;
}

export interface BoardCell {
  question: Question | null;
  revealed: boolean;
}
// Created a separate interfaces file to avoid circular dependencies.
export * from './interfaces';
