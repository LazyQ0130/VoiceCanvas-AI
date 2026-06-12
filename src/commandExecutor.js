export class CommandExecutor {
  constructor({ drawingEngine, historyManager, onToolChange }) {
    this.drawingEngine = drawingEngine;
    this.historyManager = historyManager;
    this.onToolChange = onToolChange;
    this.state = {
      color: "red",
      lineWidth: 4,
    };
  }

  execute(command) {
    if (!command.valid) return { success: false, message: command.message };

    if (command.type === "action") return this.executeAction(command.action);
    if (command.type === "setting") return this.executeSetting(command);
    if (command.type === "composite") return this.executeComposite(command);
    if (command.type === "draw") return this.executeDraw(command);
    return { success: false, message: "无法执行未知指令" };
  }

  executeAction(action) {
    if (action === "clear") {
      this.historyManager.clear();
      return { success: true, message: "画布已清空" };
    }
    if (action === "undo") {
      const changed = this.historyManager.undo();
      return { success: changed, message: changed ? "已撤销上一步" : "已经没有可撤销的操作" };
    }
    if (action === "redo") {
      const changed = this.historyManager.redo();
      return { success: changed, message: changed ? "已重做下一步" : "已经没有可重做的操作" };
    }
    if (action === "save") {
      this.drawingEngine.save();
      return { success: true, message: "图片已导出为 PNG" };
    }
    return { success: false, message: "未知编辑操作" };
  }

  executeSetting({ setting, value }) {
    if (setting === "color") {
      this.state.color = value;
      this.onToolChange(this.state);
      return { success: true, message: `当前颜色已设置为 ${value}` };
    }
    if (setting === "lineWidth") {
      this.state.lineWidth = Math.min(Math.max(value, 1), 30);
      this.onToolChange(this.state);
      return { success: true, message: `当前线宽已设置为 ${this.state.lineWidth}` };
    }
    return { success: false, message: "未知画笔设置" };
  }

  executeDraw(command) {
    const color = command.color ?? this.state.color;
    const lineWidth = this.state.lineWidth;
    const center = this.randomCenter();
    let operation;

    if (command.shape === "line") {
      operation = this.createLine(command, color, lineWidth, center);
    } else if (command.shape === "circle") {
      operation = {
        type: "circle",
        x: command.x ?? center.x,
        y: command.y ?? center.y,
        radius: command.radius ?? 50,
        color,
        lineWidth,
      };
    } else if (command.shape === "rectangle") {
      operation = {
        type: "rectangle",
        x: command.x ?? center.x,
        y: command.y ?? center.y,
        width: command.width ?? 160,
        height: command.height ?? 100,
        color,
        lineWidth,
      };
    } else {
      operation = {
        type: "triangle",
        x: command.x ?? center.x,
        y: command.y ?? center.y,
        size: command.size ?? 120,
        color,
        lineWidth,
      };
    }

    this.historyManager.addGroup({
      label: command.rawText,
      operations: [operation],
    });
    return { success: true, message: `已绘制${this.shapeName(command.shape)}` };
  }

  createLine(command, color, lineWidth, center) {
    if ([command.x1, command.y1, command.x2, command.y2].every(Number.isFinite)) {
      return { type: "line", x1: command.x1, y1: command.y1, x2: command.x2, y2: command.y2, color, lineWidth };
    }
    const half = 90;
    if (command.direction === "horizontal") {
      return { type: "line", x1: center.x - half, y1: center.y, x2: center.x + half, y2: center.y, color, lineWidth };
    }
    if (command.direction === "vertical") {
      return { type: "line", x1: center.x, y1: center.y - half, x2: center.x, y2: center.y + half, color, lineWidth };
    }
    return { type: "line", x1: center.x - half, y1: center.y - half / 2, x2: center.x + half, y2: center.y + half / 2, color, lineWidth };
  }

  executeComposite(command) {
    const operations = command.composite === "房子"
      ? this.createHouse(command.color)
      : command.composite === "笑脸"
        ? this.createSmile(command.color)
        : this.createSun(command.color);

    this.historyManager.addGroup({
      label: `复合图形：${command.composite}`,
      operations,
    });
    return {
      success: true,
      message: `已绘制${command.composite}，拆解并执行 ${operations.length} 个基础操作`,
    };
  }

  createHouse(color = "black") {
    const lineWidth = this.state.lineWidth;
    return [
      { type: "rectangle", x: 480, y: 385, width: 330, height: 240, color, lineWidth },
      { type: "triangle", x: 480, y: 220, size: 390, color: "red", lineWidth },
      { type: "rectangle", x: 480, y: 445, width: 70, height: 120, color: "orange", lineWidth },
      { type: "rectangle", x: 385, y: 355, width: 65, height: 65, color: "blue", lineWidth },
      { type: "rectangle", x: 575, y: 355, width: 65, height: 65, color: "blue", lineWidth },
    ];
  }

  createSmile(color = "orange") {
    const lineWidth = this.state.lineWidth;
    return [
      { type: "circle", x: 480, y: 310, radius: 165, color, lineWidth },
      { type: "circle", x: 425, y: 270, radius: 15, color: "black", fill: "black", lineWidth },
      { type: "circle", x: 535, y: 270, radius: 15, color: "black", fill: "black", lineWidth },
      { type: "arc", x: 480, y: 315, radius: 85, startAngle: 0.2, endAngle: Math.PI - 0.2, color: "red", lineWidth: lineWidth + 2 },
    ];
  }

  createSun(color = "orange") {
    const lineWidth = this.state.lineWidth;
    const operations = [
      { type: "circle", x: 480, y: 310, radius: 105, color, fill: "rgba(255, 204, 0, 0.2)", lineWidth },
    ];
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      operations.push({
        type: "line",
        x1: 480 + Math.cos(angle) * 135,
        y1: 310 + Math.sin(angle) * 135,
        x2: 480 + Math.cos(angle) * 190,
        y2: 310 + Math.sin(angle) * 190,
        color,
        lineWidth,
      });
    }
    return operations;
  }

  randomCenter() {
    return {
      x: 480 + Math.round((Math.random() - 0.5) * 180),
      y: 310 + Math.round((Math.random() - 0.5) * 120),
    };
  }

  shapeName(shape) {
    return { line: "线条", circle: "圆形", rectangle: "矩形", triangle: "三角形" }[shape];
  }
}
