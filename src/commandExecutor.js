import { createScene } from "./sceneFactory.js";
import { layoutObjects } from "./layoutEngine.js";
import { OBJECT_LIBRARY, objectLabels, SCENE_PRESETS } from "./objectLibrary.js";
import { getStylePreset } from "./styleSystem.js";

export class CommandExecutor {
  constructor({ drawingEngine, historyManager, onToolChange }) {
    this.drawingEngine = drawingEngine;
    this.historyManager = historyManager;
    this.onToolChange = onToolChange;
    this.nextObjectId = 1;
    this.state = { color: "red", lineWidth: 4, style: "default", scene: "custom", time: "day", weather: "clear", tone: "normal", keywords: [] };
  }

  execute(command) {
    if (!command.valid) return { success: false, message: command.message, operationCount: 0 };
    if (command.type === "action") return this.executeAction(command.action);
    if (command.type === "setting") return this.executeSetting(command);
    if (command.type === "style") return this.executeStyle(command.style);
    if (command.type === "compose") return this.executeCompose(command);
    if (command.type === "append") return this.executeAppend(command);
    if (command.type === "enrich") return this.executeEnrich(command);
    if (command.type === "adjust") return this.executeAdjustment(command);
    if (command.type === "edit") return this.executeEdit(command);
    if (command.type === "scene") return this.executeScene(command);
    if (command.type === "composite") return this.executeComposite(command);
    if (command.type === "draw") return this.executeDraw(command);
    return { success: false, message: "无法执行未知指令", operationCount: 0 };
  }

  executeAction(action) {
    if (action === "clear") {
      this.historyManager.clear();
      return { success: true, message: "画布已清空", operationCount: 0 };
    }
    if (action === "undo") {
      const changed = this.historyManager.undo();
      return { success: changed, message: changed ? "已撤销上一步" : "已经没有可撤销的操作", operationCount: 0 };
    }
    if (action === "redo") {
      const changed = this.historyManager.redo();
      return { success: changed, message: changed ? "已重做下一步" : "已经没有可重做的操作", operationCount: 0 };
    }
    if (action === "save") {
      this.drawingEngine.save();
      return { success: true, message: "图片已导出为 PNG", operationCount: 0 };
    }
    return { success: false, message: "未知编辑操作", operationCount: 0 };
  }

  executeSetting({ setting, value }) {
    if (setting === "color") {
      this.state.color = value;
      this.notifyToolChange();
      return { success: true, message: `当前颜色已设置为 ${value}`, operationCount: 0 };
    }
    if (setting === "lineWidth") {
      this.state.lineWidth = Math.min(Math.max(value, 1), 30);
      this.notifyToolChange();
      return { success: true, message: `当前线宽已设置为 ${this.state.lineWidth}`, operationCount: 0 };
    }
    return { success: false, message: "未知画笔设置", operationCount: 0 };
  }

  executeStyle(style) {
    const preset = getStylePreset(style);
    this.state.style = style;
    this.state.lineWidth = preset.lineWidth;
    this.state.color = preset.palette[0];
    this.notifyToolChange();
    const groups = this.historyManager.operations;
    let updatedCount = 0;
    if (groups.some((group) => group.operations.length)) {
      const nextGroups = groups.map((group) => ({
        ...group,
        operations: group.operations.map((object) => {
          updatedCount += 1;
          return {
            ...object,
            style,
            lineWidth: preset.lineWidth,
            shadowBlur: preset.shadowBlur,
            opacity: object.type === "toneOverlay" ? object.opacity : preset.opacity,
            jitter: preset.jitter ?? 0,
            palette: object.type === "libraryObject" ? preset.palette : object.palette,
            colors: object.type === "gradientBackground" ? preset.background : object.colors,
          };
        }),
      }));
      this.historyManager.replaceOperations(nextGroups);
    }
    return { success: true, message: `已切换为${preset.name}${updatedCount ? `，更新 ${updatedCount} 个对象` : ""}`, operationCount: updatedCount, keywords: [preset.name], generatedObjects: [] };
  }

  executeDraw(command) {
    const color = command.color ?? this.state.color;
    const center = this.randomCenter();
    let operation;
    if (command.shape === "line") operation = this.createLine(command, color, center);
    else if (command.shape === "circle") operation = { type: "circle", x: command.x ?? center.x, y: command.y ?? center.y, radius: command.radius ?? 50, color };
    else if (command.shape === "rectangle") operation = { type: "rectangle", x: command.x ?? center.x, y: command.y ?? center.y, width: command.width ?? 160, height: command.height ?? 100, color };
    else operation = { type: "triangle", x: command.x ?? center.x, y: command.y ?? center.y, size: command.size ?? 120, color };

    const object = this.makeObject(operation.type, this.shapeName(command.shape), operation);
    this.historyManager.addGroup({ label: command.rawText, operations: [object] });
    return { success: true, message: `已绘制${object.label}`, operationCount: 1, recentObject: object };
  }

  executeComposite(command) {
    const rawOperations = command.composite === "房子"
      ? this.createHouse(command.color)
      : command.composite === "笑脸" ? this.createSmile(command.color) : this.createSun(command.color);
    const operations = rawOperations.map((operation, index) =>
      this.makeObject(operation.type, `${command.composite}组件 ${index + 1}`, operation));
    this.historyManager.addGroup({ label: `复合图形：${command.composite}`, operations });
    return { success: true, message: `已绘制${command.composite}，拆解为 ${operations.length} 个对象`, operationCount: operations.length, recentObject: operations.at(-1) };
  }

  executeScene(command) {
    const preset = getStylePreset(this.state.style);
    const operations = createScene(command.scene, {
      preset,
      make: (type, label, values) => this.makeObject(type, label, values),
    });
    if (!operations.length) return { success: false, message: "暂时无法生成这个场景", operationCount: 0 };
    const sceneName = { nightCity: "夜晚城市", starrySky: "宇宙星空", sunsetBeach: "海边日落", forest: "森林", robot: "可爱机器人" }[command.scene];
    this.state.scene = command.scene;
    this.state.time = command.scene === "nightCity" || command.scene === "starrySky" ? "night" : command.scene === "sunsetBeach" ? "sunset" : "day";
    this.state.weather = "clear";
    this.state.keywords = [sceneName];
    this.notifyToolChange();
    this.historyManager.addGroup({ label: `高级场景：${sceneName}`, operations });
    return { success: true, message: `已生成${sceneName}，拆解为 ${operations.length} 个稳定对象`, operationCount: operations.length, recentObject: operations.at(-1), keywords: [sceneName], generatedObjects: operations.map((item) => item.label) };
  }

  executeCompose(command) {
    if (command.style) {
      const stylePreset = getStylePreset(command.style);
      this.state.style = command.style;
      this.state.lineWidth = stylePreset.lineWidth;
      this.state.color = stylePreset.palette[0];
    }
    const preset = SCENE_PRESETS[command.scene] ?? { label: "自定义场景", objects: [] };
    const contextualObjects = [
      ...(command.time === "night" ? ["moon", "stars"] : []),
      ...(command.time === "sunset" ? ["sun"] : []),
      ...(command.weather === "rain" ? ["cloud", "rain"] : []),
      ...(command.weather === "snow" ? ["snow"] : []),
    ];
    const keys = [...new Set([...command.objects, ...(preset.objects ?? []), ...contextualObjects])];
    if (!keys.length) return { success: false, message: "没有识别到可绘制的场景素材，请尝试说出太阳、房子、树等元素", operationCount: 0 };

    this.state.scene = command.scene;
    this.state.time = command.time;
    this.state.weather = command.weather;
    this.state.keywords = [...new Set([preset.label, ...objectLabels(command.objects), this.timeName(command.time), this.weatherName(command.weather)].filter(Boolean))];
    this.notifyToolChange();

    const operations = [
      this.makeObject("gradientBackground", `${preset.label ?? "自定义"}背景`, { colors: this.backgroundFor(command), layer: "background" }),
      ...this.createLibraryObjects(keys, command),
    ];
    this.historyManager.addGroup({ label: `组合场景：${preset.label ?? "自定义场景"}`, operations });
    return {
      success: true,
      message: `识别关键词：${this.state.keywords.join("、")}；组合生成 ${operations.length} 个图层对象`,
      operationCount: operations.length,
      recentObject: operations.at(-1),
      keywords: this.state.keywords,
      generatedObjects: operations.map((item) => item.label),
    };
  }

  executeAppend(command) {
    const operations = this.createLibraryObjects(command.objects, this.state);
    if (!operations.length) return { success: false, message: "没有识别到可以追加的素材", operationCount: 0 };
    const labels = objectLabels(command.objects);
    this.state.keywords = labels;
    this.notifyToolChange();
    this.historyManager.addGroup({ label: `追加素材：${labels.join("、")}`, operations });
    return {
      success: true,
      message: `已追加${labels.join("、")}，生成 ${operations.length} 个对象`,
      operationCount: operations.length,
      recentObject: operations.at(-1),
      keywords: labels,
      generatedObjects: operations.map((item) => item.label),
    };
  }

  executeEnrich() {
    const choices = {
      nightCity: ["stars", "car"],
      starrySky: ["stars", "planet"],
      sunsetBeach: ["bird", "boat"],
      forest: ["flower", "cloud"],
      campus: ["flower", "balloon", "person"],
      park: ["flower", "balloon", "bird"],
      beach: ["bird", "boat"],
      city: ["car", "cloud"],
      space: ["stars", "planet"],
      custom: this.state.time === "night" ? ["stars"] : ["cloud", "flower"],
    };
    return this.executeAppend({ objects: choices[this.state.scene] ?? choices.custom });
  }

  executeAdjustment(command) {
    const overlays = {
      brighter: { color: "#ffffff", opacity: 0.16, label: "提亮滤镜" },
      darker: { color: "#020617", opacity: 0.22, label: "暗化滤镜" },
      warmer: { color: "#fb923c", opacity: 0.14, label: "暖色滤镜" },
      cooler: { color: "#38bdf8", opacity: 0.13, label: "冷色滤镜" },
    };
    const overlay = overlays[command.adjustment];
    this.state.tone = command.adjustment;
    this.notifyToolChange();
    const operation = this.makeObject("toneOverlay", overlay.label, { x: 480, y: 310, width: 960, height: 620, fill: overlay.color, color: overlay.color, opacity: overlay.opacity, layer: "front" });
    this.historyManager.addGroup({ label: overlay.label, operations: [operation] });
    return { success: true, message: `已应用${overlay.label}`, operationCount: 1, recentObject: operation, keywords: [overlay.label], generatedObjects: [overlay.label] };
  }

  createLibraryObjects(keys, context) {
    const preset = getStylePreset(this.state.style);
    return layoutObjects(keys, context).map((slot) => this.makeObject("libraryObject", slot.label, {
      ...slot,
      objectType: slot.key,
      palette: preset.palette,
      color: preset.palette[0],
      layer: slot.layer,
    }));
  }

  backgroundFor(command) {
    if (command.time === "night" || command.scene === "space") return ["#020617", "#312e81"];
    if (command.time === "sunset") return ["#7c3aed", "#fb7185", "#fbbf24"];
    if (command.weather === "rain") return ["#475569", "#94a3b8"];
    if (command.weather === "snow") return ["#dbeafe", "#f8fafc"];
    return getStylePreset(this.state.style).background;
  }

  executeEdit(command) {
    const groups = this.historyManager.operations;
    let groupIndex = groups.length - 1;
    while (groupIndex >= 0 && groups[groupIndex].operations.length === 0) groupIndex -= 1;
    if (groupIndex < 0) return { success: false, message: "画布上还没有可编辑的图形", operationCount: 0 };

    const targetGroup = groups[groupIndex];
    const target = targetGroup.operations.at(-1);
    if (!target) return { success: false, message: "没有找到最后一个图形", operationCount: 0 };
    const nextGroups = groups.map((group) => ({ ...group, operations: [...group.operations] }));

    if (command.operation === "delete") {
      nextGroups[groupIndex].operations = targetGroup.operations.slice(0, -1);
      this.historyManager.replaceOperations(nextGroups);
      return { success: true, message: `已删除${target.label}`, operationCount: 0 };
    }

    if (command.operation === "duplicate") {
      const copy = this.makeObject(target.type, `${target.label}副本`, target);
      copy.label = `${target.label}副本`;
      this.moveObject(copy, 30, 30);
      nextGroups[groupIndex].operations.push(copy);
      this.historyManager.replaceOperations(nextGroups);
      return { success: true, message: `已复制${target.label}`, operationCount: 1, recentObject: copy };
    }

    const edited = { ...target };
    if (command.operation === "setColor") {
      edited.color = command.color;
      if (edited.fill && edited.type !== "gradientBackground") edited.fill = command.color;
    } else if (command.operation.startsWith("scale")) {
      this.scaleObject(edited, command.operation === "scaleUp" ? 1.2 : 0.82);
    } else {
      const offsets = { moveLeft: [-30, 0], moveRight: [30, 0], moveUp: [0, -30], moveDown: [0, 30] };
      this.moveObject(edited, ...(offsets[command.operation] ?? [0, 0]));
    }
    nextGroups[groupIndex].operations[nextGroups[groupIndex].operations.length - 1] = edited;
    this.historyManager.replaceOperations(nextGroups);
    return { success: true, message: `已修改${target.label}`, operationCount: 1, recentObject: edited };
  }

  makeObject(type, label, values = {}) {
    const preset = getStylePreset(this.state.style);
    const { id: _oldId, createdAt: _oldCreatedAt, label: _oldLabel, type: _oldType, ...cleanValues } = values;
    const x = cleanValues.x ?? this.midpoint(cleanValues.x1, cleanValues.x2, 480);
    const y = cleanValues.y ?? this.midpoint(cleanValues.y1, cleanValues.y2, 310);
    return {
      id: `对象-${this.nextObjectId++}`,
      type,
      label,
      x,
      y,
      color: cleanValues.color ?? this.state.color,
      lineWidth: cleanValues.lineWidth ?? preset.lineWidth ?? this.state.lineWidth,
      style: this.state.style,
      shadowBlur: cleanValues.shadowBlur ?? preset.shadowBlur,
      opacity: cleanValues.opacity ?? preset.opacity,
      jitter: cleanValues.jitter ?? preset.jitter ?? 0,
      pixelated: cleanValues.pixelated ?? preset.pixelated ?? false,
      createdAt: new Date().toISOString(),
      ...cleanValues,
    };
  }

  createLine(command, color, center) {
    if ([command.x1, command.y1, command.x2, command.y2].every(Number.isFinite)) return { type: "line", x1: command.x1, y1: command.y1, x2: command.x2, y2: command.y2, color };
    const half = 90;
    if (command.direction === "horizontal") return { type: "line", x1: center.x - half, y1: center.y, x2: center.x + half, y2: center.y, color };
    if (command.direction === "vertical") return { type: "line", x1: center.x, y1: center.y - half, x2: center.x, y2: center.y + half, color };
    return { type: "line", x1: center.x - half, y1: center.y - half / 2, x2: center.x + half, y2: center.y + half / 2, color };
  }

  scaleObject(object, factor) {
    ["width", "height", "radius", "size", "amplitude"].forEach((key) => {
      if (Number.isFinite(object[key])) object[key] *= factor;
    });
    if (object.points) object.points = object.points.map(([x, y]) => [object.x + (x - object.x) * factor, object.y + (y - object.y) * factor]);
    if (Number.isFinite(object.x1)) {
      object.x1 = object.x + (object.x1 - object.x) * factor;
      object.x2 = object.x + (object.x2 - object.x) * factor;
      object.y1 = object.y + (object.y1 - object.y) * factor;
      object.y2 = object.y + (object.y2 - object.y) * factor;
    }
  }

  moveObject(object, dx, dy) {
    object.x = (object.x ?? 0) + dx;
    object.y = (object.y ?? 0) + dy;
    ["x1", "x2"].forEach((key) => { if (Number.isFinite(object[key])) object[key] += dx; });
    ["y1", "y2"].forEach((key) => { if (Number.isFinite(object[key])) object[key] += dy; });
    if (object.points) object.points = object.points.map(([x, y]) => [x + dx, y + dy]);
  }

  createHouse(color = "black") {
    return [
      { type: "rectangle", x: 480, y: 385, width: 330, height: 240, color },
      { type: "triangle", x: 480, y: 220, size: 390, color: "red" },
      { type: "rectangle", x: 480, y: 445, width: 70, height: 120, color: "orange" },
      { type: "rectangle", x: 385, y: 355, width: 65, height: 65, color: "blue" },
      { type: "rectangle", x: 575, y: 355, width: 65, height: 65, color: "blue" },
    ];
  }

  createSmile(color = "orange") {
    return [
      { type: "circle", x: 480, y: 310, radius: 165, color },
      { type: "circle", x: 425, y: 270, radius: 15, color: "black", fill: "black" },
      { type: "circle", x: 535, y: 270, radius: 15, color: "black", fill: "black" },
      { type: "arc", x: 480, y: 315, radius: 85, startAngle: 0.2, endAngle: Math.PI - 0.2, color: "red", lineWidth: this.state.lineWidth + 2 },
    ];
  }

  createSun(color = "orange") {
    const operations = [{ type: "circle", x: 480, y: 310, radius: 105, color, fill: "rgba(255, 204, 0, 0.2)" }];
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      operations.push({ type: "line", x1: 480 + Math.cos(angle) * 135, y1: 310 + Math.sin(angle) * 135, x2: 480 + Math.cos(angle) * 190, y2: 310 + Math.sin(angle) * 190, color });
    }
    return operations;
  }

  notifyToolChange() { this.onToolChange?.({ ...this.state }); }
  timeName(time) { return { night: "夜晚", sunset: "日落", day: "白天" }[time]; }
  weatherName(weather) { return { rain: "雨天", snow: "雪天", clear: "晴朗" }[weather]; }
  midpoint(a, b, fallback) { return Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : fallback; }
  randomCenter() { return { x: 480 + Math.round((Math.random() - 0.5) * 180), y: 310 + Math.round((Math.random() - 0.5) * 120) }; }
  shapeName(shape) { return { line: "线条", circle: "圆形", rectangle: "矩形", triangle: "三角形" }[shape]; }
}
