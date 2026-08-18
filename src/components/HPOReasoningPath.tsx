import { useState } from 'react'
import { Experiment, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'

export default function HPOReasoningPath({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const [open, setOpen] = useState(true)
  const analysisLocal = analysis || analyzeExperiment(exp)
  const trace = analysisLocal.decisionTrace || []

  return (
    <div className="card mt-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">HPO Reasoning Path</h4>
          <div className="text-sm text-slate-400">How HPO Architect reached this recommendation</div>
        </div>
        <div>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>setOpen(o=>!o)}>{open? 'Hide reasoning':'Show reasoning'}</button>
        </div>
      </div>

      <div className={`mt-4 transition-all ${open? 'max-h-[2000px]':'max-h-0 overflow-hidden'}`}>
        <div className="hidden grid-cols-[minmax(0,1fr)_2rem_minmax(0,1.2fr)_2rem_minmax(0,0.9fr)] items-center gap-2 px-3 pb-2 text-xs font-semibold uppercase text-slate-400 md:grid">
          <div>Observation</div>
          <div></div>
          <div>Implication</div>
          <div></div>
          <div>Favors</div>
        </div>

        {trace.length===0 ? (
          <div className="border-t border-slate-800 py-4 text-sm text-slate-400">No explicit decision trace available.</div>
        ) : trace.map((t,i)=>(
          <div key={i} className="grid grid-cols-1 gap-2 border-t border-slate-800 py-4 md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1.2fr)_2rem_minmax(0,0.9fr)] md:items-center md:gap-2">
            <div className="border-l-2 border-slate-600 px-3 py-1">
              <div className="text-xs font-semibold uppercase text-slate-400 md:hidden">Observation</div>
              <div className="mt-1 font-medium md:mt-0">{t.observation}</div>
            </div>
            <div aria-hidden="true" className="hidden items-center justify-center text-xl text-slate-500 md:flex">→</div>
            <div className="border-l-2 border-slate-700 px-3 py-1">
              <div className="text-xs font-semibold uppercase text-slate-400 md:hidden">Implication</div>
              <div className="mt-1 text-slate-200 md:mt-0">{t.implication}</div>
            </div>
            <div aria-hidden="true" className="hidden items-center justify-center text-xl text-slate-500 md:flex">→</div>
            <div className="border-l-2 border-slate-700 px-3 py-1">
              <div className="text-xs font-semibold uppercase text-slate-400 md:hidden">Favors</div>
              {t.favors && t.favors.length>0 ? (
                <ul className="mt-1 list-disc pl-5 text-sm md:mt-0">{t.favors.map((f,fi)=>(<li key={fi}>{f}</li>))}</ul>
              ) : <div className="mt-1 text-slate-500 md:mt-0">—</div>}
            </div>
          </div>
        ))}

        <div className="mt-2 border-l-4 border-cyan-400 bg-slate-900 px-4 py-3">
          <div className="text-xs font-semibold uppercase text-slate-400">Final decision</div>
          <div className="mt-1 text-2xl font-bold">{analysisLocal.recommendedMethod?.name || '—'}</div>
          <div className="mt-1 text-sm text-cyan-200">{analysisLocal.recommendedMethod?.suitability || ''}</div>
        </div>
      </div>
    </div>
  )
}
