import { AlertCircle, LoaderCircle, Mic, Radio, Sparkles, Square } from "lucide-react";

import type { DrawingMode, VoiceState } from "../types";

type VoiceFeedbackBarProps = {
  voiceState: VoiceState;
  transcript: string;
  supported: boolean;
  drawingMode: DrawingMode;
  onStart: () => void;
  onStop: () => void;
};

const stateCopy: Record<VoiceState, { title: string; detail: string }> = {
  idle: { title: "待命中，请说出指令...", detail: "点击麦克风授权后，即可完全通过语音创作" },
  listening: { title: "正在聆听...", detail: "请自然说出绘图或编辑指令" },
  processing: { title: "正在理解意图...", detail: "正在将自然语言转换为结构化绘图指令" },
  executing: { title: "AI 正在画布上创作...", detail: "正在执行并写入可撤销的历史操作组" },
  error: { title: "未听清，请再说一次", detail: "请靠近麦克风，并保持指令简短清晰" },
};

const voiceStateNames: Record<VoiceState, string> = {
  idle: "待命",
  listening: "正在聆听",
  processing: "正在理解",
  executing: "正在创作",
  error: "识别失败",
};

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 w-20 items-center justify-center gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <span
          key={index}
          className={`w-1 rounded-full ${
            active
              ? "animate-voice-wave bg-gradient-to-t from-cyan-400 to-violet-400"
              : "h-2 bg-slate-600"
          }`}
          style={active ? { animationDelay: `${index * 80}ms` } : undefined}
        />
      ))}
    </div>
  );
}

export function VoiceFeedbackBar({
  voiceState,
  transcript,
  supported,
  drawingMode,
  onStart,
  onStop,
}: VoiceFeedbackBarProps) {
  const copy = voiceState === "executing" && drawingMode === "ai"
    ? { title: "AI 正在生成完整图片...", detail: "正在调用 Kolors 模型，请稍候" }
    : voiceState === "idle" && drawingMode === "ai"
      ? { title: "AI 图片模式待命中...", detail: "先描述画面，再点击“确认并生成”" }
      : stateCopy[voiceState];
  const active = voiceState === "listening";

  return (
    <div
      className={`absolute bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[1152px] -translate-x-1/2 rounded-[26px] border bg-[#0b1427]/95 p-3 shadow-[0_24px_70px_rgba(2,6,23,0.72)] backdrop-blur-2xl transition-all duration-300 sm:bottom-7 ${
        voiceState === "error"
          ? "animate-error-pulse border-rose-500/80"
          : active
            ? "border-cyan-400/50 shadow-[0_24px_70px_rgba(8,145,178,0.2)]"
            : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!supported || voiceState === "processing" || voiceState === "executing"}
          onClick={active ? onStop : onStart}
          className={`relative flex h-[72px] w-[84px] shrink-0 items-center justify-center rounded-[20px] border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-45 ${
            active
              ? "border-rose-400/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
              : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
          }`}
          aria-label={active ? "停止语音控制" : "开始语音控制"}
        >
          {active ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-8 w-8" />}
          {active && <span className="absolute inset-0 -z-10 animate-ping rounded-xl border border-cyan-400/30" />}
        </button>

        <div className="hidden border-r border-white/10 pr-4 sm:block">
          {voiceState === "processing" ? (
            <div className="flex h-10 w-20 items-center justify-center">
              <span className="h-5 w-5 animate-breathe rounded-full bg-blue-400 shadow-[0_0_22px_rgba(96,165,250,0.75)]" />
            </div>
          ) : voiceState === "executing" ? (
            <div className="flex h-10 w-20 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-violet-400" />
            </div>
          ) : voiceState === "error" ? (
            <div className="flex h-10 w-20 items-center justify-center">
              <AlertCircle className="h-7 w-7 text-rose-400" />
            </div>
          ) : (
            <Waveform active={active} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {voiceState === "executing" ? (
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            ) : (
              <Radio className={`h-3.5 w-3.5 ${active ? "text-cyan-400" : "text-slate-500"}`} />
            )}
            <p className="truncate text-base font-black text-slate-100">{copy.title}</p>
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">
            {active && transcript ? `“${transcript}”` : copy.detail}
          </p>
        </div>

        <div className="hidden min-w-[102px] rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-right md:block">
          <p className="text-[9px] font-black tracking-[0.2em] text-slate-500">语音状态</p>
          <p className="mt-0.5 text-xs font-bold text-cyan-300">{voiceStateNames[voiceState]}</p>
        </div>
      </div>
    </div>
  );
}
