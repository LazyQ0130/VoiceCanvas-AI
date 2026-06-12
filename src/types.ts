export type VoiceState = "idle" | "listening" | "processing" | "executing" | "error";

export type DrawOperation = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  color?: string;
  lineWidth?: number;
  style: string;
  createdAt: string;
  [key: string]: unknown;
};

export type OperationGroup = {
  label: string;
  operations: DrawOperation[];
};

export type CommandHistoryItem = {
  id: number;
  command: string;
  result: string;
  time: string;
  operationCount: number;
  keywords?: string[];
};

export type ToolState = {
  color: string;
  lineWidth: number;
  style: string;
  scene: string;
  time: string;
  weather: string;
  tone: string;
  keywords: string[];
};
