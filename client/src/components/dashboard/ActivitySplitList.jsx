import React from "react";
import { ActivityIcon } from "./ActivityIcon";

export default function ActivitySplitList({ items }) {
  if (!items?.length) return <p className="text-sm text-slate-400">Not enough data yet</p>;
  return (
    <ul className="space-y-2">
      {items.map(({ type, count, percentage }) => (
        <li key={type} className="flex items-center gap-3">
          <ActivityIcon type={type} className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs text-slate-600 sm:text-sm">
              <span className="truncate">{type}</span>
              <span className="tabular-nums text-slate-500">{count} · {percentage.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

