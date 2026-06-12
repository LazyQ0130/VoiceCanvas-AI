export async function generateAiImage(prompt, seed = Math.floor(Math.random() * 1_000_000_000)) {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, seed }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || "AI 图片生成失败，请稍后重试");

  const imageResponse = await fetch(result.imageProxyUrl);
  if (!imageResponse.ok) {
    const error = await imageResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || "无法读取生成图片，请重新生成");
  }
  const blob = await imageResponse.blob();
  return { ...result, imageObjectUrl: URL.createObjectURL(blob) };
}

export async function saveAiImage(version) {
  if (!version?.imageObjectUrl) throw new Error("当前没有可保存的 AI 图片");
  const link = document.createElement("a");
  link.download = `voice-canvas-ai-${version.seed}.png`;
  link.href = version.imageObjectUrl;
  link.click();
}
