import test from "node:test";
import assert from "node:assert/strict";

import { AiHistoryManager } from "../src/aiHistoryManager.js";
import { buildGenerationPrompt, isImmediateAiAction, mergePrompt, parseAiCommand, parseModeCommand } from "../src/aiPromptController.js";
import { createImageToken, generateImage, verifyImageToken } from "../server/aiProvider.js";
import { handleGenerateImage, handleImageProxy } from "../server/apiHandlers.js";

test("AI voice commands switch modes and defer generation until confirmation", () => {
  assert.equal(parseModeCommand("切换到 AI 绘图模式").mode, "ai");
  assert.equal(parseModeCommand("切换到 Canvas 模式").mode, "canvas");
  assert.equal(parseAiCommand("画一座未来城市").type, "promptDraft");
  assert.equal(parseAiCommand("开始生成").action, "generate");
  assert.equal(parseAiCommand("重新生成").action, "regenerate");
  assert.equal(parseAiCommand("取消本次修改").action, "cancelDraft");
  assert.equal(isImmediateAiAction("开始生成"), true);
  assert.equal(isImmediateAiAction("画一座未来城市"), false);
});

test("AI prompt additions merge without invoking a provider", () => {
  const prompt = mergePrompt("画一座未来城市", "再加一些飞船");
  assert.equal(prompt, "画一座未来城市；再加一些飞船");
  assert.match(buildGenerationPrompt(prompt), /无文字，无水印/);
});

test("AI history is independent and supports undo, redo, and clear", () => {
  const history = new AiHistoryManager();
  history.add({ id: "1", prompt: "第一张" });
  history.add({ id: "2", prompt: "第二张" });
  assert.equal(history.current.id, "2");
  assert.equal(history.undo(), true);
  assert.equal(history.current.id, "1");
  assert.equal(history.redo(), true);
  assert.equal(history.current.id, "2");
  history.clear();
  assert.equal(history.current, null);
});

test("SiliconFlow provider sends the expected request and signs image URLs", async () => {
  const env = { SILICONFLOW_API_KEY: "test-key", SILICONFLOW_IMAGE_MODEL: "test-model", SILICONFLOW_IMAGE_SIZE: "1024x1024" };
  let requestBody;
  const result = await generateImage({
    prompt: "一座未来城市",
    seed: 42,
    env,
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ images: [{ url: "https://images.example/result.png" }], seed: 42, timings: { inference: 321 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assert.deepEqual(requestBody, {
    model: "test-model",
    prompt: "一座未来城市",
    image_size: "1024x1024",
    batch_size: 1,
    num_inference_steps: 20,
    guidance_scale: 7.5,
    seed: 42,
  });
  assert.equal(result.inferenceMs, 321);
  const token = new URL(result.imageProxyUrl, "http://localhost").searchParams.get("token");
  assert.equal(verifyImageToken(token, env), "https://images.example/result.png");
});

test("API handlers map missing keys and proxy valid generated images", async () => {
  const missing = await handleGenerateImage({ body: { prompt: "测试" }, env: {} });
  assert.equal(missing.status, 503);
  assert.equal(missing.body.error.code, "missing_api_key");

  const env = { SILICONFLOW_API_KEY: "test-key" };
  const token = createImageToken("https://images.example/result.png", env);
  const proxied = await handleImageProxy({
    token,
    env,
    fetchImpl: async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/png" } }),
  });
  assert.equal(proxied.status, 200);
  assert.equal(proxied.contentType, "image/png");
  assert.deepEqual([...proxied.bytes], [1, 2, 3]);

  const octetStream = await handleImageProxy({
    token,
    env,
    fetchImpl: async () => new Response(new Uint8Array([4, 5, 6]), { status: 200, headers: { "Content-Type": "application/octet-stream" } }),
  });
  assert.equal(octetStream.status, 200);
  assert.equal(octetStream.contentType, "image/png");

  const rejected = await handleImageProxy({ token: `${token}broken`, env });
  assert.equal(rejected.status, 401);
  assert.equal(rejected.body.error.code, "invalid_token");
});
