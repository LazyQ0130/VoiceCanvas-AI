import type { ReactNode } from "react";

type MainLayoutProps = {
  workspace: ReactNode;
  sidebar: ReactNode;
};

export function MainLayout({ workspace, sidebar }: MainLayoutProps) {
  return (
    <main className="relative grid h-screen min-h-[680px] overflow-hidden bg-slate-950 text-slate-100 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.13),transparent_32%),radial-gradient(circle_at_80%_100%,rgba(139,92,246,0.12),transparent_28%)]" />
      <section className="relative min-w-0 overflow-hidden">{workspace}</section>
      {sidebar}
    </main>
  );
}
