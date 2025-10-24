import React from "react";

export default function MetricCard({ icon, label, value, caption }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-inner sm:p-6">
      <div className="flex items-start gap-3">
        {icon ? <span className="text-orange-500">{icon}</span> : null}
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900 sm:mt-3 sm:text-3xl">{value}</p>
      {caption ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{caption}</p> : null}
    </div>
  );
}

