const COLOR_ALIASES = {
  red: ["红色", "红的", "红"],
  blue: ["蓝色", "蓝的", "蓝"],
  green: ["绿色", "绿的", "绿"],
  yellow: ["黄色", "黄的", "黄"],
  black: ["黑色", "黑的", "黑"],
  white: ["白色", "白的", "白"],
  purple: ["紫色", "紫的", "紫"],
  orange: ["橙色", "橙的", "橙"],
};

const SHAPE_ALIASES = {
  circle: ["圆圈", "圆形", "圆"],
  rectangle: ["长方形", "矩形", "方形"],
  line: ["横线", "竖线", "直线", "线"],
  triangle: ["三角形", "三角"],
};

const ACTION_ALIASES = {
  clear: ["清空画布", "清空", "清屏", "擦掉"],
  undo: ["后退一步", "上一步", "撤销"],
  redo: ["下一步", "重做", "恢复"],
  save: ["保存图片", "导出图片", "下载图片", "保存", "导出", "下载"],
};

const CHINESE_DIGITS = {
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

function chineseToNumber(text) {
  if (/^\d+$/.test(text)) return Number(text);
  if (text === "十") return 10;

  let total = 0;
  let current = 0;
  for (const character of text) {
    if (character === "百") {
      current = (current || 1) * 100;
      total += current;
      current = 0;
    } else if (character === "十") {
      current = (current || 1) * 10;
      total += current;
      current = 0;
    } else if (character in CHINESE_DIGITS) {
      current = CHINESE_DIGITS[character];
    }
  }
  return total + current;
}

function extractNumbers(text) {
  return [...text.matchAll(/\d+|[零一二两三四五六七八九十百]+/g)].map((match) =>
    chineseToNumber(match[0]),
  );
}

function findAlias(text, aliases) {
  return Object.entries(aliases).find(([, words]) => words.some((word) => text.includes(word)))?.[0];
}

function extractColor(text) {
  return findAlias(text, COLOR_ALIASES);
}

function extractShape(text) {
  return findAlias(text, SHAPE_ALIASES);
}

export class CommandParser {
  parse(rawText) {
    const text = rawText.replace(/[，。！？、]/g, "").replace(/\s+/g, " ").trim();
    if (!text) return this.invalid("没有识别到有效内容");

    const action = findAlias(text, ACTION_ALIASES);
    if (action) return { valid: true, type: "action", action, rawText };

    if (text.includes("设置颜色") || text.includes("颜色为") || text.includes("换成")) {
      const color = extractColor(text);
      return color
        ? { valid: true, type: "setting", setting: "color", value: color, rawText }
        : this.invalid("没有识别到要设置的颜色", rawText);
    }

    if (text.includes("设置线宽") || text.includes("线宽为") || text.includes("线条粗细")) {
      const [lineWidth] = extractNumbers(text);
      return lineWidth
        ? { valid: true, type: "setting", setting: "lineWidth", value: lineWidth, rawText }
        : this.invalid("没有识别到线宽数值", rawText);
    }

    const composite = ["房子", "笑脸", "太阳"].find((item) => text.includes(item));
    if (composite) {
      return {
        valid: true,
        type: "composite",
        composite,
        color: extractColor(text),
        rawText,
      };
    }

    const shape = extractShape(text);
    if (!shape) return this.invalid("暂时无法理解这条指令，请参考下方示例", rawText);

    const command = {
      valid: true,
      type: "draw",
      shape,
      color: extractColor(text),
      rawText,
    };

    if (shape === "line") this.parseLine(text, command);
    if (shape === "circle") this.parseCircle(text, command);
    if (shape === "rectangle") this.parseRectangle(text, command);
    if (shape === "triangle") this.parseTriangle(text, command);
    return command;
  }

  parseLine(text, command) {
    const numbers = extractNumbers(text);
    if (text.includes("从") && text.includes("到") && numbers.length >= 4) {
      [command.x1, command.y1, command.x2, command.y2] = numbers;
    }
    command.direction = text.includes("横线") ? "horizontal" : text.includes("竖线") ? "vertical" : "diagonal";
  }

  parseCircle(text, command) {
    const positionMatch = this.matchPosition(text);
    if (positionMatch) {
      command.x = chineseToNumber(positionMatch[1]);
      command.y = chineseToNumber(positionMatch[2]);
    }
    const radiusMatch = text.match(/半径\s*(?:为)?\s*(\d+|[零一二两三四五六七八九十百]+)/);
    if (radiusMatch) command.radius = chineseToNumber(radiusMatch[1]);
  }

  parseRectangle(text, command) {
    const positionMatch = this.matchPosition(text);
    if (positionMatch) {
      command.x = chineseToNumber(positionMatch[1]);
      command.y = chineseToNumber(positionMatch[2]);
    }
    const sizeMatch = text.match(/宽\s*(?:为)?\s*(\d+|[零一二两三四五六七八九十百]+)\s*高\s*(?:为)?\s*(\d+|[零一二两三四五六七八九十百]+)/);
    if (sizeMatch) {
      command.width = chineseToNumber(sizeMatch[1]);
      command.height = chineseToNumber(sizeMatch[2]);
    }
  }

  parseTriangle(text, command) {
    const positionMatch = this.matchPosition(text);
    if (positionMatch) {
      command.x = chineseToNumber(positionMatch[1]);
      command.y = chineseToNumber(positionMatch[2]);
    }
    const sizeMatch = text.match(/大小\s*(?:为)?\s*(\d+|[零一二两三四五六七八九十百]+)/);
    if (sizeMatch) command.size = chineseToNumber(sizeMatch[1]);
  }

  matchPosition(text) {
    const number = "(\\d+|[零一二两三四五六七八九十百]+)";
    return text.match(new RegExp(`在\\s*${number}[\\s,，]+${number}\\s*画`));
  }

  invalid(message, rawText = "") {
    return { valid: false, type: "invalid", message, rawText };
  }
}
