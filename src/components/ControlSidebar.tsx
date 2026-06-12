import { Box, Braces, CheckCircle2, Circle, Clock3, ImageIcon, Layers3, Lightbulb, Minus, Pentagon, Square } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { localizeCommand, localizeText } from "../localization";
import type { AiHistoryState, CommandHistoryItem, DrawOperation, DrawingMode, OperationGroup, ToolState } from "../types";
import { OBJECT_LIBRARY } from "../objectLibrary.js";

type ControlSidebarProps = {
  commandHistory: CommandHistoryItem[];
  groups: OperationGroup[];
  parsedCommand: unknown;
  executionResult: string;
  latency: number | null;
  currentStyle: string;
  sceneContext: ToolState;
  recognizedKeywords: string[];
  generatedObjects: string[];
  drawingMode: DrawingMode;
  aiDraftPrompt: string;
  aiHistory: AiHistoryState;
};

const shapeMeta: Record<string, { name: string; icon: LucideIcon }> = {
  circle: { name: "圆形", icon: Circle },
  rectangle: { name: "矩形", icon: Square },
  triangle: { name: "三角形", icon: Pentagon },
  line: { name: "线条", icon: Minus },
  arc: { name: "圆弧", icon: Minus },
  gradientBackground: { name: "渐变背景", icon: Layers3 },
  star: { name: "星点", icon: Circle },
  roundedRectangle: { name: "圆角矩形", icon: Square },
  polygon: { name: "多边形", icon: Pentagon },
  mountain: { name: "山丘", icon: Pentagon },
  wave: { name: "波浪", icon: Minus },
  cloud: { name: "云朵", icon: Circle },
  tree: { name: "树木", icon: Pentagon },
  palm: { name: "椰子树", icon: Pentagon },
};

function objectList(groups: OperationGroup[]) {
  const counts: Record<string, number> = {};
  return groups.flatMap((group, groupIndex) =>
    group.operations.map((operation: DrawOperation) => {
      counts[operation.type] = (counts[operation.type] ?? 0) + 1;
      const meta = shapeMeta[operation.type] ?? { name: "对象", icon: Box };
      return {
        id: `${groupIndex}-${operation.type}-${counts[operation.type]}`,
        name: operation.label || `${meta.name} #${counts[operation.type]}`,
        wakeWord: `${meta.name}${counts[operation.type]}号`,
        color: String(operation.color ?? "black"),
        icon: meta.icon,
      };
    }),
  );
}

export function ControlSidebar({
  commandHistory,
  groups,
  parsedCommand,
  executionResult,
  latency,
  currentStyle,
  sceneContext,
  recognizedKeywords,
  generatedObjects,
  drawingMode,
  aiDraftPrompt,
  aiHistory,
}: ControlSidebarProps) {
  const objects = objectList(groups);
  const weatherLabel = { clear: "晴朗", rain: "雨天", snow: "雪天" }[sceneContext.weather] ?? localizeText(sceneContext.weather);

  return (
    <aside className="relative z-30 hidden h-screen w-80 flex-col border-l border-white/8 bg-slate-950/75 backdrop-blur-2xl lg:flex">
      <header className="border-b border-white/8 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10">
            <Layers3 className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-white">控制中心</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {drawingMode === "canvas" ? "指令历史与画布对象" : "提示词与图片版本"}
            </p>
          </div>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {drawingMode === "ai" && (
          <section className="border-b border-white/8 px-4 py-5">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">AI 生成状态</h2>
            </div>
            <p className="text-[9px] font-bold text-slate-500">待生成提示词</p>
            <p className="mt-1 min-h-16 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-3 text-[10px] leading-5 text-violet-200/80">
              {aiDraftPrompt || "请说出画面描述，然后说“开始生成”"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-slate-500">
              <span className="rounded-lg bg-white/[0.025] p-2">模型：FLUX.1-schnell</span>
              <span className="rounded-lg bg-white/[0.025] p-2">版本：{aiHistory.versions.length}</span>
              <span className="rounded-lg bg-white/[0.025] p-2">种子：{aiHistory.current?.seed ?? "--"}</span>
              <span className="rounded-lg bg-white/[0.025] p-2">生成：{aiHistory.current?.inferenceMs ?? "--"} 毫秒</span>
            </div>
            {aiHistory.versions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {aiHistory.versions.map((version, index) => (
                  <div key={version.id} className={`rounded-lg border px-2.5 py-2 text-[9px] ${index === aiHistory.index ? "border-violet-400/30 bg-violet-400/8 text-violet-200" : "border-white/6 bg-white/[0.025] text-slate-500"}`}>
                    版本 {index + 1} · Seed {version.seed} · {version.inferenceMs} 毫秒
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="border-b border-white/8 px-4 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-cyan-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                指令历史
              </h2>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              {commandHistory.length}
            </span>
          </div>

          <div className="space-y-2">
            {commandHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-3 py-7 text-center text-xs text-slate-600">
                成功指令将在这里形成历史树
              </div>
            ) : (
              commandHistory.map((item, index) => (
                <article key={item.id} className="relative flex gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-3">
                  {index < commandHistory.length - 1 && (
                    <span className="absolute left-[22px] top-10 h-[calc(100%-1rem)] w-px bg-cyan-400/15" />
                  )}
                  <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-slate-900 text-[9px] font-black text-cyan-300">
                    {item.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-200">“{item.command}”</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-400/80">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.operationCount} 个操作
                      </span>
                      <time>{item.time}</time>
                    </div>
                    {item.keywords?.length ? <p className="mt-1 truncate text-[9px] text-cyan-400/60">关键词：{item.keywords.join("、")}</p> : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {drawingMode === "canvas" && <section className="border-b border-white/8 px-4 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-violet-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                对象检查器
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{objects.length + 1} 个图层</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white">
                <Layers3 className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-300">背景层</p>
                <p className="text-[9px] tracking-wider text-slate-600">画布背景</p>
              </div>
              <span className="rounded-md bg-slate-800 px-1.5 py-1 text-[9px] font-bold text-slate-500">固定</span>
            </div>

            {objects.map((object) => {
              const Icon = object.icon;
              return (
                <div key={object.id} className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5 transition hover:border-violet-400/20 hover:bg-violet-400/[0.035]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-slate-900">
                    <Icon className="h-4 w-4" style={{ color: object.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-300">{object.name}</p>
                    <p className="text-[9px] text-slate-600">{localizeText(object.color)}</p>
                  </div>
                  <span className="rounded-md border border-violet-400/15 bg-violet-400/8 px-1.5 py-1 text-[9px] font-bold text-violet-300">
                    唤醒：{object.wakeWord}
                  </span>
                </div>
              );
            })}
          </div>
        </section>}

        <section className="border-b border-white/8 px-4 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            <h2 className="text-[11px] font-black tracking-[0.16em] text-slate-300">{drawingMode === "canvas" ? "高级语音示例" : "AI 语音示例"}</h2>
          </div>
          <div className="space-y-2 text-[10px] text-slate-400">
            {drawingMode === "canvas" ? <>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">组合：“画一个夜晚校园，有月亮、星星、教学楼和树”</p>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">追加：“再加一些花和气球”</p>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">调整：“让画面更温暖”</p>
            </> : <>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">描述：“画一座漂浮在云端的未来城市”</p>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">修改：“再加飞船，切换为赛博朋克风格”</p>
              <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">确认：“开始生成”</p>
            </>}
          </div>
          {drawingMode === "canvas" && <p className="mt-3 text-[9px] leading-relaxed text-slate-600">可识别素材：{Object.values(OBJECT_LIBRARY).map((item) => item.label).join("、")}</p>}
        </section>

        <section className="px-4 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Braces className="h-3.5 w-3.5 text-blue-400" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
              意图监视器
            </h2>
          </div>
          <pre className="max-h-36 overflow-auto rounded-xl border border-white/6 bg-black/20 p-3 text-[10px] leading-relaxed text-blue-200/70">
            {parsedCommand ? JSON.stringify(localizeCommand(parsedCommand), null, 2) : "等待结构化指令..."}
          </pre>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2 text-[10px] text-slate-400">
              {executionResult}
            </p>
            <span className="rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-2.5 py-2 text-[10px] font-bold text-cyan-300">
              {latency ?? "--"} 毫秒
            </span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">当前风格：<span className="font-bold text-violet-300">{localizeText(currentStyle)}</span></p>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-slate-500">
            <span className="rounded bg-white/[0.025] p-1.5">场景：{localizeText(sceneContext.scene)}</span>
            <span className="rounded bg-white/[0.025] p-1.5">时间：{localizeText(sceneContext.time)}</span>
            <span className="rounded bg-white/[0.025] p-1.5">天气：{weatherLabel}</span>
          </div>
          <p className="mt-2 text-[9px] text-cyan-300/70">本次关键词：{recognizedKeywords.length ? recognizedKeywords.join("、") : "等待识别"}</p>
          <p className="mt-1 truncate text-[9px] text-violet-300/65">本次生成：{generatedObjects.length ? `${generatedObjects.length} 个对象 · ${generatedObjects.slice(0, 4).join("、")}` : "等待生成"}</p>
        </section>
      </div>
    </aside>
  );
}
