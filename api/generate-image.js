import { handleGenerateImage } from "../server/apiHandlers.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: { message: "仅支持 POST 请求" } });
  const result = await handleGenerateImage({ body: request.body, env: process.env });
  return response.status(result.status).json(result.body);
}
