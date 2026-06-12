import { Crosshair, Grid3X3, ImageIcon, LoaderCircle, ScanLine, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { DrawingEngine } from "../drawingEngine.js";
import type { AiImageVersion, DrawingMode, OperationGroup } from "../types";

type VoiceCanvasProps = {
  groups: OperationGroup[];
  showGrid: boolean;
  drawingMode: DrawingMode;
  aiImage: AiImageVersion | null;
  aiGenerating: boolean;
  onEngineReady: (engine: DrawingEngine) => void;
};

const gridLabels = ["左上", "中上", "右上", "左中", "中心", "右中", "左下", "中下", "右下"];

export function VoiceCanvas({ groups, showGrid, drawingMode, aiImage, aiGenerating, onEngineReady }: VoiceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;
    engineRef.current = new DrawingEngine(canvasRef.current);
    onEngineReady(engineRef.current);
  }, [onEngineReady]);

  useEffect(() => {
    engineRef.current?.render(groups);
  }, [groups]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-28 pt-4 sm:px-7 sm:pb-32">
      <div className="mb-3 flex h-5 shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
        <ScanLine className="h-3.5 w-3.5 text-cyan-400" />
        {drawingMode === "canvas" ? "实时矢量画布" : "AI 完整图片生成区"}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="group relative aspect-[48/31] max-h-full w-full max-w-[1180px] overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.48),0_0_0_1px_rgba(56,189,248,0.05)]">
          <canvas
            ref={canvasRef}
            width="960"
            height="620"
            aria-label="声绘智能画布绘图区"
            className={`h-full w-full object-contain [image-rendering:auto] ${drawingMode === "ai" ? "invisible absolute inset-0" : ""}`}
          />
          {drawingMode === "ai" && aiImage ? (
            <img
              src={aiImage.imageObjectUrl}
              alt={aiImage.prompt}
              className="h-full w-full bg-slate-950 object-contain"
            />
          ) : null}
          {drawingMode === "ai" && !aiImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(124,58,237,0.16),transparent_42%),linear-gradient(145deg,#07101f,#111827)] px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-400/10">
                <ImageIcon className="h-8 w-8 text-violet-300" />
              </div>
              <p className="mt-5 text-base font-black text-white">等待生成完整 AI 图片</p>
              <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">
                先说出画面描述和修改要求，确认后说“开始生成”
              </p>
            </div>
          )}
          {drawingMode === "ai" && aiGenerating && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md">
              <LoaderCircle className="h-10 w-10 animate-spin text-violet-300" />
              <p className="mt-4 flex items-center gap-2 text-sm font-black text-white">
                <Sparkles className="h-4 w-4 text-violet-300" />
                AI 正在生成完整图片
              </p>
              <p className="mt-2 text-xs text-slate-400">通常需要数秒，请保持页面开启</p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-slate-950/10" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur-md">
            <Crosshair className="h-3 w-3 text-cyan-500" />
            {drawingMode === "canvas" ? "语音定位已启用" : "AI 图片模式"}
          </div>

          <div
            className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 transition-opacity duration-300 ${
              showGrid ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!showGrid}
          >
            {gridLabels.map((label) => (
              <div
                key={label}
                className="relative flex items-center justify-center border-b border-r border-cyan-500/20 last:border-r-0"
              >
                <span className="rounded-md border border-cyan-500/20 bg-slate-950/10 px-2 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-700/45 backdrop-blur-sm">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-[10px] font-semibold text-slate-500 backdrop-blur-md">
            <Grid3X3 className="h-3 w-3" />
            {drawingMode === "canvas" ? "960 × 620" : "1024 × 768"}
          </div>
        </div>
      </div>
    </div>
  );
}
