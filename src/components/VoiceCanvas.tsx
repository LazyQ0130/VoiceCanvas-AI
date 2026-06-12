import { Crosshair, Grid3X3, ScanLine } from "lucide-react";
import { useEffect, useRef } from "react";

import { DrawingEngine } from "../drawingEngine.js";
import type { OperationGroup } from "../types";

type VoiceCanvasProps = {
  groups: OperationGroup[];
  showGrid: boolean;
  onEngineReady: (engine: DrawingEngine) => void;
};

const gridLabels = ["左上", "中上", "右上", "左中", "中心", "右中", "左下", "中下", "右下"];

export function VoiceCanvas({ groups, showGrid, onEngineReady }: VoiceCanvasProps) {
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
        实时创作画布
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="group relative aspect-[48/31] max-h-full w-full max-w-[1180px] overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.48),0_0_0_1px_rgba(56,189,248,0.05)]">
          <canvas
            ref={canvasRef}
            width="960"
            height="620"
            aria-label="声绘智能画布绘图区"
            className="h-full w-full object-contain [image-rendering:auto]"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-slate-950/10" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur-md">
            <Crosshair className="h-3 w-3 text-cyan-500" />
            语音定位已启用
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
            960 × 620
          </div>
        </div>
      </div>
    </div>
  );
}
