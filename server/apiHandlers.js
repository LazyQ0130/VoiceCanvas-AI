import { errorPayload, fetchGeneratedImage, generateImage } from "./aiProvider.js";

let activeGenerations = 0;
const MAX_CONCURRENT_GENERATIONS = 2;

export async function handleGenerateImage({ body, env, fetchImpl = fetch }) {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    return { status: 429, body: { error: { code: "too_many_requests", message: "当前生成任务较多，请稍后重试" } } };
  }
  activeGenerations += 1;
  try {
    const result = await generateImage({ prompt: body?.prompt, seed: body?.seed, env, fetchImpl });
    return { status: 200, body: result };
  } catch (error) {
    return errorPayload(error);
  } finally {
    activeGenerations -= 1;
  }
}

export async function handleImageProxy({ token, env, fetchImpl = fetch }) {
  try {
    const result = await fetchGeneratedImage({ token, env, fetchImpl });
    return { status: 200, ...result };
  } catch (error) {
    return errorPayload(error);
  }
}
