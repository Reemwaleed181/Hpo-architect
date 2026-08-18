import { useEffect, useState } from 'react'
import { Experiment, AnalysisResult } from '../lib/hpo-engine'

export default function PresentationMode({ exp, analysis, onExit }:{ exp: Experiment, analysis: AnalysisResult, onExit: ()=>void }){
  const slides = [
    { title: 'Experiment Summary', render: () => (
      <div>
        <div className="text-4xl font-bold">{exp.name}</div>
        <div className="text-xl mt-2">Model: {exp.model} • Metric: {exp.metric}</div>
        <div className="mt-3 text-lg">Samples: {exp.samples} • Features: {exp.features}</div>
      </div>
    )},
    { title: 'Search Space', render: () => (
      <div>
        <div className="text-2xl font-bold">Search Space</div>
        <div className="mt-3">Dimensions: {exp.params.length}</div>
      </div>
    )},
    { title: 'Compute Challenge', render: () => (
      <div>
        <div className="text-2xl font-bold">Compute</div>
        <div className="mt-3">Trial: {exp.trialTimeMinutes} min • Budget: {exp.budgetMinutes} min • Workers: {exp.workers}</div>
      </div>
    )},
    { title: 'Grid Feasibility', render: () => (
      <div>
        <div className="text-2xl font-bold">Grid Feasibility</div>
        <div className="mt-3">{analysis.gridInfo.exactGridSizeAvailable ? 'Exact grid metrics available' : 'Exact grid size not available for conditional spaces'}</div>
      </div>
    )},
    { title: 'Recommended HPO Strategy', render: () => (
      <div>
        <div className="text-4xl font-bold">{analysis.recommendedMethod?.name || '—'}</div>
        <div className="mt-2 text-xl">{analysis.recommendedMethod?.suitability}</div>
      </div>
    )},
    { title: 'HPO Reasoning Path', render: () => (
      <div>
        {analysis.decisionTrace.map((t,i)=>(<div key={i} className="mt-2"><div className="font-semibold">{t.observation}</div><div className="text-slate-400">{t.implication}</div></div>))}
      </div>
    )},
    { title: 'Decision Tree', render: () => (
      <div>
        <div className="text-2xl font-bold">Decision Diagram</div>
        <div className="mt-3">Final: {analysis.recommendedMethod?.name}</div>
      </div>
    )},
    { title: 'Compare Strategies', render: () => (
      <div>
        <div className="text-2xl font-bold">Strategy Comparison</div>
      </div>
    )},
    { title: 'Blueprint Summary', render: () => (
      <div>
        <div className="text-2xl font-bold">Blueprint</div>
        <div className="mt-2">Recommended: {analysis.recommendedMethod?.name}</div>
      </div>
    )},
  ]

  const [idx, setIdx] = useState(0)

  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i+1, slides.length-1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i-1, 0))
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  },[onExit])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-300">Presentation Mode</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-slate-800 rounded" onClick={()=>setIdx(i=>Math.max(i-1,0))}>← Previous</button>
            <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>setIdx(i=>Math.min(i+1, slides.length-1))}>Next →</button>
            <button className="px-3 py-2 bg-rose-600 rounded" onClick={onExit}>Exit</button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-slate-400 text-sm">{slides[idx].title}</div>
          <div className="mt-6">{slides[idx].render()}</div>
        </div>

        <div className="mt-10 text-center text-slate-400">Slide {idx+1} / {slides.length}</div>
      </div>
    </div>
  )
}
