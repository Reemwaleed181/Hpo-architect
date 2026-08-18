import React from 'react'
import { Experiment, calculateGridSize, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'

export default function DecisionTree({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || null
  const selected = analysisLocal?.recommendedMethod?.name || null
  const nodes = ['Grid Search','Random Search','Bayesian Optimization','Hyperband','ASHA']

  return (
    <div className="card mt-4">
      <h4 className="font-semibold">Decision Diagram</h4>
      <div className="mt-3">
        <div className="flex min-h-28 items-center py-4">
          {nodes.map((n,i)=>{
            const active = selected && n.toLowerCase().includes(selected.toLowerCase())
            return (
              <React.Fragment key={n}>
                <div className={`flex h-14 min-w-0 flex-1 items-center justify-center border px-1 text-center text-xs leading-tight ${active ? 'border-cyan-400 bg-slate-800 font-semibold text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
                  {n}
                </div>
                {i < nodes.length-1 && <div aria-hidden="true" className="w-2 shrink-0 text-center text-slate-600">→</div>}
              </React.Fragment>
            )
          })}
        </div>
        <div className="mt-2 text-sm text-slate-400">Highlighted node corresponds to the engine recommendation.</div>
      </div>
    </div>
  )
}
