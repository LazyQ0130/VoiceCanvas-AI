export type VoiceState = "idle" | "listening" | "processing" | "executing" | "error";
export type DrawingMode = "canvas" | "ai";

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

export type AiImageVersion = {
  id: string;
  prompt: string;
  imageObjectUrl: string;
  seed: number;
  model: string;
  createdAt: string;
  inferenceMs: number;
};

export type AiHistoryState = {
  versions: AiImageVersion[];
  index: number;
  current: AiImageVersion | null;
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
