import test from "node:test";
import assert from "node:assert/strict";

import { CommandExecutor } from "../src/commandExecutor.js";
import { CommandParser } from "../src/commandParser.js";
import { DrawingEngine } from "../src/drawingEngine.js";
import { HistoryManager } from "../src/historyManager.js";

const parser = new CommandParser();

test("parses a precise line command", () => {
  assert.deepEqual(parser.parse("从 100 100 到 300 300 画一条红色线"), {
    valid: true,
    type: "draw",
    shape: "line",
    color: "red",
    rawText: "从 100 100 到 300 300 画一条红色线",
    x1: 100,
    y1: 100,
    x2: 300,
    y2: 300,
    direction: "diagonal",
  });
});

test("parses circle position, radius, and color", () => {
  const command = parser.parse("在 300 200 画一个半径 60 的绿色圆");
  assert.equal(command.shape, "circle");
  assert.equal(command.color, "green");
  assert.equal(command.x, 300);
  assert.equal(command.y, 200);
  assert.equal(command.radius, 60);
});

test("supports aliases and composite commands", () => {
  assert.equal(parser.parse("清屏").action, "clear");
  assert.equal(parser.parse("画一个红的圆圈").color, "red");
  assert.equal(parser.parse("画一个房子").type, "composite");
});

test("history treats a composite group as one undo step", () => {
  const history = new HistoryManager();
  history.addGroup({ label: "房子", operations: [{ type: "rectangle" }, { type: "triangle" }] });
  assert.equal(history.operations.length, 1);
  assert.equal(history.operations[0].operations.length, 2);
  assert.equal(history.undo(), true);
  assert.equal(history.operations.length, 0);
  assert.equal(history.redo(), true);
  assert.equal(history.operations.length, 1);
});

test("executor creates composite operations and restores a cleared canvas", () => {
  const history = new HistoryManager();
  const executor = new CommandExecutor({
    drawingEngine: { save() {} },
    historyManager: history,
    onToolChange() {},
  });

  const result = executor.execute(parser.parse("画一个太阳"));
  assert.equal(result.success, true);
  assert.equal(history.operations.length, 1);
  assert.equal(history.operations[0].operations.length, 13);

  executor.execute(parser.parse("清空画布"));
  assert.equal(history.operations.length, 0);
  executor.execute(parser.parse("撤销"));
  assert.equal(history.operations.length, 1);
});

test("parses advanced scenes, styles, and last-object edits", () => {
  assert.deepEqual(parser.parse("画一个夜晚城市"), {
    valid: true,
    type: "scene",
    action: "drawScene",
    scene: "nightCity",
    rawText: "画一个夜晚城市",
  });
  assert.equal(parser.parse("切换为霓虹风格").style, "neon");
  assert.equal(parser.parse("把最后一个图形向左移动").operation, "moveLeft");
  assert.equal(parser.parse("把最后一个图形变成蓝色").operation, "setColor");
  assert.equal(parser.parse("画一个宇宙星空").scene, "starrySky");
  assert.equal(parser.parse("画一个日落海滩").scene, "sunsetBeach");
  assert.equal(parser.parse("画一个森林").scene, "forest");
  assert.equal(parser.parse("画一个机器人").scene, "robot");
});

test("scene randomness is stored and the whole scene is one undo step", () => {
  const history = new HistoryManager();
  const executor = new CommandExecutor({
    drawingEngine: { save() {} },
    historyManager: history,
    onToolChange() {},
  });
  const result = executor.execute(parser.parse("画一片星空"));
  const scene = history.operations[0];
  const serialized = JSON.stringify(scene);

  assert.equal(result.success, true);
  assert.ok(result.operationCount > 90);
  assert.equal(scene.operations[0].label, "星空渐变背景");
  assert.equal(JSON.stringify(history.operations[0]), serialized);
  assert.equal(history.undo(), true);
  assert.equal(history.operations.length, 0);
  assert.equal(history.redo(), true);
  assert.equal(JSON.stringify(history.operations[0]), serialized);
});

test("style and last-object edit commands update stable object records", () => {
  const history = new HistoryManager();
  const executor = new CommandExecutor({
    drawingEngine: { save() {} },
    historyManager: history,
    onToolChange() {},
  });
  executor.execute(parser.parse("切换为霓虹风格"));
  executor.execute(parser.parse("画一个圆"));
  const original = history.operations[0].operations[0];
  assert.equal(original.style, "neon");
  assert.ok(original.id);
  assert.ok(original.createdAt);

  executor.execute(parser.parse("把最后一个图形变大"));
  assert.ok(history.operations[0].operations[0].radius > original.radius);
  executor.execute(parser.parse("把最后一个图形变成蓝色"));
  assert.equal(history.operations[0].operations[0].color, "blue");
  executor.execute(parser.parse("复制最后一个图形"));
  const [source, copy] = history.operations[0].operations;
  assert.notEqual(source.id, copy.id);
  assert.equal(copy.label, `${source.label}副本`);
  assert.ok(copy.createdAt);
});

test("drawing engine can render every advanced scene object type", () => {
  const gradient = { addColorStop() {} };
  const context = {
    save() {}, restore() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {},
    lineTo() {}, stroke() {}, arc() {}, fill() {}, closePath() {}, roundRect() {},
    setLineDash() {}, translate() {}, quadraticCurveTo() {}, createLinearGradient() { return gradient; },
  };
  const canvas = { width: 960, height: 620, getContext() { return context; } };
  const engine = new DrawingEngine(canvas);
  const history = new HistoryManager();
  const executor = new CommandExecutor({ drawingEngine: engine, historyManager: history, onToolChange() {} });

  ["画一个夜晚城市", "画一片星空", "画一个海边日落", "画一个森林", "画一个机器人"]
    .forEach((command) => executor.execute(parser.parse(command)));

  assert.doesNotThrow(() => engine.render(history.operations));
  assert.equal(history.operations.length, 5);
});
