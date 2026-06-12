import { Box, Braces, CheckCircle2, Circle, Clock3, Layers3, Minus, Pentagon, Square } from "lucide-react";

import type { CommandHistoryItem, DrawOperation, OperationGroup } from "../types";

type ControlSidebarProps = {
  commandHistory: CommandHistoryItem[];
  groups: OperationGroup[];
  parsedCommand: unknown;
  executionResult: string;
  latency: number | null;
};

const shapeMeta = {
  circle: { name: "圆形", icon: Circle },
  rectangle: { name: "矩形", icon: Square },
  triangle: { name: "三角形", icon: Pentagon },
  line: { name: "线条", icon: Minus },
  arc: { name: "圆弧", icon: Minus },
} as const;

function objectList(groups: OperationGroup[]) {
  const counts: Record<string, number> = {};
  return groups.flatMap((group, groupIndex) =>
    group.operations.map((operation: DrawOperation) => {
      counts[operation.type] = (counts[operation.type] ?? 0) + 1;
      const meta = shapeMeta[operation.type] ?? { name: "对象", icon: Box };
      return {
        id: `${groupIndex}-${operation.type}-${counts[operation.type]}`,
        name: `${meta.name} #${counts[operation.type]}`,
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
}: ControlSidebarProps) {
  const objects = objectList(groups);

  return (
    <aside className="relative z-30 hidden h-screen w-80 flex-col border-l border-white/8 bg-slate-950/75 backdrop-blur-2xl lg:flex">
      <header className="border-b border-white/8 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10">
            <Layers3 className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-white">Control Console</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              History & objects
            </p>
          </div>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <section className="border-b border-white/8 px-4 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-cyan-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                Command History
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
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="border-b border-white/8 px-4 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-violet-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                Object Inspector
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{objects.length + 1} layers</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white">
                <Layers3 className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-300">背景层</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">Canvas background</p>
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
                    <p className="text-[9px] text-slate-600">{object.color}</p>
                  </div>
                  <span className="rounded-md border border-violet-400/15 bg-violet-400/8 px-1.5 py-1 text-[9px] font-bold text-violet-300">
                    唤醒：{object.wakeWord}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-4 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Braces className="h-3.5 w-3.5 text-blue-400" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
              Intent Monitor
            </h2>
          </div>
          <pre className="max-h-36 overflow-auto rounded-xl border border-white/6 bg-black/20 p-3 text-[10px] leading-relaxed text-blue-200/70">
            {parsedCommand ? JSON.stringify(parsedCommand, null, 2) : "等待结构化指令..."}
          </pre>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <p className="rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2 text-[10px] text-slate-400">
              {executionResult}
            </p>
            <span className="rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-2.5 py-2 text-[10px] font-bold text-cyan-300">
              {latency ?? "--"} ms
            </span>
          </div>
        </section>
      </div>
    </aside>
  );
}
