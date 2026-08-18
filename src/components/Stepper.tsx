import React from 'react'

export default function Stepper({ steps, active, onSelect }:{ steps:string[], active:number, onSelect:(i:number)=>void }){
  return (
    <div className="w-full mx-auto max-w-4xl">
      <div className="flex items-center gap-4 text-sm">
        {steps.map((s, i)=> (
          <div key={s} className="flex items-center gap-3">
            <button onClick={()=>onSelect(i)} className={`inline-flex items-center gap-3 px-3 py-2 rounded-md ${i===active? 'ring-2 ring-cyan-400 bg-slate-800':'bg-transparent'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${i<active? 'bg-cyan text-navy':'bg-slate-800 text-slate-300'} ${i===active? 'ring-2 ring-cyan-300 bg-slate-800 text-cyan-200':''}`}>{i<active? '✓': String(i+1).padStart(2,'0')}</div>
              <div className="hidden md:block text-left">
                <div className={`text-xs ${i<=active? 'text-slate-300':'text-slate-500'}`}>{String(i+1).padStart(2,'0')} {s.split(' ')[0].toUpperCase()}</div>
                <div className={`text-sm font-medium ${i===active? 'text-white':'text-slate-300'}`}>{s}</div>
              </div>
            </button>
            {i < steps.length-1 && <div className={`flex-1 h-0.5 ${i<active? 'bg-cyan':'bg-slate-800'}`}></div>}
          </div>
        ))}
      </div>
    </div>
  )
}
