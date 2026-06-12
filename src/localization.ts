const textMap: Record<string, string> = {
  valid: "有效",
  type: "类型",
  shape: "形状",
  color: "颜色",
  rawText: "原始文本",
  direction: "方向",
  action: "操作",
  setting: "设置项",
  value: "值",
  composite: "复合图形",
  message: "提示",
  draw: "绘制",
  setting_command: "画笔设置",
  composite_command: "复合绘图",
  action_command: "编辑操作",
  invalid: "无效指令",
  line: "线条",
  circle: "圆形",
  rectangle: "矩形",
  triangle: "三角形",
  arc: "圆弧",
  red: "红色",
  blue: "蓝色",
  green: "绿色",
  yellow: "黄色",
  black: "黑色",
  white: "白色",
  purple: "紫色",
  orange: "橙色",
  horizontal: "横向",
  vertical: "纵向",
  diagonal: "斜向",
  clear: "清空",
  undo: "撤销",
  redo: "重做",
  save: "保存",
  lineWidth: "线宽",
  true: "是",
  false: "否",
};

export function localizeText(value: unknown): string {
  return textMap[String(value)] ?? String(value);
}

export function localizeCommand(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(localizeCommand);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        localizeText(key),
        localizeCommand(item),
      ]),
    );
  }
  return typeof value === "string" || typeof value === "boolean" ? localizeText(value) : value;
}
