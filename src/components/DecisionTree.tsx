import { Experiment, AnalysisResult } from '../lib/hpo-engine'

export default function DecisionTree({ analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const selected = analysis?.recommendedMethod?.name || null
  const nodes = ['Grid Search','Random Search','Bayesian Optimization','Successive Halving','Hyperband','ASHA','Bayesian + Multi-Fidelity','BOHB']

  return (
    <div className="card mt-4">
      <h4 className="font-semibold">Decision Diagram</h4>
      <div className="mt-1 text-xs text-slate-500">Candidate methods are alternatives, not sequential stages.</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {nodes.map(n=>{
          const active = selected === n
          return (
            <div key={n} className={`flex min-h-14 items-center justify-center border px-2 text-center text-xs leading-tight ${active ? 'border-cyan-400 bg-slate-800 font-semibold text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
              {n}
            </div>
          )
        })}
      </div>
      <div className="mt-3 text-sm text-slate-400">Highlighted method is the primary literature-informed recommendation for the entered conditions; alternatives remain visible for empirical comparison.</div>
    </div>
  )
}
