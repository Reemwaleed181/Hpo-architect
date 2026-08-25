import { Hyperparam } from '../lib/hpo-engine'
import Card from './ui/Card'
import ScientificEvidence from './ScientificEvidence'

export default function SearchSpaceBuilder({ params, onChange }:{ params: Hyperparam[], onChange:(p:Hyperparam[])=>void }){
  function addParam(){
    onChange([...params, { name: `param_${params.length+1}`, type: { kind: 'categorical', values: ['option1','option2'] }, gridPoints: null }])
  }
  function remove(i:number){ const copy = params.slice(); copy.splice(i,1); onChange(copy) }

  function duplicate(i:number){ const copy = params.slice(); copy.splice(i+1,0,{...params[i], name: params[i].name+'_copy'}); onChange(copy) }

  const nameCounts = params.reduce((acc, p)=>{ acc[p.name]=(acc[p.name]||0)+1; return acc }, {} as Record<string,number>)

  function continuousInvalid(p: Hyperparam){
    return p.type.kind === 'continuous' && ((p.type as any).min >= (p.type as any).max)
  }
  function integerInvalid(p: Hyperparam){
    return p.type.kind === 'integer' && ((p.type as any).min >= (p.type as any).max)
  }

  const counts = params.reduce((acc, p)=>{
    acc.total++
    if (p.conditionalOn) acc.conditional++
    if (p.type.kind === 'continuous') acc.continuous++
    if (p.type.kind === 'integer') acc.integer++
    if (p.type.kind === 'categorical' || p.type.kind === 'discrete') acc.categorical++
    return acc
  }, { total:0, continuous:0, integer:0, categorical:0, conditional:0 })

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Search Space</h3>
        <div className="flex gap-3 text-sm text-slate-400">
          <div>Dimensions <strong className="text-white">{counts.total}</strong></div>
          <div>Continuous <strong className="text-white">{counts.continuous}</strong></div>
          <div>Categorical <strong className="text-white">{counts.categorical}</strong></div>
          <div>Conditional <strong className="text-white">{counts.conditional}</strong></div>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {params.map((p, i)=> (
          <div key={i} className="p-3 border border-slate-800 rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div className="font-medium text-lg">{p.name}</div>
                </div>
                <div className="text-sm text-slate-400 mt-1">{p.type.kind.toUpperCase()}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-slate-700 rounded text-sm" onClick={()=>duplicate(i)}>Duplicate</button>
                <button className="px-2 py-1 bg-slate-700 rounded text-sm" onClick={()=>remove(i)}>Remove</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-slate-400">Type</div>
                <div className="mt-1 text-sm">{p.type.kind}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Sampling</div>
                <div className="mt-1 text-sm">{(p.type as any).scale || 'linear'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Grid discretization</div>
                <div className="mt-1 text-sm">{p.gridPoints? String(p.gridPoints): 'Not defined'}</div>
              </div>
            </div>

            <div className="mt-3">
              {p.type.kind === 'continuous' && (
                <div className="text-sm">
                  <div>Range: {(p.type as any).min} — {(p.type as any).max}</div>
                </div>
              )}
              {p.conditionalOn && (<div className="mt-2 text-sm text-slate-400">↳ active when {p.conditionalOn.name} = {p.conditionalOn.value}</div>)}
            </div>

            <div className="mt-2 text-xs text-slate-400">
              {(nameCounts[p.name] > 1) && (<div className="text-amber-400">Duplicate parameter name detected.</div>)}
              {continuousInvalid(p) && (<div className="text-red-400">Invalid range: min ≥ max</div>)}
              {integerInvalid(p) && (<div className="text-red-400">Invalid range: min ≥ max</div>)}
            </div>
          </div>
        ))}
        <div>
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={addParam}>Add Hyperparameter</button>
        </div>
      </div>
      <ScientificEvidence referenceIds={['feurer2019','bischl2023']} compact />
    </Card>
  )
}
