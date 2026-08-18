import React from 'react'

export default function MetricCard({ label, value, hint }:{ label:string, value:string|number, hint?:string }){
  return (
    <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-center">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}
