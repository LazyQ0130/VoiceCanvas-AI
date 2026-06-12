import { Grid3X3, ImageIcon, Mic2, Palette, Radio, Shapes, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AiHistoryManager } from "./aiHistoryManager.js";
import { generateAiImage, saveAiImage } from "./aiImageClient.js";
import { buildGenerationPrompt, mergePrompt, parseAiCommand, parseModeCommand } from "./aiPromptController.js";
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
import type { AiHistoryState, AiImageVersion, CommandHistoryItem, DrawingMode, OperationGroup, ToolState, VoiceState } from "./types";

const parser = new CommandParser();

export default function App() {
  const [showGrid, setShowGrid] = useState(true);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("canvas");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [groups, setGroups] = useState<OperationGroup[]>([]);
  const [canvasCommandHistory, setCanvasCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [aiCommandHistory, setAiCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [parsedCommand, setParsedCommand] = useState<unknown>(null);
  const [executionResult, setExecutionResult] = useState("系统就绪，等待语音指令");
  const [latency, setLatency] = useState<number | null>(null);
  const [toolState, setToolState] = useState<ToolState>({ color: "red", lineWidth: 4, style: "default", scene: "custom", time: "day", weather: "clear", tone: "normal", keywords: [] });
  const [recognizedKeywords, setRecognizedKeywords] = useState<string[]>([]);
  const [generatedObjects, setGeneratedObjects] = useState<string[]>([]);
  const [supported, setSupported] = useState(true);
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [aiHistory, setAiHistory] = useState<AiHistoryState>({ versions: [], index: -1, current: null });
  const [aiGenerating, setAiGenerating] = useState(false);

  const engineRef = useRef<DrawingEngine | null>(null);
  const executorRef = useRef<CommandExecutor | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const drawingModeRef = useRef<DrawingMode>("canvas");
  const aiDraftRef = useRef("");
  const aiGeneratingRef = useRef(false);
  const lastExecutedTranscriptRef = useRef({ text: "", at: 0 });
  const historyRef = useRef(
    new HistoryManager((nextGroups: OperationGroup[]) => setGroups([...nextGroups])),
  );
  const aiHistoryRef = useRef(new AiHistoryManager((state: AiHistoryState) => setAiHistory(state)));

  const showError = useCallback((message: string) => {
    setExecutionResult(message);
    setVoiceState("error");
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setVoiceState("idle"), 2000);
  }, []);

  const addHistoryItem = useCallback((mode: DrawingMode, command: string, result: string, operationCount = 0, keywords: string[] = []) => {
    const setter = mode === "canvas" ? setCanvasCommandHistory : setAiCommandHistory;
    setter((current) => [{
      id: current.length + 1,
      command,
      result,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      operationCount,
      keywords,
    }, ...current]);
  }, []);

  const changeDrawingMode = useCallback((mode: DrawingMode, source = "界面") => {
    drawingModeRef.current = mode;
    setDrawingMode(mode);
    const message = `已切换到${mode === "canvas" ? "Canvas 矢量" : "AI 图片"}模式`;
    setExecutionResult(message);
    setParsedCommand({ type: "switchMode", mode, source });
    setVoiceState("idle");
  }, []);

  const executeAiGeneration = useCallback(async (prompt: string, rawText: string) => {
    if (!prompt.trim()) {
      showError("请先描述想生成的画面，再点击“确认并生成”");
      return;
    }
    const startedAt = performance.now();
    setVoiceState("executing");
    aiGeneratingRef.current = true;
    setAiGenerating(true);
    setExecutionResult("正在调用 Kolors 模型生成完整图片...");
    try {
      const result = await generateAiImage(buildGenerationPrompt(prompt));
      const version: AiImageVersion = {
        id: crypto.randomUUID(),
        prompt,
        imageObjectUrl: result.imageObjectUrl,
        seed: result.seed,
        model: result.model,
        createdAt: new Date().toISOString(),
        inferenceMs: result.inferenceMs,
      };
      aiHistoryRef.current.add(version);
      aiDraftRef.current = prompt;
      setAiDraftPrompt(prompt);
      const message = `AI 图片生成完成，Seed ${version.seed}`;
      setExecutionResult(message);
      setLatency(Math.round(performance.now() - startedAt));
      addHistoryItem("ai", rawText, message, 1, ["Kwai-Kolors/Kolors"]);
      setVoiceState("idle");
    } catch (error) {
      showError(error instanceof Error ? error.message : "AI 图片生成失败，请稍后重试");
    } finally {
      aiGeneratingRef.current = false;
      setAiGenerating(false);
    }
  }, [addHistoryItem, showError]);

  const executeTranscript = useCallback(async (finalTranscript: string) => {
    const normalizedTranscript = finalTranscript.replace(/\s+/g, "").trim();
    const now = Date.now();
    if (
      lastExecutedTranscriptRef.current.text === normalizedTranscript &&
      now - lastExecutedTranscriptRef.current.at < 2500
    ) return;
    lastExecutedTranscriptRef.current = { text: normalizedTranscript, at: now };
    const startedAt = performance.now();
    setTranscript(finalTranscript);

    const modeCommand = parseModeCommand(finalTranscript);
    if (modeCommand) {
      setParsedCommand(modeCommand);
      changeDrawingMode(modeCommand.mode as DrawingMode, "语音");
      addHistoryItem(modeCommand.mode as DrawingMode, finalTranscript, `已切换模式`, 0);
      setLatency(Math.round(performance.now() - startedAt));
      return;
    }

    if (drawingModeRef.current === "ai") {
      if (aiGeneratingRef.current) {
        setExecutionResult("AI 图片正在生成中，已忽略本次语音输入");
        return;
      }
      setVoiceState("processing");
      const command = parseAiCommand(finalTranscript);
      setParsedCommand(command);
      if (command.type === "promptDraft") {
        const nextPrompt = mergePrompt(aiDraftRef.current, command.text);
        aiDraftRef.current = nextPrompt;
        setAiDraftPrompt(nextPrompt);
        setExecutionResult("描述已加入提示词，请继续描述或点击“确认并生成”");
        addHistoryItem("ai", finalTranscript, "已加入待生成提示词", 0);
        setLatency(Math.round(performance.now() - startedAt));
        setVoiceState("listening");
        return;
      }

      const action = command.action;
      if (action === "generate" || action === "regenerate") {
        const message = action === "generate"
          ? "已识别生成意图，请点击“确认并生成”按钮"
          : "已识别重新生成意图，请点击“重新生成”按钮";
        setExecutionResult(message);
        addHistoryItem("ai", finalTranscript, message, 0);
        setLatency(Math.round(performance.now() - startedAt));
        setVoiceState("listening");
        return;
      }
      if (action === "undo" || action === "redo") {
        const changed = aiHistoryRef.current[action]();
        const message = changed ? `AI 图片已${action === "undo" ? "撤销" : "重做"}` : `没有可${action === "undo" ? "撤销" : "重做"}的 AI 图片`;
        setExecutionResult(message);
        if (changed) {
          addHistoryItem("ai", finalTranscript, message, 0);
          setVoiceState("listening");
        }
        else showError(message);
      } else if (action === "clear") {
        aiHistoryRef.current.versions.forEach((version: AiImageVersion) => URL.revokeObjectURL(version.imageObjectUrl));
        aiHistoryRef.current.clear();
        aiDraftRef.current = "";
        setAiDraftPrompt("");
        setExecutionResult("AI 图片与提示词已清空");
        addHistoryItem("ai", finalTranscript, "AI 图片与提示词已清空", 0);
      } else if (action === "save") {
        try {
          await saveAiImage(aiHistoryRef.current.current);
          setExecutionResult("AI 图片已保存");
          addHistoryItem("ai", finalTranscript, "AI 图片已保存", 0);
        } catch (error) {
          showError(error instanceof Error ? error.message : "保存失败");
        }
      } else if (action === "cancelDraft") {
        const prompt = aiHistoryRef.current.current?.prompt || "";
        aiDraftRef.current = prompt;
        setAiDraftPrompt(prompt);
        setExecutionResult("已取消未生成的提示词修改");
        addHistoryItem("ai", finalTranscript, "已取消未生成的提示词修改", 0);
      }
      setLatency(Math.round(performance.now() - startedAt));
      if (action !== "undo" && action !== "redo") setVoiceState("listening");
      return;
    }

    setVoiceState("processing");
    const command = parser.parse(finalTranscript);
    setParsedCommand(command);
    setVoiceState("executing");
    const result = executorRef.current?.execute(command);
    setLatency(Math.round(performance.now() - startedAt));
    if (!result?.success) {
      showError(result?.message ?? "指令执行失败，请再说一次");
      return;
    }
    setExecutionResult(result.message);
    const enrichedResult = result as typeof result & { keywords?: string[]; generatedObjects?: string[] };
    if (enrichedResult.keywords) setRecognizedKeywords(enrichedResult.keywords);
    if (enrichedResult.generatedObjects) setGeneratedObjects(enrichedResult.generatedObjects);
    addHistoryItem("canvas", finalTranscript, result.message, result.operationCount ?? 0, enrichedResult.keywords ?? []);
    setVoiceState("listening");
  }, [addHistoryItem, changeDrawingMode, executeAiGeneration, showError]);

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
        if (isFinal) {
          executeTranscript(text);
          return;
        }
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
      aiHistoryRef.current.versions.forEach((version: AiImageVersion) => URL.revokeObjectURL(version.imageObjectUrl));
    };
  }, [executeTranscript, showError]);

  const startListening = useCallback(async () => {
    if (drawingModeRef.current === "canvas" && !executorRef.current) {
      showError("画布仍在初始化，请稍后重试");
      return;
    }
    await speechRef.current?.start();
  }, [showError]);

  const stopListening = useCallback(() => {
    speechRef.current?.stop();
    setVoiceState("idle");
  }, []);

  const confirmAiGeneration = useCallback(() => {
    speechRef.current?.stop();
    void executeAiGeneration(aiDraftRef.current, "手动确认生成");
  }, [executeAiGeneration]);

  const confirmAiRegeneration = useCallback(() => {
    speechRef.current?.stop();
    const prompt = aiDraftRef.current || aiHistoryRef.current.current?.prompt || "";
    void executeAiGeneration(prompt, "手动重新生成");
  }, [executeAiGeneration]);

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
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-white">
              声绘智能画布
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
              全语音驱动创作仪表盘
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/8 bg-white/[0.035] p-1">
            <button
              type="button"
              onClick={() => changeDrawingMode("canvas")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black transition ${drawingMode === "canvas" ? "bg-cyan-400/15 text-cyan-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Shapes className="h-3 w-3" /> Canvas 矢量
            </button>
            <button
              type="button"
              onClick={() => changeDrawingMode("ai")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black transition ${drawingMode === "ai" ? "bg-violet-400/15 text-violet-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              <ImageIcon className="h-3 w-3" /> AI 图片
            </button>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] text-slate-400 sm:flex">
            {drawingMode === "canvas" ? <>
              <Palette className="h-3.5 w-3.5" style={{ color: toolState.color }} />
              <span className="font-bold text-slate-200">{localizeText(toolState.color)}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>线宽 {toolState.lineWidth}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>{localizeText(toolState.style)}</span>
            </> : <>
              <ImageIcon className="h-3.5 w-3.5 text-violet-300" />
              <span className="font-bold text-slate-200">Kwai-Kolors/Kolors</span>
              <span className="h-3 w-px bg-white/10" />
              <span>先描述，后生成</span>
            </>}
          </div>
          <div className="hidden rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] text-slate-400 xl:block">
            {drawingMode === "canvas" ? <>
              <span className="font-bold text-cyan-300">{objects.length}</span> 个对象
              <span className="mx-2 text-slate-700">·</span>
              最近：<span className="font-bold text-slate-200">{recentObjectName}</span>
            </> : <>
              <span className="font-bold text-violet-300">{aiHistory.versions.length}</span> 个图片版本
              <span className="mx-2 text-slate-700">·</span>
              Seed：<span className="font-bold text-slate-200">{aiHistory.current?.seed ?? "--"}</span>
            </>}
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

      <VoiceCanvas
        groups={groups}
        showGrid={showGrid}
        drawingMode={drawingMode}
        aiImage={aiHistory.current}
        aiGenerating={aiGenerating}
        canGenerate={Boolean(aiDraftPrompt.trim())}
        onGenerate={confirmAiGeneration}
        onRegenerate={confirmAiRegeneration}
        onEngineReady={handleEngineReady}
      />
      <VoiceFeedbackBar
        voiceState={voiceState}
        transcript={transcript}
        supported={supported}
        drawingMode={drawingMode}
        onStart={startListening}
        onStop={stopListening}
      />

      <div className="pointer-events-none absolute bottom-7 left-7 hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600 xl:flex">
        <Sparkles className="h-3 w-3 text-violet-400/70" />
        {drawingMode === "canvas" ? "试着说：“画一个夜晚城市”" : "描述画面后，点击“确认并生成”"}
      </div>
    </div>
  );

  return (
    <MainLayout
      workspace={workspace}
      sidebar={
        <ControlSidebar
          commandHistory={drawingMode === "canvas" ? canvasCommandHistory : aiCommandHistory}
          groups={groups}
          parsedCommand={parsedCommand}
          executionResult={executionResult}
          latency={latency}
          currentStyle={toolState.style}
          sceneContext={toolState}
          recognizedKeywords={recognizedKeywords}
          generatedObjects={generatedObjects}
          drawingMode={drawingMode}
          aiDraftPrompt={aiDraftPrompt}
          aiHistory={aiHistory}
          aiGenerating={aiGenerating}
          onGenerate={confirmAiGeneration}
          onRegenerate={confirmAiRegeneration}
        />
      }
    />
  );
}
