import React from 'react'

export default function Stepper({ steps, active, onSelect }:{ steps:string[], active:number, onSelect:(i:number)=>void }){
  return (
    <div className="w-full mx-auto max-w-4xl">
      <div className="flex items-center justify-between text-sm text-slate-400">
        {steps.map((s, i)=> (
          <div key={s} className="flex-1 text-center">
            <button onClick={()=>onSelect(i)} className={`inline-flex items-center gap-3 ${i===active? 'text-cyan-200':''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i===active? 'bg-cyan text-navy':'bg-slate-800'}`}>{String(i+1).padStart(2,'0')}</div>
              <div className="hidden sm:block">{s}</div>
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1 bg-slate-800 rounded overflow-hidden">
        <div className="h-1 bg-cyan" style={{ width: `${((active+1)/steps.length)*100}%` }}></div>
      </div>
    </div>
  )
}
