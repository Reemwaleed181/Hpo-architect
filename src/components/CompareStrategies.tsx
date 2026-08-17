import React from 'react'
import { MethodAnalysis } from '../lib/hpo-engine'

export default function CompareStrategies({ methods }:{ methods: MethodAnalysis[] }){
  return (
    <div className="card mt-4">
      <h4 className="font-semibold">Compare Strategies</h4>
      <div className="mt-3 grid gap-3">
        {methods.map(m=> (
          <div key={m.name} className="p-3 border border-slate-800 rounded">
            <div className="flex justify-between items-center">
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-slate-400">{m.suitability}</div>
            </div>
            <div className="mt-2 text-sm text-slate-400">Strength: {m.whyFits[0] || '—'}</div>
            <div className="mt-1 text-sm text-slate-400">Limitation: {m.whyNot[0] || '—'}</div>
            <details className="mt-2"><summary className="text-slate-300 text-sm">Why this fits / why not</summary>
              <div className="mt-2 text-sm">
                <div className="font-semibold">Why it fits</div>
                <ul className="list-disc pl-6 mt-1 text-sm">{m.whyFits.map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                <div className="font-semibold mt-2">Why not</div>
                <ul className="list-disc pl-6 mt-1 text-sm">{m.whyNot.map((s,i)=>(<li key={i}>{s}</li>))}</ul>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
