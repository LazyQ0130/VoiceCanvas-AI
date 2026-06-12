export type VoiceState = "idle" | "listening" | "processing" | "executing" | "error";

export type DrawOperation = {
  type: "line" | "circle" | "rectangle" | "triangle" | "arc";
  color?: string;
  lineWidth?: number;
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
};

export type ToolState = {
  color: string;
  lineWidth: number;
};
