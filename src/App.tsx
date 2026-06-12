import { Grid3X3, Mic2, Palette, Radio, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CommandExecutor } from "./commandExecutor.js";
import { CommandParser } from "./commandParser.js";
import { ControlSidebar } from "./components/ControlSidebar";
import { MainLayout } from "./components/MainLayout";
import { VoiceCanvas } from "./components/VoiceCanvas";
import { VoiceFeedbackBar } from "./components/VoiceFeedbackBar";
import { DrawingEngine } from "./drawingEngine.js";
import { HistoryManager } from "./historyManager.js";
import { localizeText } from "./localization";
import { SpeechController } from "./speechController.js";
import type { CommandHistoryItem, OperationGroup, ToolState, VoiceState } from "./types";

const parser = new CommandParser();

export default function App() {
  const [showGrid, setShowGrid] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [groups, setGroups] = useState<OperationGroup[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [parsedCommand, setParsedCommand] = useState<unknown>(null);
  const [executionResult, setExecutionResult] = useState("系统就绪，等待语音指令");
  const [latency, setLatency] = useState<number | null>(null);
  const [toolState, setToolState] = useState<ToolState>({ color: "red", lineWidth: 4, style: "default" });
  const [supported, setSupported] = useState(true);

  const engineRef = useRef<DrawingEngine | null>(null);
  const executorRef = useRef<CommandExecutor | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const historyRef = useRef(
    new HistoryManager((nextGroups: OperationGroup[]) => setGroups([...nextGroups])),
  );

  const showError = useCallback((message: string) => {
    setExecutionResult(message);
    setVoiceState("error");
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setVoiceState("idle"), 2000);
  }, []);

  const executeTranscript = useCallback(
    (finalTranscript: string) => {
      const startedAt = performance.now();
      setTranscript(finalTranscript);
      setVoiceState("processing");
      const command = parser.parse(finalTranscript);
      setParsedCommand(command);

      window.setTimeout(() => {
        setVoiceState("executing");
        window.setTimeout(() => {
          const result = executorRef.current?.execute(command);
          const elapsed = Math.round(performance.now() - startedAt);
          setLatency(elapsed);

          if (!result?.success) {
            showError(result?.message ?? "指令执行失败，请再说一次");
            return;
          }

          setExecutionResult(result.message);
          setCommandHistory((current) => [
            {
              id: current.length + 1,
              command: finalTranscript,
              result: result.message,
              time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
              operationCount: result.operationCount ?? 0,
            },
            ...current,
          ]);
          setVoiceState("listening");
        }, 260);
      }, 220);
    },
    [showError],
  );

  const handleEngineReady = useCallback((engine: DrawingEngine) => {
    engineRef.current = engine;
    executorRef.current = new CommandExecutor({
      drawingEngine: engine,
      historyManager: historyRef.current,
      onToolChange: (state: ToolState) => setToolState({ ...state }),
    });
  }, []);

  useEffect(() => {
    const speech = new SpeechController({
      onResult: (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal) executeTranscript(text);
      },
      onStatusChange: (status: string) => {
        if (status === "listening") setVoiceState("listening");
        if (status === "starting") {
          setTranscript("正在请求麦克风权限...");
          setVoiceState("processing");
        }
      },
      onError: (error: string) => {
        const messages: Record<string, string> = {
          "not-allowed": "麦克风权限被拒绝，请在地址栏允许麦克风",
          "service-not-allowed": "语音识别服务不可用，请使用 Chrome 或 Edge",
          "audio-capture": "没有检测到可用麦克风",
          network: "语音识别网络连接异常",
          unsupported: "当前浏览器不支持 Web Speech API",
          "start-timeout": "语音识别服务启动超时",
        };
        showError(messages[error] ?? "未听清，请再说一次");
      },
    });
    speechRef.current = speech;
    setSupported(speech.supported);

    return () => {
      speech.stop();
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    };
  }, [executeTranscript, showError]);

  const startListening = useCallback(async () => {
    if (!executorRef.current) {
      showError("画布仍在初始化，请稍后重试");
      return;
    }
    await speechRef.current?.start();
  }, [showError]);

  const stopListening = useCallback(() => {
    speechRef.current?.stop();
    setVoiceState("idle");
  }, []);

  const objects = groups.flatMap((group) => group.operations);
  const recentObjectName = objects.at(-1)?.label ?? "暂无对象";

  const workspace = (
    <div className="relative flex h-full min-w-0 flex-col">
      <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-white/8 px-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
            <Mic2 className="h-5 w-5 text-cyan-300" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              声绘智能画布
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
              全语音驱动创作仪表盘
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] text-slate-400 sm:flex">
            <Palette className="h-3.5 w-3.5" style={{ color: toolState.color }} />
            <span className="font-bold text-slate-200">{localizeText(toolState.color)}</span>
            <span className="h-3 w-px bg-white/10" />
            <span>线宽 {toolState.lineWidth}</span>
            <span className="h-3 w-px bg-white/10" />
            <span>{localizeText(toolState.style)}</span>
          </div>
          <div className="hidden rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] text-slate-400 xl:block">
            <span className="font-bold text-cyan-300">{objects.length}</span> 个对象
            <span className="mx-2 text-slate-700">·</span>
            最近：<span className="font-bold text-slate-200">{recentObjectName}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGrid((visible) => !visible)}
            className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-[10px] font-bold uppercase tracking-wider transition ${
              showGrid
                ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                : "border-white/8 bg-white/[0.035] text-slate-500"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            定位网格
          </button>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 md:flex">
            <Radio className="h-3 w-3" />
            系统就绪
          </span>
        </div>
      </header>

      <VoiceCanvas groups={groups} showGrid={showGrid} onEngineReady={handleEngineReady} />
      <VoiceFeedbackBar
        voiceState={voiceState}
        transcript={transcript}
        supported={supported}
        onStart={startListening}
        onStop={stopListening}
      />

      <div className="pointer-events-none absolute bottom-7 left-7 hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600 xl:flex">
        <Sparkles className="h-3 w-3 text-violet-400/70" />
        试着说：“画一个夜晚城市”
      </div>
    </div>
  );

  return (
    <MainLayout
      workspace={workspace}
      sidebar={
        <ControlSidebar
          commandHistory={commandHistory}
          groups={groups}
          parsedCommand={parsedCommand}
          executionResult={executionResult}
          latency={latency}
          currentStyle={toolState.style}
        />
      }
    />
  );
}
