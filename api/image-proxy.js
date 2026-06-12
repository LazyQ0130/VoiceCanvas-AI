import { handleImageProxy } from "../server/apiHandlers.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: { message: "仅支持 GET 请求" } });
  const result = await handleImageProxy({ token: request.query.token, env: process.env });
  if (result.body) return response.status(result.status).json(result.body);
  response.setHeader("Content-Type", result.contentType);
  response.setHeader("Cache-Control", "private, max-age=300");
  return response.status(200).send(result.bytes);
}
