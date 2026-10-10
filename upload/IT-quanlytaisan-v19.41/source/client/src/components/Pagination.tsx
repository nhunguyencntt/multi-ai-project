import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export const PAGE_SIZE = 12;

export function Pagination({ page, total, onChange, pageSize = PAGE_SIZE }: { page: number; total: number; onChange: (page: number) => void; pageSize?: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const current = Math.min(page, pages);
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const items: ReactNode[] = [];
  for (let p = start; p <= end; p++) items.push(<button key={p} type="button" onClick={() => onChange(p)} className={`min-w-8 rounded-lg px-2.5 py-2 text-[11px] font-bold ${p === current ? "bg-[#087f72] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{p}</button>);
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3"><span className="text-[11px] text-slate-400">Trang {current}/{pages} · {total} bản ghi · 12 hàng/trang</span><div className="flex items-center gap-1.5"><button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5"/></button>{items}<button type="button" disabled={current >= pages} onClick={() => onChange(current + 1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5"/></button></div></div>;
}
