import test from "node:test";
import assert from "node:assert/strict";

import { CommandExecutor } from "../src/commandExecutor.js";
import { CommandParser } from "../src/commandParser.js";
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
