export const STYLE_PRESETS = {
  default: {
    name: "默认风格",
    lineWidth: 4,
    shadowBlur: 0,
    opacity: 1,
    background: ["#f8fafc", "#e2e8f0"],
    palette: ["#0f172a", "#2563eb", "#ef4444", "#f59e0b", "#16a34a", "#7c3aed"],
  },
  neon: {
    name: "霓虹风格",
    lineWidth: 3,
    shadowBlur: 14,
    opacity: 0.95,
    background: ["#020617", "#111827"],
    palette: ["#22d3ee", "#f472b6", "#a78bfa", "#facc15", "#34d399", "#fb7185"],
  },
  minimal: {
    name: "极简风格",
    lineWidth: 2,
    shadowBlur: 0,
    opacity: 0.9,
    background: ["#f8fafc", "#f1f5f9"],
    palette: ["#334155", "#64748b", "#94a3b8", "#cbd5e1", "#0f766e", "#b45309"],
  },
  handDrawn: {
    name: "手绘风格",
    lineWidth: 4,
    shadowBlur: 0,
    opacity: 0.9,
    jitter: 2.2,
    background: ["#fff7ed", "#fef3c7"],
    palette: ["#422006", "#92400e", "#b45309", "#166534", "#1e40af", "#9f1239"],
  },
  soft: {
    name: "柔和风格",
    lineWidth: 3,
    shadowBlur: 7,
    opacity: 0.72,
    background: ["#fdf2f8", "#eef2ff"],
    palette: ["#f9a8d4", "#a5b4fc", "#93c5fd", "#86efac", "#fde68a", "#c4b5fd"],
  },
};

export function getStylePreset(style = "default") {
  return STYLE_PRESETS[style] ?? STYLE_PRESETS.default;
}
