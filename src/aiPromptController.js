const MODE_ALIASES = {
  ai: ["切换到ai绘图模式", "切换到 ai 绘图模式", "切换到ai模式", "使用ai绘图", "用ai画图"],
  canvas: ["切换到canvas模式", "切换到 canvas 模式", "切换到矢量模式", "使用canvas绘图", "用画布绘图"],
};

const AI_ACTIONS = {
  generate: ["开始生成", "生成图片", "开始画图"],
  regenerate: ["重新生成", "再生成一次", "换一张"],
  undo: ["撤销", "后退一步", "上一步"],
  redo: ["重做", "恢复", "下一步"],
  clear: ["清空画布", "清空", "清屏"],
  save: ["保存图片", "导出图片", "下载图片", "保存", "导出", "下载"],
  cancelDraft: ["取消本次修改", "取消修改", "撤销描述"],
};

function normalize(text) {
  return text.toLowerCase().replace(/[，。！？、,.!?]/g, " ").replace(/\s+/g, " ").trim();
}

function findAlias(text, aliases) {
  return Object.entries(aliases).find(([, words]) => words.some((word) => text.includes(word)))?.[0];
}

export function parseModeCommand(rawText) {
  const mode = findAlias(normalize(rawText), MODE_ALIASES);
  return mode ? { type: "switchMode", mode, rawText } : null;
}

export function parseAiCommand(rawText) {
  const text = normalize(rawText);
  const action = findAlias(text, AI_ACTIONS);
  if (action) return { type: "aiAction", action, rawText };
  return { type: "promptDraft", text: rawText.trim(), rawText };
}

export function isImmediateAiAction(rawText) {
  const command = parseAiCommand(rawText);
  return command.type === "aiAction" && [
    "generate",
    "regenerate",
    "undo",
    "redo",
    "clear",
    "save",
    "cancelDraft",
  ].includes(command.action);
}

export function mergePrompt(basePrompt, addition) {
  const cleanBase = basePrompt.trim();
  const cleanAddition = addition.trim();
  if (!cleanBase) return cleanAddition;
  if (!cleanAddition) return cleanBase;
  return `${cleanBase}；${cleanAddition}`;
}

export function buildGenerationPrompt(prompt) {
  return [
    prompt.trim(),
    "完整构图，高质量数字插画，主体清晰，细节丰富，协调配色，无文字，无水印",
  ].filter(Boolean).join("。");
}
