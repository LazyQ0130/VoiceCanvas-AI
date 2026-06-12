import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_IMAGE_MODEL = "Kwai-Kolors/Kolors";
export const DEFAULT_IMAGE_SIZE = "1024x1024";
export const MAX_PROMPT_LENGTH = 1800;
const TOKEN_LIFETIME_MS = 10 * 60 * 1000;

function providerError(status, message, code = "provider_error") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function validatePrompt(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw providerError(400, "请先说出想生成的画面描述", "invalid_prompt");
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw providerError(400, `画面描述不能超过 ${MAX_PROMPT_LENGTH} 个字符`, "prompt_too_long");
  }
  return prompt.trim();
}

function signingSecret(env) {
  return env.IMAGE_PROXY_SECRET || env.SILICONFLOW_API_KEY || "";
}

export function createImageToken(url, env = process.env, now = Date.now()) {
  const secret = signingSecret(env);
  if (!secret) throw providerError(503, "AI 图片服务尚未配置 API Key", "missing_api_key");
  const payload = Buffer.from(JSON.stringify({ url, exp: now + TOKEN_LIFETIME_MS })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyImageToken(token, env = process.env, now = Date.now()) {
  const secret = signingSecret(env);
  if (!secret || typeof token !== "string") throw providerError(401, "图片访问令牌无效", "invalid_token");
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw providerError(401, "图片访问令牌无效", "invalid_token");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw providerError(401, "图片访问令牌无效", "invalid_token");
  }
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw providerError(401, "图片访问令牌无效", "invalid_token");
  }
  if (!data.url?.startsWith("https://") || data.exp < now) {
    throw providerError(401, "图片访问令牌已过期", "expired_token");
  }
  return data.url;
}

export async function generateImage({ prompt, seed, env = process.env, fetchImpl = fetch }) {
  const apiKey = env.SILICONFLOW_API_KEY;
  if (!apiKey) throw providerError(503, "AI 图片服务尚未配置，请设置 SILICONFLOW_API_KEY", "missing_api_key");

  const cleanPrompt = validatePrompt(prompt);
  const safeSeed = Number.isInteger(seed) && seed >= 0 ? seed : Math.floor(Math.random() * 1_000_000_000);
  const model = env.SILICONFLOW_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const imageSize = env.SILICONFLOW_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
  const numInferenceSteps = Number(env.SILICONFLOW_INFERENCE_STEPS) || 20;
  const guidanceScale = Number(env.SILICONFLOW_GUIDANCE_SCALE) || 7.5;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75_000);
  const startedAt = Date.now();

  try {
    const response = await fetchImpl("https://api.siliconflow.cn/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: cleanPrompt,
        image_size: imageSize,
        batch_size: 1,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        seed: safeSeed,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "AI 图片服务鉴权失败，请检查 API Key"
        : response.status === 429
          ? "AI 图片服务额度不足或请求过于频繁"
          : response.status >= 500
            ? "AI 图片服务暂时不可用，请稍后重试"
            : data.message || data.error?.message || "AI 图片生成请求失败";
      throw providerError(response.status, message, `siliconflow_${response.status}`);
    }

    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) throw providerError(502, "AI 图片服务没有返回图片", "empty_image");
    return {
      imageProxyUrl: `/api/image-proxy?token=${encodeURIComponent(createImageToken(imageUrl, env))}`,
      seed: data.seed ?? safeSeed,
      model,
      inferenceMs: Math.round(data.timings?.inference ?? Date.now() - startedAt),
    };
  } catch (error) {
    if (error.name === "AbortError") throw providerError(504, "AI 图片生成超时，请重试", "timeout");
    if (error.status) throw error;
    throw providerError(502, "无法连接 AI 图片服务，请检查网络", "network_error");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchGeneratedImage({ token, env = process.env, fetchImpl = fetch }) {
  const url = verifyImageToken(token, env);
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw providerError(502, "无法读取生成图片，请重新生成", "image_fetch_failed");
  const contentType = response.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) throw providerError(502, "生成结果不是有效图片", "invalid_image");
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType };
}

export function errorPayload(error) {
  return {
    status: Number(error.status) || 500,
    body: { error: { code: error.code || "internal_error", message: error.message || "服务器内部错误" } },
  };
}
