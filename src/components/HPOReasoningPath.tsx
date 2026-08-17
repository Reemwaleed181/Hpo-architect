import React, { useState } from 'react'
import { Experiment, calculateGridSize, humanReadableCount, recommendStrategy, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'

function nodeClass(kind:'input'|'analysis'|'decision'){
  if (kind==='input') return 'bg-slate-800 border border-slate-700'
  if (kind==='analysis') return 'bg-slate-900 border border-slate-700'
  return 'bg-cyan text-navy border border-cyan'
}

export default function HPOReasoningPath({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const [open, setOpen] = useState(false)
  const analysisLocal = analysis || analyzeExperiment(exp)
  const grid = analysisLocal.gridInfo
  const continuousCount = exp.params.filter(p=>p.type.kind==='continuous').length
  const decision = analysisLocal.recommendedMethod?.name || '—'

  const inputs = [
    `${exp.params.length} hyperparameters`,
    `${continuousCount} continuous dimension${continuousCount!==1?'s':''}`,
    `${exp.trialTimeMinutes} min per full trial`,
    `${Math.round(exp.budgetMinutes/60*100)/100} compute-hours available`,
    exp.iterative? 'Intermediate metrics available' : 'No intermediate metrics',
    exp.earlyStopping? 'Early stopping enabled' : 'No early stopping'
  ]

  // Render decisionTrace entries from analysis rather than reconstructing logic locally
  const trace = analysisLocal.decisionTrace || []

  return (
    <div className="card mt-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">HPO Reasoning Path</h4>
          <div className="text-sm text-slate-400">How HPO Architect reached this recommendation</div>
        </div>
        <div>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>setOpen(o=>!o)}>{open? 'Hide':'Explain My Recommendation'}</button>
        </div>
      </div>

      <div className={`mt-4 transition-all ${open? 'max-h-[2000px]':'max-h-0 overflow-hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-400 mb-2">INPUT</div>
            <div className="space-y-2">
              {inputs.map((t,i)=>(<div key={i} className={`p-3 rounded ${nodeClass('input')}`}>{t}</div>))}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400 mb-2">ANALYSIS</div>
            <div className="space-y-2">
              {trace.length===0 ? <div className={`p-3 rounded ${nodeClass('analysis')}`}>No explicit decision trace available.</div> : trace.map((t,i)=>(
                <div key={i} className={`p-3 rounded ${nodeClass('analysis')}`}>
                  <div className="font-semibold">Observation</div>
                  <div className="text-sm">{t.observation}</div>
                  <div className="font-semibold mt-2">Implication</div>
                  <div className="text-sm">{t.implication}</div>
                  {t.favors && t.favors.length>0 && (
                    <div className="font-semibold mt-2">Favors</div>
                  )}
                  {t.favors && t.favors.map((f,fi)=>(<div key={fi} className="text-sm">- {f}</div>))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400 mb-2">DECISION</div>
            <div className="space-y-2">
              <div className={`p-4 rounded ${nodeClass('decision')}`}>
                <div className="text-sm text-slate-800 font-semibold">{decision}</div>
                <div className="text-xs text-slate-900 mt-1">{analysisLocal.recommendedMethod?.suitability}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
